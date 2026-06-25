# Roadmap: System A vollständig abschaffen

**Status:** Entwurf  
**Erstellt:** 2026-06-25  
**Autor:** Martin (Bühnenmeister/Architect)  
**Bezug:** [ADR Helfersystem-Konsolidierung](../../journal/decisions/20260310_helfersystem-konsolidierung.md)

---

## Ausgangslage

System B (`veranstaltungen → zeitbloecke → auffuehrung_schichten → auffuehrung_zuweisungen`) ist seit März 2026 das führende Helfersystem. System A (`helfer_events → helfer_rollen_templates → helfer_rollen_instanzen → helfer_anmeldungen`) ist eingefroren — keine neuen Features — aber noch vollständig im Code präsent.

Diese Roadmap beschreibt den kontrollierten Abbau von System A.

---

## Vollständige Bestandsaufnahme: Was muss weg?

### Datenbank (4 Tabellen)

| Tabelle | Zweck | Migrationsaufwand |
|---------|-------|-------------------|
| `helfer_events` | Events mit Token-Zugang | Daten archivieren/migrieren |
| `helfer_rollen_templates` | Rollenvorlagen pro Event | Ablösung durch `auffuehrung_schichten.rolle` |
| `helfer_rollen_instanzen` | Konkrete Slots/Zeitblöcke | Ablösung durch `auffuehrung_schichten` |
| `helfer_anmeldungen` | Anmeldungen inkl. Warteliste | Archivierung (historische Daten) |

### Server Actions (~2.300 Zeilen)

| Datei | Zeilen | Verantwortlichkeit |
|-------|--------|-------------------|
| `lib/actions/helferliste.ts` | 273 | System A: Public-Zugriff via Token, Slot-Buchung |
| `lib/actions/helferliste-management.ts` | 535 | System A: Admin-CRUD für Events/Rollen |
| `lib/actions/externe-helfer.ts` | 309 | Externe Helfer-Profile (teils System-A-abhängig) |
| `lib/actions/helferliste-notifications.ts` | 736 | System A: E-Mail-Benachrichtigungen |
| `lib/actions/external-registration.ts` | 469 | System B Public-Registrierung (als deprecated markiert, aber aktiv) |

> **Hinweis:** `external-registration.ts` ist fälschlicherweise als "deprecated für System B" markiert — es ist in Wirklichkeit der aktive System-B-Public-Registrierungsflow. Der Kommentar-Header muss korrigiert werden.

### Routen

| Route | System | Typ | Bemerkung |
|-------|--------|-----|-----------|
| `/helfer/[token]` | A | Public | System A Event-Ansicht via `public_token` |
| `/helfer/helferliste/abmeldung/[token]` | A | Public | System A Stornierung via `abmeldung_token` |
| `/vorstand/helferliste/` | A | Protected | System A Admin-Liste |
| `/vorstand/helferliste/[eventId]` | A | Protected | System A Event-Detail |
| `/helfer/anmeldung/[token]` | B | Public | ✅ Bereits System B — bleibt |
| `/mitmachen` | B | Public | ✅ Bereits System B — bleibt |

### Komponenten

| Verzeichnis / Datei | Typ | Anmerkung |
|---------------------|-----|-----------|
| `components/helferliste/PublicEventView.tsx` | System A | Öffentliche Event-Ansicht |
| `components/helferliste/StatusBadge.tsx` | System A | Status-Anzeige |
| `components/helferliste/HelferZuweisenForm.tsx` | System A | Zuweisung |
| `components/helferliste/RolleCard.tsx` | System A | Rollen-Karte |
| `components/helferliste/RolleForm.tsx` | System A | Rollen-Formular |
| `components/vorstand/helferliste/HelferEventDetail.tsx` | System A | Event-Detail |
| `components/vorstand/helferliste/HelferlisteOverview.tsx` | System A | Übersicht |
| `components/vorstand/helferliste/RolleCard.tsx` | System A | Rollen-Karte |
| `components/vorstand/helferliste/RolleForm.tsx` | System A | Rollen-Formular |
| `components/vorstand/schichten-dashboard/LegacyHelferlisteTab.tsx` | A | Legacy-Tab im System-B-Dashboard |

### Integrationspunkte (vereinfachen, nicht löschen)

| Datei | System-A-Anteil | Was zu tun |
|-------|----------------|------------|
| `lib/actions/helfer-dashboard.ts` | System A Merge-Logik in `getHelferDashboardData()` + `getAuthenticatedHelferDashboard()` | System-A-Block entfernen, nur System B belassen |
| `lib/actions/persoenlicher-kalender.ts` | `helfer_anmeldungen`-Query | Query entfernen, Quelle 5 (Helfer-Anmeldungen) streichen |
| `lib/actions/alle-helfer.ts` | `system: 'a'` Einträge aus `helfer_anmeldungen` | System-A-Block entfernen |
| `lib/supabase/types.ts` | System A Typen (`HelferEvent`, `HelferAnmeldung`, etc.) | Nach Cleanup entfernen |
| `lib/email/templates/helferliste.ts` | System A E-Mail-Templates | Prüfen ob Teile für System B wiederverwendbar |

