# 🎭 Milestone: Vorhang auf! – Künstlerische Leitung End-to-End

**Erstellt:** 2026-02-17
**Autor:** Martin (Bühnenmeister)
**Modul:** 3 – Künstlerische Leitung
**Status:** 📋 Planung

---

## 🎯 Vision

Der Regisseur kann ein Stück von der ersten Idee bis zur letzten Probe durchplanen – Szenen strukturieren, Rollen besetzen, Proben in beliebiger Granularität planen (Einzelszenen, Akte, Probenweekends) und die Technik einladen. Jedes Mitglied sieht auf seinem Dashboard sofort, wann seine nächsten Proben und Aufführungen sind, und kann Abwesenheiten unkompliziert melden.

---

## 📋 User Stories

### US-1: Probenplanung durch den Regisseur

> **Als** Regisseur
> **möchte ich** nach der Besetzung meine Proben flexibel planen können – einzelne Szenen, ganze Akte oder mehrtägige Probenweekends inklusive Technik-Crew –
> **damit** ich den Probenprozess strukturiert vom Leseproben-Stadium bis zur Hauptprobe steuern kann.

**Akzeptanzkriterien:**
- [ ] Szenen können zu Akten/Gruppen zusammengefasst werden
- [ ] Eine Probe kann einzelne Szenen ODER einen ganzen Akt referenzieren
- [ ] Mehrtägige Proben (Probenweekend) können als zusammenhängende Einheit geplant werden
- [ ] Technik-Crew (Personen ohne Rolle im Stück) können zu Proben eingeladen werden
- [ ] Automatische Teilnehmer-Ermittlung: Besetzte Personen der gewählten Szenen + manuell hinzugefügte Technik
- [ ] Konflikterkennung bei Doppelbelegung von Personen/Räumen
- [ ] Der Probenplan-Generator unterstützt die korrekten Stück-Status-Werte

### US-2: Proben-Dashboard für Mitglieder

> **Als** aktives Mitglied (Darsteller oder Technik)
> **möchte ich** auf meinem Dashboard meine nächsten Proben und Aufführungen sehen und Abwesenheiten eintragen können,
> **damit** ich immer weiss, wann ich gebraucht werde, und frühzeitig Bescheid geben kann, wenn ich nicht kann.

**Akzeptanzkriterien:**
- [ ] Dashboard zeigt "Meine nächsten Proben" mit Datum, Stück, Szenen und Ort
- [ ] Dashboard zeigt "Nächste Aufführungen" mit Datum und Stück
- [ ] Abwesenheiten/Absagen können direkt vom Dashboard eingetragen werden (mit Grund)
- [ ] Teilnahme-Status (zugesagt/vielleicht/abgesagt) ist direkt änderbar
- [ ] Benachrichtigung bei neuen Proben-Einladungen (visueller Indikator)

---

## 🔍 Ist-Analyse (Stand 2026-02-17)

### Was bereits existiert ✅

| Bereich | Status | Details |
|---------|--------|---------|
| Stücke CRUD | ✅ Komplett | Erstellen, bearbeiten, löschen, Statusverwaltung |
| Szenen CRUD | ✅ Komplett | Mit Nummern, Titel, Dauer, Text-Feld |
| Rollen CRUD | ✅ Komplett | Typen: Hauptrolle, Nebenrolle, Ensemble, Statisterie |
| Szenen-Rollen-Matrix | ✅ Komplett | Welche Rolle in welcher Szene |
| Besetzungen | ✅ Komplett | Haupt-/Zweit-/Ersatzbesetzung mit Historie |
| Proben CRUD | ✅ Komplett | Erstellen, bearbeiten, Status-Workflow |
| Proben-Szenen | ✅ Komplett | Szenen zu Proben zuordnen mit Reihenfolge |
| Proben-Teilnehmer | ✅ Komplett | Status-Tracking, Absage-Grund, Auto-Einladung |
| Probenplan-Generator | ✅ Komplett | Templates, Vorschau, Batch-Generierung |
| Proben-Protokoll | ✅ Komplett | Szenen-Notizen, Aufgaben, Fortschritt |
| Konflikterkennung | ✅ Komplett | DB-Funktion `check_probe_konflikte` |

