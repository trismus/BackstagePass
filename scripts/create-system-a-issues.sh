#!/usr/bin/env bash
# =============================================================================
# BackstagePass — GitHub Issues & Milestone: System A Abschaffung
# =============================================================================
# Voraussetzung: gh CLI installiert und eingeloggt (gh auth login)
# Ausführen: bash scripts/create-system-a-issues.sh
# =============================================================================

set -euo pipefail

REPO="trismus/BackstagePass"
MILESTONE_TITLE="System A Abschaffung"
MILESTONE_DESC="Kontrolierter Abbau von System A (helfer_events / helfer_rollen_* / helfer_anmeldungen) zugunsten von System B als führendem Helfersystem. Siehe docs/strategy/system-a-abschaffung-roadmap.md"
MILESTONE_DUE="2026-09-30T00:00:00Z"

echo "🎭 BackstagePass — System A Abschaffung Issues erstellen"
echo "========================================================="
echo ""

# --- Milestone erstellen ---
echo "📌 Erstelle Milestone: '$MILESTONE_TITLE'..."
MILESTONE_NUM=$(gh api \
  --method POST \
  -H "Accept: application/vnd.github+json" \
  /repos/$REPO/milestones \
  -f title="$MILESTONE_TITLE" \
  -f description="$MILESTONE_DESC" \
  -f due_on="$MILESTONE_DUE" \
  -f state="open" \
  --jq '.number')

echo "✅ Milestone #$MILESTONE_NUM erstellt"
echo ""

# --- Labels sicherstellen ---
echo "🏷️  Stelle sicher dass Labels existieren..."

gh api --method POST /repos/$REPO/labels \
  -f name="system-a-cleanup" -f color="e4e669" -f description="System A Abbau" 2>/dev/null \
  && echo "   ✅ Label 'system-a-cleanup' erstellt" \
  || echo "   ℹ️  Label 'system-a-cleanup' existiert bereits"

echo ""

# =============================================================================
# PHASE 0 — Datenbasis erheben
# =============================================================================
echo "📋 Phase 0 — Datenbasis erheben..."

gh issue create \
  --repo "$REPO" \
  --milestone "$MILESTONE_TITLE" \
  --label "database,system-a-cleanup,prio:high" \
  --title "chore: System A Datenbasis erheben (Phase 0)" \
  --body "## Ziel

Bevor Code oder Tabellen gelöscht werden: verstehen was in System A noch aktiv ist.

## Hintergrund