### Tests

| Datei | Anmerkung |
|-------|-----------|
| `lib/actions/helferliste.test.ts` | System A Tests — löschen |
| Tests in `persoenlicher-kalender.test.ts` | System-A-Fälle entfernen |
| Tests in `person-engagements.test.ts` | System-A-Fälle entfernen |
| `tests/mocks/supabase.ts` | System A Mocks entfernen |

---

## Gap-Analyse: Was fehlt in System B?

Bevor System A entfernt werden kann, muss System B diese Lücken schliessen:

| Feature | System A | System B | Priorität |
|---------|----------|----------|-----------|
| Öffentliche Event-Ansicht via Token | ✅ `/helfer/[token]` | ✅ `/helfer/anmeldung/[token]` | — bereits vorhanden |
| Public Registrierung (extern) | ✅ | ✅ `external-registration.ts` | — bereits vorhanden |
| Öffentliche Abmeldung via Token | ✅ `/helfer/helferliste/abmeldung/[token]` | ⚠️ Abmeldung-Token existiert auf `auffuehrung_zuweisungen`, aber kein UI-Flow | **HOCH** |
| Warteliste | ✅ Vollständig | ❌ Nicht vorhanden | **MITTEL** |
| Admin: Schichten verwalten | ✅ `/vorstand/helferliste/` | ✅ `/auffuehrungen/[id]` + Dashboard | — ausreichend |
| E-Mail-Benachrichtigungen (Bestätigung, Erinnerung) | ✅ `helferliste-notifications.ts` | ⚠️ Grundstruktur vorhanden, aber nicht vollständig | **HOCH** |
| Koordinator-Zuweisung | ✅ `koordinator_id` auf `helfer_events` | ❌ Fehlt auf Veranstaltungsebene | **NIEDRIG** |
| ICS-Export | ✅ | ✅ | — bereits vorhanden |

---

## Phasenplan

### Phase 0 — Datenbasis erheben (1 Woche)
*Bevor irgendwas gelöscht wird: verstehen was tatsächlich noch aktiv ist.*

**Ziel:** Entscheidungsgrundlage schaffen, ob/was migriert werden muss.

```sql
-- Wie viele aktive System-A-Anmeldungen gibt es?
SELECT status, COUNT(*) FROM helfer_anmeldungen GROUP BY status;

-- Wie viele Events in der Zukunft?
SELECT COUNT(*) FROM helfer_events WHERE datum_end >= NOW();

-- Verknüpfte Veranstaltungen (helfer_event.veranstaltung_id)?
SELECT he.name, v.titel, he.datum_start
FROM helfer_events he
LEFT JOIN veranstaltungen v ON he.veranstaltung_id = v.id
WHERE he.datum_end >= NOW();

-- Anmeldungen die noch aktiv gültig sind
SELECT ha.status, COUNT(*)
FROM helfer_anmeldungen ha
JOIN helfer_rollen_instanzen hri ON ha.rollen_instanz_id = hri.id
JOIN helfer_events he ON hri.helfer_event_id = he.id
WHERE he.datum_end >= NOW()
GROUP BY ha.status;
```

**Deliverable:** Kurzer Report: Anzahl aktiver Anmeldungen, letztes Veranstaltungsdatum in System A.

---

### Phase 1 — System B Feature Parity (3–4 Wochen)
*System B erhält die Kernfunktionen die System A hat und System B noch fehlt.*

#### 1.1 Öffentliche Abmeldung für System B
**Issue:** Neues GitHub Issue erstellen  
**Scope:**
- Route `/helfer/abmeldung/[token]` für System B Abmeldungen (analog zu System A `/helfer/helferliste/abmeldung/[token]`)
- `auffuehrung_zuweisungen.abmeldung_token` ist bereits in der DB vorhanden
- Server Action: `cancelZuweisungByToken(token)` — setzt Status auf `abgesagt`
- E-Mail-Bestätigung an den Helfer
- Frist-Prüfung via `veranstaltungen.helfer_buchung_deadline`

#### 1.2 E-Mail-Benachrichtigungen für System B vervollständigen
**Issue:** Neues GitHub Issue erstellen  
**Scope:**
- Buchungsbestätigung beim Anmelden via `/helfer/anmeldung/[token]` (System B) senden
- Erinnerung 48h vor Veranstaltung
- Abmeldungsbestätigung (aus 1.1)
- `upcoming_schedule` Template ist bereits vorhanden (Migration 20260420080000)
- Vorhandene `helferliste-notifications.ts` als Vorlage nutzen, aber für System-B-Datenstrukturen neu schreiben → neue Datei `lib/actions/schichten-notifications.ts`