### Was fehlt oder kaputt ist 🔴

| # | Problem | Schwere | Betrifft |
|---|---------|---------|----------|
| BUG-1 | **Status-Mismatch im Probenplan-Generator**: Filtert nach `in_produktion`/`in_vorbereitung`, aber gültige Status sind `in_planung`/`in_proben`/`aktiv` → Generator zeigt nie Stücke | 🔴 Blocking | US-1 |
| BUG-2 | **DB-Funktion `auto_invite_probe_teilnehmer` fehlt**: Wird in `proben.ts` per RPC aufgerufen, existiert aber nicht in Migrationen | 🔴 Blocking | US-1 |
| FEAT-1 | **Keine Akt-Gruppierung für Szenen**: Szenen haben nur `nummer` und `titel`, kein `akt`-Feld zum Gruppieren | 🟡 Feature | US-1 |
| FEAT-2 | **Keine Probenweekend-Unterstützung**: Proben sind Einzeltermine (ein Datum), keine mehrtägigen Blöcke | 🟡 Feature | US-1 |
| FEAT-3 | **Technik-Crew nicht einladbar**: Auto-Invite basiert nur auf Besetzungen, kein Mechanismus für Techniker ohne Rolle | 🟡 Feature | US-1 |
| FEAT-4 | **Dashboard zeigt keine Proben**: Mitglieder-Dashboard hat kein Widget für kommende Proben | 🔴 Blocking | US-2 |
| FEAT-5 | **Dashboard zeigt keine Aufführungen**: Kein "Nächste Aufführungen" Widget im Mitglieder-Dashboard | 🟡 Feature | US-2 |
| FEAT-6 | **Keine Abwesenheits-Schnellaktion**: Kein Weg, direkt vom Dashboard Absagen einzutragen | 🟡 Feature | US-2 |
| FEAT-7 | **Aufführung nicht mit Stück verknüpft**: `veranstaltungen` mit `typ='auffuehrung'` hat kein `stueck_id` Feld | 🟡 Feature | US-2 |

---

## 📦 Issues

### Issue 1: 🔴 Bugfix – Probenplan-Generator Status-Mismatch

**Labels:** `bug`, `backend`, `prio:high`
**Aufwand:** Klein (< 1h)
**Blockiert:** Gesamter Probenplan-Generator ist unbenutzbar

**Beschreibung:**
Der Probenplan-Generator und `getStueckeMitSzenen()` filtern nach Stück-Status-Werten, die nicht im Datenbank-ENUM existieren:
- `generator/page.tsx` → filtert `status IN ('in_produktion', 'in_vorbereitung')`
- `probenplan.ts` → `getStueckeMitSzenen()` filtert `status = 'in_produktion'`

Die gültigen Status-Werte sind: `in_planung`, `in_proben`, `aktiv`, `abgeschlossen`, `archiviert`

**Akzeptanzkriterien:**
- [ ] Generator zeigt Stücke mit Status `in_proben` (primär) und `in_planung` (sekundär)
- [ ] `getStueckeMitSzenen()` filtert nach korrekten Status-Werten
- [ ] Bestehende Unit-Tests angepasst / neue Tests geschrieben

**Tech Notes (Martin):**
- Fix in `apps/web/app/(protected)/proben/generator/page.tsx`
- Fix in `apps/web/lib/actions/probenplan.ts` → `getStueckeMitSzenen()`
- Korrekte Werte: `in_proben` für aktive Probenphase, `in_planung` als Vorbereitung

---

### Issue 2: 🔴 Bugfix – Fehlende DB-Funktion `auto_invite_probe_teilnehmer`

