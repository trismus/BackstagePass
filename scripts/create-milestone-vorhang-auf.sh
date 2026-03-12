#!/bin/bash
# =============================================================================
# Milestone "Vorhang auf!" erstellen mit allen 8 Issues
# Voraussetzung: gh CLI authentifiziert (gh auth login)
# Ausführen: bash scripts/create-milestone-vorhang-auf.sh
# =============================================================================

set -e
REPO="trismus/BackstagePass"

echo "🎭 Erstelle Milestone: Vorhang auf!"
echo "===================================="

# 1. Milestone erstellen
gh milestone create "Vorhang auf!" \
  --description "$(cat <<'DESC'
Künstlerische Leitung End-to-End: Probenplanung (Szenen, Akte, Probenweekend, Technik) + Mitglieder-Dashboard (Proben, Aufführungen, Abwesenheiten).

**User Stories:**
- US-1: Probenplanung durch den Regisseur
- US-2: Proben-Dashboard für Mitglieder

**Phasen:**
- Phase A: Bugfixes (Blocking Issues)
- Phase B: Datenmodell erweitern (Akte, Technik-Typen)
- Phase C: Probenweekend
- Phase D: Dashboard-Widgets

Details: journal/milestones/milestone-vorhang-auf.md
DESC
)" --repo "$REPO"

echo "✅ Milestone erstellt"
echo ""

# 2. Issues erstellen
echo "📝 Erstelle Issue 1/8: Bugfix Probenplan-Generator Status"
gh issue create --repo "$REPO" \
  --milestone "Vorhang auf!" \
  --label "bug,backend,prio:high" \
  --title "Bugfix: Probenplan-Generator filtert nach falschen Stück-Status-Werten" \
  --body "$(cat <<'EOF'
## Beschreibung

Der Probenplan-Generator und `getStueckeMitSzenen()` filtern nach Stück-Status-Werten, die nicht im Datenbank-ENUM existieren:

- `generator/page.tsx` → filtert `status IN ('in_produktion', 'in_vorbereitung')`
- `probenplan.ts` → `getStueckeMitSzenen()` filtert `status = 'in_produktion'`

Die gültigen Status-Werte sind: `in_planung`, `in_proben`, `aktiv`, `abgeschlossen`, `archiviert`

**Resultat:** Der Generator zeigt **nie** Stücke an → komplett unbenutzbar.

## Akzeptanzkriterien

- [ ] Generator zeigt Stücke mit Status `in_proben` (primär) und `in_planung` (sekundär)
- [ ] `getStueckeMitSzenen()` filtert nach korrekten Status-Werten
- [ ] Bestehende Unit-Tests angepasst / neue Tests geschrieben

## Betroffene Dateien

- `apps/web/app/(protected)/proben/generator/page.tsx`
- `apps/web/lib/actions/probenplan.ts` → `getStueckeMitSzenen()`

**Milestone:** Vorhang auf! | **US-1** | **Phase A**
EOF
)"

echo "📝 Erstelle Issue 2/8: Bugfix DB-Funktion"
gh issue create --repo "$REPO" \
  --milestone "Vorhang auf!" \
  --label "bug,database,prio:high" \
  --title "Bugfix: Fehlende DB-Funktion auto_invite_probe_teilnehmer" \
  --body "$(cat <<'EOF'
## Beschreibung

`lib/actions/proben.ts` ruft `supabase.rpc('auto_invite_probe_teilnehmer', { probe_uuid: probeId })` auf, aber diese Funktion existiert **nicht** in den Migrationen. Es gibt nur `generate_probe_teilnehmer()`.

## Akzeptanzkriterien

- [ ] Klären: Ist `auto_invite_probe_teilnehmer` ein Alias für `generate_probe_teilnehmer`?
- [ ] Entweder Migration erstellen oder RPC-Aufruf auf existierende Funktion umbenennen
- [ ] Auto-Invite funktioniert korrekt (Teilnehmer werden aus Besetzungen der Probe-Szenen generiert)

## Empfohlener Fix