#### 1.3 (Optional) Warteliste für System B
**Issue:** Neues GitHub Issue erstellen  
**Scope:**
- `warteliste` Status auf `auffuehrung_zuweisungen`
- Position-Tracking, automatisches Nachrücken
- **Einschätzung:** Nur notwendig wenn tatsächlich Wartelisten-Einträge in System A aktiv sind (→ Phase 0 klärt das)

---

### Phase 2 — Integrationspunkte entflechten (1–2 Wochen)
*System-A-Daten aus den gemeinsamen Views und Actions herauslösen.*

#### 2.1 `helfer-dashboard.ts` vereinfachen
- `getHelferDashboardData()`: System-A-Block (`systemAEntries`) entfernen
- `getAuthenticatedHelferDashboard()`: `helfer_anmeldungen`-Query entfernen
- RPC `get_helfer_dashboard_data` prüfen — wenn System-A-Teil vorhanden: Funktion bereinigen
- Typ `HelferDashboardAnmeldung.system: 'a' | 'b'` → nach Cleanup einfach entfernen

#### 2.2 `persoenlicher-kalender.ts` vereinfachen
- Query auf `helfer_anmeldungen` entfernen (Quelle 5)
- `PersonalEvent.helfer_anmeldung_id` und `helfer_event_id` aus Typ entfernen
- Entsprechende Tests in `persoenlicher-kalender.test.ts` entfernen

#### 2.3 `alle-helfer.ts` vereinfachen
- System-A-Block (externe Helfer aus `helfer_anmeldungen`) entfernen
- `HelferEinsatzDetail.system: 'a' | 'b'` auf `'b'` reduzieren
- `AlleHelferTable.tsx`: Spaltentext `'Helferliste'` vs `'Aufführung'` vereinfachen

#### 2.4 `LegacyHelferlisteTab` entfernen
- `SchichtenDashboard.tsx`: Legacy-Tab und `legacyEvents` Prop entfernen
- `vorstand/helferliste/page.tsx`: Parallelen Fetch von `getHelferEventsMitBelegung()` entfernen

---

### Phase 3 — System A Code löschen (1 Woche)
*Erst wenn Phase 1 und 2 abgeschlossen sind und keine aktiven System-A-Daten mehr in der Zukunft liegen.*

#### 3.1 Routen löschen
```
app/(public)/helfer/[token]/               → löschen
app/(public)/helfer/helferliste/           → löschen (abmeldung/[token])
app/(protected)/vorstand/helferliste/      → löschen ([eventId] + page)
```

#### 3.2 Komponenten löschen
```
components/helferliste/                    → vollständig löschen
components/vorstand/helferliste/           → vollständig löschen
components/vorstand/schichten-dashboard/LegacyHelferlisteTab.tsx → löschen
```

#### 3.3 Server Actions löschen
```
lib/actions/helferliste.ts                 → löschen
lib/actions/helferliste-management.ts      → löschen
lib/actions/helferliste-notifications.ts   → löschen
lib/validations/helferliste-management.ts  → löschen
lib/email/templates/helferliste.ts         → löschen (oder Teile nach schichten-notifications.ts portieren)
```

#### 3.4 `externe-helfer.ts` überprüfen
- Teile die für externe Helfer in System B relevant bleiben → in `external-registration.ts` integrieren oder neue Datei
- System-A-spezifische Funktionen entfernen

#### 3.5 `external-registration.ts` — Kommentar-Header korrigieren
- `@deprecated` Kommentar entfernen (der File IST der aktive System-B-Flow)
- Kommentar über System A als primäres System korrigieren (war vor dem ADR geschrieben)

#### 3.6 Tests bereinigen
```
lib/actions/helferliste.test.ts            → löschen
tests/mocks/supabase.ts                    → System-A-Mocks entfernen
```

---

### Phase 4 — Datenbank-Cleanup (1 Woche)
*Nach erfolgreichem Code-Cleanup und Datenmigration/-archivierung.*

#### 4.1 Daten archivieren (falls gewünscht)
```sql
-- Historische Daten in Archiv-Tabellen kopieren
CREATE TABLE archiv_helfer_anmeldungen AS SELECT * FROM helfer_anmeldungen;
CREATE TABLE archiv_helfer_events AS SELECT * FROM helfer_events;
-- etc.
```

#### 4.2 DB-Funktionen prüfen
```sql
-- Welche DB-Funktionen referenzieren System-A-Tabellen?
SELECT routine_name FROM information_schema.routines
WHERE routine_definition ILIKE '%helfer_events%'
   OR routine_definition ILIKE '%helfer_anmeldungen%';
```
RPC `get_helfer_dashboard_data` — System-A-Teil entfernen oder Funktion löschen falls nicht mehr gebraucht.