**Labels:** `bug`, `database`, `migration`, `prio:high`
**Aufwand:** Klein (< 1h)
**Blockiert:** Auto-Einladung von Teilnehmern

**Beschreibung:**
`lib/actions/proben.ts` ruft `supabase.rpc('auto_invite_probe_teilnehmer', { probe_uuid: probeId })` auf, aber diese Funktion existiert nicht in den Migrationen. Es gibt nur `generate_probe_teilnehmer(probe_uuid)`.

**Akzeptanzkriterien:**
- [ ] Klären: Ist `auto_invite_probe_teilnehmer` ein Alias für `generate_probe_teilnehmer`?
- [ ] Entweder Migration erstellen oder RPC-Aufruf auf existierende Funktion umleiten
- [ ] Auto-Invite funktioniert korrekt (Teilnehmer werden aus Besetzungen der Probe-Szenen generiert)

**Tech Notes (Martin):**
- Option A: RPC-Call in `proben.ts` auf `generate_probe_teilnehmer` umbenennen
- Option B: Migration erstellen die `auto_invite_probe_teilnehmer` als Wrapper/Alias definiert
- Option A bevorzugt (einfacher, keine neue Migration nötig)

---

### Issue 3: Akt-Gruppierung für Szenen

**Labels:** `feature`, `database`, `migration`, `frontend`, `prio:medium`
**Aufwand:** Mittel

**Beschreibung:**
Szenen sollen zu Akten gruppiert werden können. Das erlaubt dem Regisseur, ganze Akte als Probeneinheit auszuwählen, statt jede Szene einzeln zu wählen. In der zweiten Probenhälfte wird typischerweise akt-weise geprobt.

**Akzeptanzkriterien:**
- [ ] Szenen haben ein optionales `akt`-Feld (z.B. `1`, `2`, `3`)
- [ ] UI zeigt Szenen gruppiert nach Akt an (in Stück-Detail und Proben-Szenen-Auswahl)
- [ ] Proben-Formular erlaubt "Ganzen Akt auswählen" als Shortcut
- [ ] Bestehende Szenen ohne Akt funktionieren weiterhin (Rückwärtskompatibilität)

**Tech Notes (Martin):**

```sql
-- Migration: add akt to szenen
ALTER TABLE szenen ADD COLUMN akt integer;
-- Optional: Index für Gruppierung
CREATE INDEX idx_szenen_akt ON szenen(stueck_id, akt);
```

```
Änderungen:
├── supabase/migrations/YYYYMMDDHHMMSS_add_akt_to_szenen.sql
├── apps/web/lib/supabase/types.ts          (Szene um akt erweitern)
├── apps/web/lib/actions/stuecke.ts         (akt in CRUD berücksichtigen)
├── apps/web/lib/validations/szene.ts       (akt validieren)
├── apps/web/components/stuecke/SzenenList   (Gruppierung anzeigen)
├── apps/web/components/proben/ProbeForm     (Akt-Selektion)
```

---

### Issue 4: Mehrtägige Proben (Probenweekend)

**Labels:** `feature`, `database`, `migration`, `frontend`, `backend`, `prio:medium`
**Aufwand:** Mittel-Gross

**Beschreibung:**
Der Regisseur muss Probenweekends planen können – mehrtägige Probenblöcke, die als eine Einheit betrachtet werden, aber mehrere Tage mit verschiedenen Szenen abdecken.

**Akzeptanzkriterien:**
- [ ] Eine Probe kann als "Probenblock" mit mehreren Tagen angelegt werden
- [ ] Jeder Tag im Block hat eigene Start-/Endzeit und eigene Szenen-Zuordnung
- [ ] Die einzelnen Tage erscheinen als verknüpfte Einträge im Probenkalender
- [ ] Probenblock hat einen Gesamttitel (z.B. "Probenweekend Akt 2") und optional Tages-Untertitel
- [ ] Teilnehmer werden pro Block eingeladen (nicht pro Einzeltag)