**Option A (bevorzugt):** RPC-Call in `proben.ts` auf `generate_probe_teilnehmer` umbenennen – kein Migrations-Overhead.

## Betroffene Dateien

- `apps/web/lib/actions/proben.ts`

**Milestone:** Vorhang auf! | **US-1** | **Phase A**
EOF
)"

echo "📝 Erstelle Issue 3/8: Akt-Gruppierung"
gh issue create --repo "$REPO" \
  --milestone "Vorhang auf!" \
  --label "feature,database,frontend,prio:medium" \
  --title "Akt-Gruppierung für Szenen" \
  --body "$(cat <<'EOF'
## User Story

**Als** Regisseur
**möchte ich** Szenen nach Akten gruppieren können,
**damit** ich in der zweiten Probenhälfte ganze Akte als Probeneinheit auswählen kann.

## Akzeptanzkriterien

- [ ] Szenen haben ein optionales `akt`-Feld (integer, z.B. 1, 2, 3)
- [ ] UI zeigt Szenen gruppiert nach Akt an (Stück-Detail + Proben-Szenen-Auswahl)
- [ ] Proben-Formular erlaubt "Ganzen Akt auswählen" als Shortcut
- [ ] Bestehende Szenen ohne Akt funktionieren weiterhin (Rückwärtskompatibilität)

## Tech Notes

### Migration
```sql
ALTER TABLE szenen ADD COLUMN akt integer;
CREATE INDEX idx_szenen_akt ON szenen(stueck_id, akt);
```

### Betroffene Dateien
- `supabase/migrations/YYYYMMDDHHMMSS_add_akt_to_szenen.sql`
- `apps/web/lib/supabase/types.ts` (Szene um `akt` erweitern)
- `apps/web/lib/actions/stuecke.ts` (akt in CRUD)
- `apps/web/lib/validations/szene.ts` (akt validieren)
- `apps/web/components/stuecke/SzenenList` (Gruppierung)
- `apps/web/components/proben/ProbeForm` (Akt-Selektion)

**Milestone:** Vorhang auf! | **US-1** | **Phase B**
EOF
)"

echo "📝 Erstelle Issue 4/8: Probenweekend"
gh issue create --repo "$REPO" \
  --milestone "Vorhang auf!" \
  --label "feature,database,frontend,backend,prio:medium" \
  --title "Mehrtägige Proben (Probenweekend)" \
  --body "$(cat <<'EOF'
## User Story

**Als** Regisseur
**möchte ich** Probenweekends als zusammenhängende Blöcke planen können,
**damit** mehrtägige Intensivproben als Einheit organisiert werden.

## Akzeptanzkriterien

- [ ] Eine Probe kann als "Probenblock" mit mehreren Tagen angelegt werden
- [ ] Jeder Tag im Block hat eigene Start-/Endzeit und eigene Szenen-Zuordnung
- [ ] Die einzelnen Tage erscheinen als verknüpfte Einträge im Probenkalender
- [ ] Probenblock hat Gesamttitel und optional Tages-Untertitel
- [ ] Teilnehmer werden pro Block eingeladen (nicht pro Einzeltag)

## Tech Notes

### Architektur: Eltern-Kind-Beziehung

```
proben (parent = Probenblock, typ='block')
├── datum_von, datum_bis
├── proben_teilnehmer (auf Block-Ebene)
└── proben (children = Einzeltage, typ='block_tag')
    ├── parent_id → proben.id
    ├── datum, startzeit, endzeit
    └── proben_szenen (Szenen pro Tag)
```

### Migration
```sql
ALTER TABLE proben ADD COLUMN typ text DEFAULT 'einzeln'
  CHECK (typ IN ('einzeln', 'block', 'block_tag'));
ALTER TABLE proben ADD COLUMN parent_id uuid REFERENCES proben(id) ON DELETE CASCADE;
ALTER TABLE proben ADD COLUMN datum_bis date;
CREATE INDEX idx_proben_parent ON proben(parent_id) WHERE parent_id IS NOT NULL;
```