System A (\`helfer_events\` → \`helfer_rollen_instanzen\` → \`helfer_anmeldungen\`) ist eingefroren. Bevor wir mit dem Cleanup beginnen, brauchen wir eine Datenbasis — insbesondere ob noch zukünftige Events oder aktive Anmeldungen existieren.

## Aufgaben

\`\`\`sql
-- 1. Anmeldungen nach Status
SELECT status, COUNT(*) FROM helfer_anmeldungen GROUP BY status;

-- 2. Zukünftige Events
SELECT COUNT(*) FROM helfer_events WHERE datum_end >= NOW();

-- 3. Verknüpfte Veranstaltungen
SELECT he.name, v.titel, he.datum_start
FROM helfer_events he
LEFT JOIN veranstaltungen v ON he.veranstaltung_id = v.id
WHERE he.datum_end >= NOW();

-- 4. Aktive Anmeldungen in der Zukunft
SELECT ha.status, COUNT(*)
FROM helfer_anmeldungen ha
JOIN helfer_rollen_instanzen hri ON ha.rollen_instanz_id = hri.id
JOIN helfer_events he ON hri.helfer_event_id = he.id
WHERE he.datum_end >= NOW()
GROUP BY ha.status;

-- 5. Wartelisten-Einträge
SELECT COUNT(*) FROM helfer_anmeldungen WHERE status = 'warteliste';
\`\`\`

## Deliverable

Kurzer Kommentar in diesem Issue mit:
- Anzahl aktiver Anmeldungen (Status ≠ abgelehnt/storniert)
- Datum des letzten zukünftigen Events
- Anzahl Wartelisten-Einträge

## Entscheidungsgrundlage

- 0 zukünftige Events → Phase 1.3 (Warteliste) überspringen
- >50 aktive Anmeldungen → Migrationsstrategie ausarbeiten

## Referenz

Siehe [docs/strategy/system-a-abschaffung-roadmap.md](../docs/strategy/system-a-abschaffung-roadmap.md) — Phase 0"

echo "   ✅ Issue erstellt: Phase 0"

# =============================================================================
# PHASE 1.1 — Öffentliche Abmeldung System B
# =============================================================================
echo "📋 Phase 1.1 — Öffentliche Abmeldung System B..."

gh issue create \
  --repo "$REPO" \
  --milestone "$MILESTONE_TITLE" \
  --label "feature,backend,frontend,system-a-cleanup,prio:high" \
  --title "feat: Öffentliche Abmeldung für System B (Token-Flow)" \
  --body "## Ziel

System B braucht einen öffentlichen Abmeldungs-Flow via Token — analog zu System A's \`/helfer/helferliste/abmeldung/[token]\`.

## Hintergrund

Das Feld \`abmeldung_token\` existiert bereits auf \`auffuehrung_zuweisungen\` in der DB. Es fehlt nur der UI-Flow.

## Scope

### Backend
- Server Action \`cancelZuweisungByToken(token: string)\`
  - Token validieren (UUID-Format)
  - Zuweisung via \`abmeldung_token\` finden
  - Frist prüfen: \`veranstaltungen.helfer_buchung_deadline\`
  - Status auf \`abgesagt\` setzen
  - E-Mail-Bestätigung senden (→ abhängig von Issue: E-Mail-Benachrichtigungen)
  - Return: \`{ success: true } | { success: false; error: string }\`

### Route
\`\`\`
app/(public)/helfer/abmeldung/[token]/
├── page.tsx          # Bestätigungsseite mit Zuweisung-Details
├── actions.ts        # cancelZuweisungByToken
└── CancellationForm.tsx
\`\`\`

### UI-Flow
1. Token aus URL → Zuweisung laden (Veranstaltung, Schicht, Zeitblock)
2. Übersicht anzeigen: «Du möchtest dich von [Rolle] bei [Veranstaltung] abmelden»
3. Bestätigen-Button → Abmeldung ausführen
4. Erfolgsseite oder Fehler (Token ungültig / Frist abgelaufen / bereits abgemeldet)

### Redirect
Alte System-A-Abmeldungs-URLs umleiten:
\`\`\`typescript
// middleware.ts
// /helfer/helferliste/abmeldung/[token] → /helfer/abmeldung/[token]
\`\`\`

## Vorbild

Bestehende Implementierung in \`app/(public)/helfer/helferliste/abmeldung/[token]/\` als Referenz.

## Tests

- Unit: \`cancelZuweisungByToken\` — ungültiger Token, abgelaufene Frist, bereits abgesagt
- E2E: Abmeldungs-Flow von Anfang bis Ende

## Referenz

Siehe [docs/strategy/system-a-abschaffung-roadmap.md](../docs/strategy/system-a-abschaffung-roadmap.md) — Phase 1.1"

echo "   ✅ Issue erstellt: Phase 1.1 Öffentliche Abmeldung"

# =============================================================================
# PHASE 1.2 — E-Mail-Benachrichtigungen System B
# =============================================================================
echo "📋 Phase 1.2 — E-Mail-Benachrichtigungen System B..."

gh issue create \
  --repo "$REPO" \
  --milestone "$MILESTONE_TITLE" \
  --label "feature,backend,system-a-cleanup,prio:high" \
  --title "feat: E-Mail-Benachrichtigungen für System B vervollständigen" \
  --body "## Ziel

System B soll die gleichen E-Mail-Benachrichtigungen wie System A haben.

## Hintergrund

System A hat in \`lib/actions/helferliste-notifications.ts\` (736 Zeilen) vollständige E-Mail-Flows. System B hat das \`upcoming_schedule\` Template (Migration \`20260420080000\`), aber keine transaktionalen Bestätigungs-Mails bei Anmeldung/Abmeldung.

## Scope

### Neue Datei: \`lib/actions/schichten-notifications.ts\`

Folgende Funktionen implementieren (analog zu \`helferliste-notifications.ts\`):

| Funktion | Trigger | Template |
|----------|---------|----------|
| \`sendZuweisungBestaetigung()\` | Nach Anmeldung via \`/helfer/anmeldung/[token]\` | \`confirmation\` |
| \`sendZuweisungAbmeldung()\` | Nach Abmeldung via Token | \`cancellation\` |
| \`sendZuweisungErinnerung48h()\` | Cron: 48h vor Veranstaltung | \`reminder_48h\` |

### E-Mail-Template-Inhalte

Für System B Datenstrukturen anpassen:
- Veranstaltung: \`titel\`, \`datum\`, \`ort\`
- Zeitblock: \`name\`, \`startzeit\`, \`endzeit\`
- Schicht: \`rolle\`
- Abmeldungs-Link: \`/helfer/abmeldung/[abmeldung_token]\`

### Integration in externe Registrierung

In \`lib/actions/external-registration.ts\` nach erfolgreicher Buchung \`sendZuweisungBestaetigung()\` aufrufen.

### Hinweis: Kommentar-Header korrigieren

\`external-registration.ts\` ist fälschlicherweise als \`@deprecated\` markiert — dieser Kommentar muss entfernt werden. Die Datei ist der aktive System-B-Public-Registrierungsflow.

## Tests

- Unit: Mocked E-Mail-Client, Daten-Extraktion aus System-B-Typen
- Integration: E-Mail wird bei Registrierung versendet

## Referenz

Siehe [docs/strategy/system-a-abschaffung-roadmap.md](../docs/strategy/system-a-abschaffung-roadmap.md) — Phase 1.2"

echo "   ✅ Issue erstellt: Phase 1.2 E-Mail-Benachrichtigungen"

# =============================================================================
# PHASE 2.1 — helfer-dashboard.ts vereinfachen
# =============================================================================
echo "📋 Phase 2 — Integrationspunkte entflechten..."

gh issue create \
  --repo "$REPO" \
  --milestone "$MILESTONE_TITLE" \
  --label "backend,system-a-cleanup,prio:medium" \
  --title "refactor: helfer-dashboard.ts — System A Merge-Logik entfernen" \
  --body "## Ziel

\`lib/actions/helfer-dashboard.ts\` enthält Merge-Logik die System-A- und System-B-Daten zusammenführt. Nach dem Einfrieren von System A kann diese Komplexität entfernt werden.

## Scope

### \`getHelferDashboardData()\`
- \`systemAEntries\`-Block entfernen (Mapping von \`anmeldungen\` aus RPC)
- RPC \`get_helfer_dashboard_data\` prüfen: System-A-Teil aus der DB-Funktion entfernen oder Funktion ganz ersetzen
- Funktion gibt nur noch System-B-Zuweisungen zurück

### \`getAuthenticatedHelferDashboard()\`
- \`helfer_anmeldungen\`-Query (ca. 40 Zeilen) entfernen
- \`systemAEntries\`-Array und Merge entfernen
- Funktion gibt nur noch \`systemBEntries\` zurück

### Typ-Cleanup
- \`HelferDashboardAnmeldung.system: 'a' | 'b'\` → Feld entfernen
- \`HelferDashboardZuweisung\` bleibt (System B)

### DB-Funktion bereinigen
\`\`\`sql
-- get_helfer_dashboard_data: System-A-Teil (anmeldungen) aus RETURNS entfernen
-- Nur noch zuweisungen aus System B zurückgeben
\`\`\`

## Abhängigkeit

Erst ausführen wenn keine aktiven System-A-Anmeldungen mehr in der Zukunft (→ Phase 0).

## Tests

- Bestehende Tests in \`helfer-dashboard.test.ts\` (falls vorhanden) anpassen

## Referenz

Siehe [docs/strategy/system-a-abschaffung-roadmap.md](../docs/strategy/system-a-abschaffung-roadmap.md) — Phase 2.1"

echo "   ✅ Issue erstellt: Phase 2.1 helfer-dashboard.ts"

gh issue create \
  --repo "$REPO" \
  --milestone "$MILESTONE_TITLE" \
  --label "backend,system-a-cleanup,prio:medium" \
  --title "refactor: persoenlicher-kalender.ts — helfer_anmeldungen entfernen" \
  --body "## Ziel

\`lib/actions/persoenlicher-kalender.ts\` fragt \`helfer_anmeldungen\` (System A) ab und mischt diese in den persönlichen Kalender. Diese Quelle entfernen.

## Scope

### Query entfernen
- \`helfer_anmeldungen\`-Query mit Join auf \`helfer_rollen_instanzen\` und \`helfer_events\` entfernen
- Quelle 5 («Helfer-Anmeldungen») aus \`getPersonalEvents()\` streichen

### Typ-Cleanup
- \`PersonalEvent.helfer_anmeldung_id\` entfernen
- \`PersonalEvent.helfer_event_id\` entfernen
- \`PersonalEvent.typ === 'helfer'\` — prüfen ob noch von System B verwendet, sonst entfernen

### Tests
- System-A-Fälle aus \`persoenlicher-kalender.test.ts\` entfernen

## Abhängigkeit

Erst ausführen wenn Phase 0 bestätigt: keine aktiven System-A-Daten mehr.

## Referenz

Siehe [docs/strategy/system-a-abschaffung-roadmap.md](../docs/strategy/system-a-abschaffung-roadmap.md) — Phase 2.2"

echo "   ✅ Issue erstellt: Phase 2.2 persoenlicher-kalender.ts"

gh issue create \
  --repo "$REPO" \
  --milestone "$MILESTONE_TITLE" \
  --label "backend,frontend,system-a-cleanup,prio:medium" \
  --title "refactor: alle-helfer.ts + AlleHelferTable — System A entfernen" \
  --body "## Ziel

\`lib/actions/alle-helfer.ts\` lädt externe Helfer aus \`helfer_anmeldungen\` (System A) und mischt sie in die Gesamt-Helferübersicht. Diesen Block entfernen.

## Scope

### \`alle-helfer.ts\`
- System-A-Block: externe Helfer aus \`helfer_anmeldungen\` entfernen
- \`HelferEinsatzDetail.system: 'a' | 'b'\` → Feld auf \`'b'\` fixieren oder ganz entfernen
- \`getAlleHelferEinsaetze()\`: System-A-Zweig entfernen

### \`components/alle-helfer/AlleHelferTable.tsx\`
- Spaltentext \`e.system === 'a' ? 'Helferliste' : 'Aufführung'\` → nur noch \`'Aufführung'\`
- System-Unterscheidung in UI entfernen

### \`LegacyHelferlisteTab\` entfernen
- \`components/vorstand/schichten-dashboard/LegacyHelferlisteTab.tsx\` löschen
- \`SchichtenDashboard.tsx\`: \`legacyEvents\` Prop und Tab-Rendering entfernen
- \`vorstand/helferliste/page.tsx\`: Parallelen Fetch von \`getHelferEventsMitBelegung()\` entfernen

## Abhängigkeit

Erst ausführen nach Phase 0 Bestätigung.

## Referenz

Siehe [docs/strategy/system-a-abschaffung-roadmap.md](../docs/strategy/system-a-abschaffung-roadmap.md) — Phase 2.3 / 2.4"

echo "   ✅ Issue erstellt: Phase 2.3 alle-helfer + LegacyTab"

# =============================================================================
# PHASE 3 — Code löschen
# =============================================================================
echo "📋 Phase 3 — System A Code vollständig löschen..."

gh issue create \
  --repo "$REPO" \
  --milestone "$MILESTONE_TITLE" \
  --label "chore,backend,frontend,system-a-cleanup,prio:medium" \
  --title "chore: System A Code vollständig entfernen (Phase 3)" \
  --body "## Ziel

Alle System-A-spezifischen Routen, Komponenten, Server Actions und Tests löschen.

## Voraussetzung

- ✅ Phase 0: Keine aktiven System-A-Daten mehr in der Zukunft
- ✅ Phase 1.1: System-B-Abmeldungs-Flow live
- ✅ Phase 1.2: System-B-E-Mail-Benachrichtigungen live
- ✅ Phase 2: Integrationspunkte bereinigt

## Zu löschende Routen

\`\`\`
app/(public)/helfer/[token]/                          ← System A Public Event View
app/(public)/helfer/helferliste/                      ← System A Abmeldung (abmeldung/[token])
app/(protected)/vorstand/helferliste/                 ← System A Admin (+ [eventId])
\`\`\`

## Zu löschende Komponenten

\`\`\`
components/helferliste/                               ← komplett (PublicEventView, StatusBadge, etc.)
components/vorstand/helferliste/                      ← komplett (HelferEventDetail, HelferlisteOverview, etc.)
\`\`\`

## Zu löschende Server Actions / Libs

\`\`\`
lib/actions/helferliste.ts
lib/actions/helferliste-management.ts
lib/actions/helferliste-notifications.ts
lib/validations/helferliste-management.ts
lib/email/templates/helferliste.ts                    ← prüfen: Teile für System B übernehmen?
\`\`\`

## Zu bereinigen (nicht löschen)

\`\`\`
lib/actions/externe-helfer.ts                         ← System-A-Teile entfernen, System-B-Teile behalten
lib/actions/external-registration.ts                  ← @deprecated Kommentar entfernen (ist aktiver System-B-Flow!)
\`\`\`

## Tests

\`\`\`
lib/actions/helferliste.test.ts                       ← löschen
tests/mocks/supabase.ts                               ← System-A-Mocks entfernen
\`\`\`

## URL Redirects (Middleware)

Vor dem Löschen der Routen sicherstellen:
\`\`\`typescript
// In middleware.ts sicherstellen:
// /helfer/[token] (System A) → /mitmachen
// /helfer/helferliste/abmeldung/[token] → /helfer/abmeldung/[token]
\`\`\`

## Checkliste nach Cleanup

- [ ] \`npm run build\` fehlerfrei
- [ ] \`npm run typecheck\` fehlerfrei
- [ ] \`npm run lint\` fehlerfrei
- [ ] \`npm run test:run\` fehlerfrei
- [ ] Keine Imports von gelöschten Dateien

## Referenz

Siehe [docs/strategy/system-a-abschaffung-roadmap.md](../docs/strategy/system-a-abschaffung-roadmap.md) — Phase 3"

echo "   ✅ Issue erstellt: Phase 3 Code löschen"

# =============================================================================
# PHASE 4 — DB-Cleanup
# =============================================================================
echo "📋 Phase 4 — Datenbank-Cleanup..."

gh issue create \
  --repo "$REPO" \
  --milestone "$MILESTONE_TITLE" \
  --label "database,migration,system-a-cleanup,prio:low" \
  --title "chore: System A DB-Tabellen droppen (Migration)" \
  --body "## Ziel

System-A-Tabellen aus der Datenbank entfernen und Typen in \`types.ts\` bereinigen.

## Voraussetzung

- ✅ Phase 3: Gesamter System-A-Code gelöscht
- ✅ Bestätigung: 0 aktive Einträge in System-A-Tabellen
- ✅ Historische Daten archiviert (falls gewünscht)

## Schritt 1: DB-Funktionen prüfen

\`\`\`sql
-- Welche DB-Funktionen referenzieren System-A-Tabellen?
SELECT routine_name
FROM information_schema.routines
WHERE routine_definition ILIKE '%helfer_events%'
   OR routine_definition ILIKE '%helfer_anmeldungen%'
   OR routine_definition ILIKE '%helfer_rollen%';
\`\`\`

Gefundene Funktionen bereinigen oder droppen.

## Schritt 2: Optional Archivierung

\`\`\`sql
-- Historische Daten sichern (falls gewünscht)
CREATE TABLE archiv_helfer_anmeldungen AS SELECT * FROM helfer_anmeldungen;
CREATE TABLE archiv_helfer_events AS SELECT * FROM helfer_events;
CREATE TABLE archiv_helfer_rollen_instanzen AS SELECT * FROM helfer_rollen_instanzen;
CREATE TABLE archiv_helfer_rollen_templates AS SELECT * FROM helfer_rollen_templates;
\`\`\`

## Schritt 3: Migration schreiben

\`\`\`sql
-- supabase/migrations/YYYYMMDDHHMMSS_drop_system_a_tables.sql

-- Reihenfolge wegen Foreign Keys
DROP TABLE IF EXISTS helfer_anmeldungen;
DROP TABLE IF EXISTS helfer_rollen_instanzen;
DROP TABLE IF EXISTS helfer_rollen_templates;
DROP TABLE IF EXISTS helfer_events;

-- Zugehörige ENUM-Typen prüfen und droppen
-- (nur wenn nicht von System B verwendet)
\`\`\`

## Schritt 4: \`lib/supabase/types.ts\` bereinigen

Folgende System-A-Typen entfernen:
- \`HelferEvent\`
- \`HelferRollenTemplate\`
- \`HelferRollenInstanz\`
- \`HelferAnmeldung\`
- \`PublicHelferEventData\`
- \`RollenInstanzMitAnmeldungen\`
- \`BookHelferSlotResult\`, \`BookHelferSlotsResult\`, \`CheckHelferTimeConflictsResult\`
- \`HelferDashboardAnmeldung.system: 'a' | 'b'\` → Feld entfernen

## Checkliste

- [ ] SQL-Query: 0 Einträge in allen 4 Tabellen bestätigt
- [ ] DB-Funktionen bereinigt
- [ ] Archivierung abgeschlossen (oder bewusst übersprungen)
- [ ] Migration via \`supabase db push\` angewendet
- [ ] \`types.ts\` bereinigt
- [ ] \`npm run typecheck\` fehlerfrei

## Referenz

Siehe [docs/strategy/system-a-abschaffung-roadmap.md](../docs/strategy/system-a-abschaffung-roadmap.md) — Phase 4"

echo "   ✅ Issue erstellt: Phase 4 DB-Cleanup"

# =============================================================================
# ZUSAMMENFASSUNG
# =============================================================================
echo ""
echo "======================================================="
echo "✅ Fertig! Milestone und Issues erstellt."
echo ""
echo "Milestone: '$MILESTONE_TITLE' (#$MILESTONE_NUM)"
echo "Issues: 7 Issues erstellt"
echo ""
echo "Reihenfolge:"
echo "  Phase 0 → Phase 1.1 + 1.2 (parallel) → Phase 2 → Phase 3 → Phase 4"
echo ""
echo "Project Board: https://github.com/trismus/BackstagePass/projects"
echo "Milestone:     https://github.com/trismus/BackstagePass/milestone/$MILESTONE_NUM"
echo "======================================================="