**Tech Notes (Martin):**

```
Architektur-Entscheidung: Probenblock als Eltern-Kind-Beziehung

proben (parent = Probenblock)
├── id, titel, typ='block', datum_von, datum_bis
├── proben (children = Einzeltage)
│   ├── id, parent_id, titel, datum, startzeit, endzeit
│   │   └── proben_szenen (Szenen für diesen Tag)
│   ├── id, parent_id, titel, datum, startzeit, endzeit
│   │   └── proben_szenen
│   └── ...
└── proben_teilnehmer (auf Block-Ebene)
```

```sql
-- Migration
ALTER TABLE proben ADD COLUMN typ text DEFAULT 'einzeln'
  CHECK (typ IN ('einzeln', 'block', 'block_tag'));
ALTER TABLE proben ADD COLUMN parent_id uuid REFERENCES proben(id) ON DELETE CASCADE;
ALTER TABLE proben ADD COLUMN datum_bis date;  -- nur für typ='block'
CREATE INDEX idx_proben_parent ON proben(parent_id) WHERE parent_id IS NOT NULL;
```

```
Änderungen:
├── supabase/migrations/YYYYMMDDHHMMSS_proben_bloecke.sql
├── apps/web/lib/supabase/types.ts
├── apps/web/lib/actions/proben.ts           (Block-CRUD)
├── apps/web/lib/validations/probe.ts
├── apps/web/components/proben/ProbeForm      (Block-Modus)
├── apps/web/components/proben/ProbenList      (Block-Darstellung)
├── apps/web/app/(protected)/proben/[id]/page  (Block-Detail)
```

---

### Issue 5: Technik-Crew zu Proben einladen

**Labels:** `feature`, `backend`, `frontend`, `prio:medium`
**Aufwand:** Klein-Mittel

**Beschreibung:**
Nicht nur besetzte Darsteller, sondern auch Technik-Personal (Licht, Ton, Bühnenbau, Maske) muss zu Proben eingeladen werden können. Dies ist besonders für die Endproben und Probenweekends relevant.

**Akzeptanzkriterien:**
- [ ] Proben-Formular hat eine "Technik einladen"-Option neben der Szenen-basierten Auto-Einladung
- [ ] Technik-Personen können aus der Mitgliederliste ausgewählt werden
- [ ] Proben können als "Mit Technik" markiert werden (beeinflusst Auto-Einladung)
- [ ] Die Teilnehmer-Liste unterscheidet visuell zwischen Darstellern und Technik

**Tech Notes (Martin):**

```sql
-- Migration: Teilnehmer-Rolle bei Proben
ALTER TABLE proben_teilnehmer ADD COLUMN teilnehmer_typ text DEFAULT 'darsteller'
  CHECK (teilnehmer_typ IN ('darsteller', 'technik', 'regie', 'sonstiges'));
ALTER TABLE proben ADD COLUMN mit_technik boolean DEFAULT false;
```

```
Änderungen:
├── supabase/migrations/YYYYMMDDHHMMSS_proben_technik.sql
├── apps/web/lib/supabase/types.ts
├── apps/web/lib/actions/proben.ts           (Technik-Einladung)
├── apps/web/components/proben/ProbeForm      (Technik-Toggle + Personenauswahl)
├── apps/web/components/proben/TeilnehmerList  (Typ-Badge)
```

---

### Issue 6: 🔴 Dashboard – Kommende Proben Widget

**Labels:** `feature`, `frontend`, `prio:high`
**Aufwand:** Mittel
**Blockiert:** US-2 Kern-Anforderung

**Beschreibung:**
Das Mitglieder-Dashboard zeigt aktuell keine Proben-Informationen. Aktive Mitglieder (Darsteller und Technik) müssen auf einen Blick sehen können, wann ihre nächsten Proben sind.