### Betroffene Dateien
- `supabase/migrations/YYYYMMDDHHMMSS_proben_bloecke.sql`
- `apps/web/lib/supabase/types.ts`
- `apps/web/lib/actions/proben.ts` (Block-CRUD)
- `apps/web/components/proben/ProbeForm` (Block-Modus)
- `apps/web/components/proben/ProbenList` (Block-Darstellung)
- `apps/web/app/(protected)/proben/[id]/page` (Block-Detail)

**Milestone:** Vorhang auf! | **US-1** | **Phase C**
EOF
)"

echo "📝 Erstelle Issue 5/8: Technik-Crew"
gh issue create --repo "$REPO" \
  --milestone "Vorhang auf!" \
  --label "feature,backend,frontend,prio:medium" \
  --title "Technik-Crew zu Proben einladen" \
  --body "$(cat <<'EOF'
## User Story

**Als** Regisseur
**möchte ich** neben Darstellern auch Technik-Personal zu Proben einladen können,
**damit** bei Endproben und Probenweekends Licht, Ton und Bühnenbau dabei sind.

## Akzeptanzkriterien

- [ ] Proben-Formular hat "Technik einladen"-Option neben Szenen-basierter Auto-Einladung
- [ ] Technik-Personen können aus der Mitgliederliste ausgewählt werden
- [ ] Proben können als "Mit Technik" markiert werden
- [ ] Teilnehmer-Liste unterscheidet visuell zwischen Darstellern und Technik

## Tech Notes

### Migration
```sql
ALTER TABLE proben_teilnehmer ADD COLUMN teilnehmer_typ text DEFAULT 'darsteller'
  CHECK (teilnehmer_typ IN ('darsteller', 'technik', 'regie', 'sonstiges'));
ALTER TABLE proben ADD COLUMN mit_technik boolean DEFAULT false;
```

### Betroffene Dateien
- `supabase/migrations/YYYYMMDDHHMMSS_proben_technik.sql`
- `apps/web/lib/supabase/types.ts`
- `apps/web/lib/actions/proben.ts` (Technik-Einladung)
- `apps/web/components/proben/ProbeForm` (Technik-Toggle + Personenauswahl)
- `apps/web/components/proben/TeilnehmerList` (Typ-Badge)

**Milestone:** Vorhang auf! | **US-1** | **Phase B**
EOF
)"

echo "📝 Erstelle Issue 6/8: Dashboard Proben-Widget"
gh issue create --repo "$REPO" \
  --milestone "Vorhang auf!" \
  --label "feature,frontend,prio:high" \
  --title "Dashboard: Kommende Proben Widget für Mitglieder" \
  --body "$(cat <<'EOF'
## User Story

**Als** aktives Mitglied (Darsteller oder Technik)
**möchte ich** auf meinem Dashboard meine nächsten Proben sehen und direkt reagieren können,
**damit** ich immer weiss, wann ich gebraucht werde.

## Akzeptanzkriterien

- [ ] Widget "Meine nächsten Proben" im Mitglieder-Dashboard
- [ ] Zeigt die nächsten 5 Proben, zu denen das Mitglied eingeladen ist
- [ ] Pro Probe: Datum, Uhrzeit, Stück-Titel, Szenen (kompakt), Ort
- [ ] Farbliche Kennzeichnung des eigenen Teilnahme-Status
- [ ] Quick-Action: Status direkt im Widget ändern (zugesagt/vielleicht/abgesagt)
- [ ] Quick-Action: Absage mit Grund direkt eingebbar
- [ ] Link zur Proben-Detailseite
- [ ] Leerzustand: "Keine anstehenden Proben" mit Link zur Probenübersicht

## Tech Notes

### Neue Dateien
- `apps/web/components/dashboard/MeineProbenWidget.tsx` (Client Component)
- `apps/web/lib/actions/proben.ts` → neue Funktion `getMeineKommendenProben(personId)`

### Data Flow
1. Dashboard (Server) → `getMeineKommendenProben(personId)`
2. Query: `proben_teilnehmer JOIN proben JOIN stuecke WHERE person_id = X AND datum >= now()`
3. Pass to `MeineProbenWidget` (Client, für Quick-Actions)