#### 4.3 Migration schreiben
```sql
-- Migration: Drop System A Tables
-- Reihenfolge wegen Foreign Keys beachten
DROP TABLE IF EXISTS helfer_anmeldungen;
DROP TABLE IF EXISTS helfer_rollen_instanzen;
DROP TABLE IF EXISTS helfer_rollen_templates;
DROP TABLE IF EXISTS helfer_events;

-- Zugehörige Typen
DROP TYPE IF EXISTS helfer_anmeldung_status;
DROP TYPE IF EXISTS helfer_rollen_sichtbarkeit;
-- etc.
```

#### 4.4 `types.ts` bereinigen
- System A Typen entfernen: `HelferEvent`, `HelferRollenTemplate`, `HelferRollenInstanz`, `HelferAnmeldung`, `PublicHelferEventData`, `RollenInstanzMitAnmeldungen` etc.
- `HelferDashboardAnmeldung.system: 'a' | 'b'` → Feld entfernen

---

### Phase 5 — URL-Redirects absichern (parallel zu Phase 3)
*Alte System-A-Token-Links könnten noch in Umlauf sein (E-Mails, Bookmarks).*

#### 5.1 Redirect-Middleware einrichten
```typescript
// middleware.ts — Redirects für alte System-A-URLs
if (pathname.startsWith('/helfer/') && !pathname.startsWith('/helfer/anmeldung')) {
  // Alte System-A-Token-Links → Hauptseite oder Fehlerseite
  return NextResponse.redirect(new URL('/mitmachen', request.url))
}
```

#### 5.2 Graceful Not-Found für abgelaufene Tokens
- Statt 404: freundliche Seite "Diese Anmeldung ist abgelaufen oder wurde bereits verarbeitet"

---

## Zeitplan (Empfehlung)

```
Woche 1:      Phase 0 — Datenbasis erheben
Woche 2–5:    Phase 1 — System B Feature Parity
              + Phase 5 vorbereiten (Redirect-Logik)
Woche 6–7:    Phase 2 — Integrationspunkte entflechten
Woche 8:      Phase 3 — Code löschen
Woche 9:      Phase 4 — DB-Cleanup
```

**Gesamtaufwand:** ~9 Wochen (kann parallel zu anderen Features laufen)

---

## Risiken & Mitigationen

| Risiko | Wahrscheinlichkeit | Mitigation |
|--------|-------------------|------------|
| Alte System-A-Token-Links in versendeten E-Mails | Mittel | Redirects (Phase 5) vor Code-Löschung |
| Aktive Anmeldungen in zukünftigen System-A-Events | Gering | Phase 0 klärt das; ggf. manuell nach System B übertragen |
| Warteliste-Nutzung in System A | Gering | Phase 0 klärt Anzahl; Warteliste in System B falls nötig |
| `externe_helfer_profile`-Abhängigkeiten übersehen | Mittel | `externe_helfer_profile` von System A entkoppeln prüfen |
| Test-Coverage bricht während Cleanup | Niedrig | Neue System-B-Tests schreiben bevor System-A-Tests gelöscht werden |

---

## GitHub Issues (zu erstellen)

Nach Abschluss von Phase 0 folgende Issues erstellen:

| # | Titel | Phase | Milestone |
|---|-------|-------|-----------|
| TBD | `feat: Öffentliche Abmeldung für System B (Token-Flow)` | 1.1 | System A Abschaffung |
| TBD | `feat: E-Mail-Benachrichtigungen für System B vervollständigen` | 1.2 | System A Abschaffung |
| TBD | `refactor: helfer-dashboard.ts — System A entfernen` | 2.1 | System A Abschaffung |
| TBD | `refactor: persoenlicher-kalender.ts — helfer_anmeldungen entfernen` | 2.2 | System A Abschaffung |
| TBD | `refactor: alle-helfer.ts — System A entfernen` | 2.3 | System A Abschaffung |
| TBD | `chore: System A Code vollständig entfernen` | 3 | System A Abschaffung |
| TBD | `chore: System A DB-Tabellen droppen (Migration)` | 4 | System A Abschaffung |

---

## Entscheidungspunkte

**Nach Phase 0:**
- Wenn keine zukünftigen System-A-Events vorhanden → Phase 1.3 (Warteliste) überspringen
- Wenn >50 aktive Anmeldungen → Migrationsstrategie für Daten ausarbeiten

**Nach Phase 1:**
- Manuelle QA: Öffentlicher Registrierungsflow via `/helfer/anmeldung/[token]` vollständig testen
- E-Mail-Templates gegenchecken

**Vor Phase 4 (DB-Drop):**
- Bestätigung: Keine aktiven Einträge mehr in System-A-Tabellen
- Archivierung abgeschlossen