**Akzeptanzkriterien:**
- [ ] Widget "Meine nächsten Proben" im Mitglieder-Dashboard
- [ ] Zeigt die nächsten 5 Proben, zu denen das Mitglied eingeladen ist
- [ ] Pro Probe: Datum, Uhrzeit, Stück-Titel, Szenen (kompakt), Ort
- [ ] Farbliche Kennzeichnung des eigenen Teilnahme-Status
- [ ] Quick-Action: Status direkt im Widget ändern (zugesagt/vielleicht/abgesagt)
- [ ] Quick-Action: Absage mit Grund direkt eingebbar
- [ ] Link zur Proben-Detailseite
- [ ] Leerzustand: "Keine anstehenden Proben" mit Link zur Probenübersicht

**Tech Notes (Martin):**

```
Neue Dateien:
├── apps/web/components/dashboard/MeineProbenWidget.tsx   (Client Component)
├── apps/web/lib/actions/proben.ts   → getMeineKommendenProben(personId)

Data Flow:
1. Dashboard (Server) → getMeineKommendenProben(personId)
2. Query: proben_teilnehmer JOIN proben JOIN stuecke WHERE person_id = X AND datum >= now()
3. Pass to MeineProbenWidget (Client, für Quick-Actions)
```

---

### Issue 7: Dashboard – Nächste Aufführungen & Stück-Verknüpfung

**Labels:** `feature`, `frontend`, `database`, `prio:medium`
**Aufwand:** Mittel

**Beschreibung:**
Das Mitglieder-Dashboard soll kommende Aufführungen anzeigen. Dafür muss eine Verknüpfung zwischen Aufführung (Veranstaltung) und Stück hergestellt werden.

**Akzeptanzkriterien:**
- [ ] Widget "Nächste Aufführungen" im Mitglieder-Dashboard
- [ ] Aufführungen (Veranstaltungen mit `typ='auffuehrung'`) können mit einem Stück verknüpft werden
- [ ] Anzeige: Datum, Uhrzeit, Stück-Titel, Ort
- [ ] Countdown bis zur nächsten Aufführung (optional)
- [ ] Link zur Aufführungs-Detailseite

**Tech Notes (Martin):**

```sql
-- Migration: Stück-Verknüpfung für Veranstaltungen
ALTER TABLE veranstaltungen ADD COLUMN stueck_id uuid REFERENCES stuecke(id) ON DELETE SET NULL;
CREATE INDEX idx_veranstaltungen_stueck ON veranstaltungen(stueck_id) WHERE stueck_id IS NOT NULL;
```

```
Änderungen:
├── supabase/migrations/YYYYMMDDHHMMSS_veranstaltungen_stueck_link.sql
├── apps/web/lib/supabase/types.ts
├── apps/web/components/dashboard/NaechsteAuffuehrungenWidget.tsx
├── apps/web/app/(protected)/auffuehrungen/  (Stück-Auswahl beim Erstellen)
```

---

### Issue 8: Dashboard – Abwesenheiten eintragen

**Labels:** `feature`, `frontend`, `backend`, `prio:medium`
**Aufwand:** Klein-Mittel

**Beschreibung:**
Mitglieder sollen Abwesenheiten direkt aus dem Dashboard heraus eintragen können – ohne durch jede einzelne Probe navigieren zu müssen.

**Akzeptanzkriterien:**
- [ ] "Abwesenheit melden"-Button im Dashboard
- [ ] Dialog/Modal: Zeitraum wählen (von-bis Datum)
- [ ] Alle Proben im gewählten Zeitraum automatisch auf "abgesagt" setzen
- [ ] Optionaler Grund für die Abwesenheit
- [ ] Bestätigungsanzeige: "3 Proben betroffen" vor dem Speichern
- [ ] Bereits abgesagte Proben werden nicht doppelt verarbeitet

**Tech Notes (Martin):**