**Milestone:** Vorhang auf! | **US-2** | **Phase D**
EOF
)"

echo "📝 Erstelle Issue 7/8: Dashboard Aufführungen"
gh issue create --repo "$REPO" \
  --milestone "Vorhang auf!" \
  --label "feature,frontend,database,prio:medium" \
  --title "Dashboard: Nächste Aufführungen & Stück-Verknüpfung" \
  --body "$(cat <<'EOF'
## User Story

**Als** aktives Mitglied
**möchte ich** auf meinem Dashboard die nächsten Aufführungen sehen,
**damit** ich weiss, wann die nächsten Vorstellungen sind.

## Akzeptanzkriterien

- [ ] Widget "Nächste Aufführungen" im Mitglieder-Dashboard
- [ ] Aufführungen (`veranstaltungen` mit `typ='auffuehrung'`) können mit einem Stück verknüpft werden
- [ ] Anzeige: Datum, Uhrzeit, Stück-Titel, Ort
- [ ] Countdown bis zur nächsten Aufführung (optional)
- [ ] Link zur Aufführungs-Detailseite

## Tech Notes

### Migration: Stück-Verknüpfung
```sql
ALTER TABLE veranstaltungen ADD COLUMN stueck_id uuid REFERENCES stuecke(id) ON DELETE SET NULL;
CREATE INDEX idx_veranstaltungen_stueck ON veranstaltungen(stueck_id) WHERE stueck_id IS NOT NULL;
```

### Betroffene Dateien
- `supabase/migrations/YYYYMMDDHHMMSS_veranstaltungen_stueck_link.sql`
- `apps/web/lib/supabase/types.ts`
- `apps/web/components/dashboard/NaechsteAuffuehrungenWidget.tsx`
- `apps/web/app/(protected)/auffuehrungen/` (Stück-Auswahl beim Erstellen)

**Milestone:** Vorhang auf! | **US-2** | **Phase D**
EOF
)"

echo "📝 Erstelle Issue 8/8: Dashboard Abwesenheiten"
gh issue create --repo "$REPO" \
  --milestone "Vorhang auf!" \
  --label "feature,frontend,backend,prio:medium" \
  --title "Dashboard: Abwesenheiten melden" \
  --body "$(cat <<'EOF'
## User Story

**Als** aktives Mitglied
**möchte ich** Abwesenheiten direkt vom Dashboard melden können,
**damit** ich nicht jede Probe einzeln absagen muss.

## Akzeptanzkriterien

- [ ] "Abwesenheit melden"-Button im Dashboard
- [ ] Dialog/Modal: Zeitraum wählen (von-bis Datum)
- [ ] Alle Proben im gewählten Zeitraum automatisch auf "abgesagt" setzen
- [ ] Optionaler Grund für die Abwesenheit
- [ ] Bestätigungsanzeige: "X Proben betroffen" vor dem Speichern
- [ ] Bereits abgesagte Proben werden nicht doppelt verarbeitet

## Tech Notes

### Neue Dateien
- `apps/web/components/dashboard/AbwesenheitDialog.tsx` (Client Component)
- `apps/web/lib/actions/abwesenheiten.ts`

### Server Action
```typescript
meldeAbwesenheit(personId, vonDatum, bisDatum, grund?)
  → SELECT proben.id FROM proben
    JOIN proben_teilnehmer ON ...
    WHERE person_id = X AND datum BETWEEN von AND bis AND status != 'abgesagt'
  → UPDATE proben_teilnehmer SET status = 'abgesagt', absage_grund = grund
  → Return { betroffeneProben: count }
```

**Milestone:** Vorhang auf! | **US-2** | **Phase D**
EOF
)"

echo ""
echo "===================================="
echo "🎭 Milestone 'Vorhang auf!' komplett!"
echo "   1 Milestone + 8 Issues erstellt"
echo "===================================="
echo ""
echo "📋 Übersicht: gh milestone list --repo $REPO"
echo "📋 Issues:    gh issue list --repo $REPO --milestone 'Vorhang auf!'"