```
Neue Dateien:
├── apps/web/components/dashboard/AbwesenheitDialog.tsx  (Client Component)
├── apps/web/lib/actions/abwesenheiten.ts

Server Action:
  meldeAbwesenheit(personId, vonDatum, bisDatum, grund?)
  → SELECT proben.id FROM proben
    JOIN proben_teilnehmer ON ...
    WHERE person_id = X AND datum BETWEEN von AND bis AND status != 'abgesagt'
  → UPDATE proben_teilnehmer SET status = 'abgesagt', absage_grund = grund
  → Return { betroffeneProben: count }
```

---

## 🗺️ Abhängigkeiten & Reihenfolge

```
Issue 1 (Bugfix Status) ─────────────────┐
Issue 2 (Bugfix DB-Funktion) ────────────┤
                                         ├──→ Issue 4 (Probenweekend)
Issue 3 (Akt-Gruppierung) ──────────────┤        │
                                         │        ↓
Issue 5 (Technik-Crew) ─────────────────┤   Issue 6 (Proben-Widget)
                                         │        │
                                         │        ↓
                                         ├──→ Issue 7 (Aufführungen-Widget)
                                         │        │
                                         │        ↓
                                         └──→ Issue 8 (Abwesenheiten)
```

**Empfohlene Reihenfolge:**

| Phase | Issues | Beschreibung |
|-------|--------|--------------|
| **Phase A: Fundament reparieren** | #1, #2 | Bugfixes – Blocking Issues zuerst |
| **Phase B: Datenmodell erweitern** | #3, #5 | Akt-Gruppierung + Technik-Teilnehmertyp |
| **Phase C: Probenweekend** | #4 | Mehrtägige Proben (aufbauend auf Phase B) |
| **Phase D: Dashboard** | #6, #7, #8 | Proben-Widget, Aufführungen, Abwesenheiten |

---

## 📊 Übersicht

| # | Issue | Typ | Prio | Aufwand | US |
|---|-------|-----|------|---------|-----|
| 1 | Bugfix Probenplan-Generator Status | 🔴 Bug | High | Klein | US-1 |
| 2 | Bugfix DB-Funktion auto_invite | 🔴 Bug | High | Klein | US-1 |
| 3 | Akt-Gruppierung für Szenen | 🟡 Feature | Medium | Mittel | US-1 |
| 4 | Mehrtägige Proben (Probenweekend) | 🟡 Feature | Medium | Mittel-Gross | US-1 |
| 5 | Technik-Crew zu Proben einladen | 🟡 Feature | Medium | Klein-Mittel | US-1 |
| 6 | Dashboard: Kommende Proben Widget | 🔴 Feature | High | Mittel | US-2 |
| 7 | Dashboard: Aufführungen + Stück-Link | 🟡 Feature | Medium | Mittel | US-2 |
| 8 | Dashboard: Abwesenheiten eintragen | 🟡 Feature | Medium | Klein-Mittel | US-2 |

**Total: 8 Issues** (2 Bugfixes + 6 Features)

---

## 🎭 Definition of Done (Milestone)

- [ ] Probenplan-Generator funktioniert mit korrekten Status-Werten
- [ ] Auto-Einladung von Probenteilnehmern funktioniert
- [ ] Szenen sind nach Akten gruppierbar
- [ ] Probenweekends können als Block geplant werden
- [ ] Technik-Crew kann zu Proben eingeladen werden
- [ ] Mitglieder-Dashboard zeigt kommende Proben
- [ ] Mitglieder-Dashboard zeigt nächste Aufführungen
- [ ] Abwesenheiten können direkt vom Dashboard gemeldet werden
- [ ] Alle neuen Features haben Unit-Tests
- [ ] Code-Review durch Ioannis (Kritiker)
- [ ] Dokumentation durch Johannes (Chronist) aktualisiert

---

*Geplant durch: Martin (Bühnenmeister) 🔨*
*Nächster Schritt: Review durch Christian (Regisseur) → dann Issues in GitHub erstellen*
