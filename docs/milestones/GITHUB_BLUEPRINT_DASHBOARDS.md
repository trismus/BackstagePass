# GitHub Blueprint: Milestone "Dashboards"

Dieses Dokument enthält alle Informationen zur Erstellung des Milestones und der Issues auf GitHub.

---

## Milestone erstellen

**Name:** Dashboards
**Description:**
```
Rollenspezifische Dashboards mit klarer Informationsarchitektur.

## Umfang
- Admin Dashboard: Systemverwaltung, Import/Export, Gruppen
- Vorstand Dashboard: 3-Säulen-Modell (Mitglieder, Produktion, Logistik)
- Mitglieder Dashboard: Outlook-Style mit Kalender und Historie
- Helfer Dashboard: Schichten und offene Einsätze

## Voraussetzung
- Gruppen-Datenmodell für flexible Team-Zugehörigkeiten

## Geschätzt
~78 Story Points über 5 Sprints
```
**Due date:** (nach Bedarf setzen)

---

## Labels erstellen (falls nicht vorhanden)

| Label | Farbe | Beschreibung |
|-------|-------|--------------|
| `database` | #0E8A16 | Datenbank-Änderungen |
| `backend` | #1D76DB | Backend/Server Actions |
| `frontend` | #5319E7 | Frontend-Komponenten |
| `admin` | #B60205 | Admin-Bereich |
| `vorstand` | #D93F0B | Vorstand-Bereich |
| `mitglieder` | #0052CC | Mitglieder-Bereich |
| `helfer` | #006B75 | Helfer-Bereich |
| `priority:high` | #B60205 | Hohe Priorität |
| `priority:medium` | #FBCA04 | Mittlere Priorität |
| `priority:low` | #C2E0C6 | Niedrige Priorität |

---

## Issues erstellen

### Issue #D1: Gruppen-Datenmodell implementieren

**Title:** `feat(db): Gruppen-Datenmodell implementieren`
**Labels:** `database`, `backend`, `priority:high`
**Milestone:** Dashboards

**Body:**
```markdown
## Beschreibung

Erstelle das Datenmodell für Gruppen und Gruppen-Mitgliedschaften. Dies ermöglicht flexible Team-Zugehörigkeiten wie "Technik-Team", "Regie-Team" oder produktionsspezifische Casts.

## Anforderungen

### Neue Tabellen

#### `gruppen`
| Spalte | Typ | Beschreibung |
|--------|-----|--------------|
| id | UUID | Primary Key |
| name | TEXT | Gruppenname |
| typ | gruppen_typ | team, gremium, produktion, sonstiges |
| beschreibung | TEXT | Optional |
| stueck_id | UUID | FK zu stuecke (für Produktions-Casts) |
| aktiv | BOOLEAN | Default true |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

#### `gruppen_mitglieder`
| Spalte | Typ | Beschreibung |
|--------|-----|--------------|
| id | UUID | Primary Key |
| gruppe_id | UUID | FK zu gruppen |
| person_id | UUID | FK zu personen |
| rolle_in_gruppe | TEXT | z.B. "Leiter", "Mitglied" |
| von | DATE | Mitgliedschaft von |
| bis | DATE | Mitgliedschaft bis |
| created_at | TIMESTAMPTZ | |

### Tasks

- [ ] Migration erstellen: `YYYYMMDDHHMMSS_add_gruppen.sql`
- [ ] Enum `gruppen_typ` erstellen
- [ ] RLS Policies definieren
- [ ] Indizes erstellen
- [ ] TypeScript Types in `lib/supabase/types.ts` ergänzen
- [ ] Server Actions erstellen: `lib/actions/gruppen.ts`
  - [ ] `getGruppen()`
  - [ ] `getGruppe(id)`
  - [ ] `createGruppe(data)`
  - [ ] `updateGruppe(id, data)`
  - [ ] `deleteGruppe(id)`
  - [ ] `addMitgliedToGruppe(gruppeId, personId, rolle?)`
  - [ ] `removeMitgliedFromGruppe(gruppeId, personId)`
  - [ ] `getGruppenForPerson(personId)`
- [ ] Initiale Gruppen einfügen (Vorstand, Technik-Team, etc.)

### Migration SQL

```sql
-- Enum
CREATE TYPE gruppen_typ AS ENUM ('team', 'gremium', 'produktion', 'sonstiges');

-- Tabellen
CREATE TABLE gruppen (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  typ gruppen_typ NOT NULL DEFAULT 'sonstiges',
  beschreibung TEXT,
  stueck_id UUID REFERENCES stuecke(id) ON DELETE SET NULL,
  aktiv BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE gruppen_mitglieder (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gruppe_id UUID NOT NULL REFERENCES gruppen(id) ON DELETE CASCADE,
  person_id UUID NOT NULL REFERENCES personen(id) ON DELETE CASCADE,
  rolle_in_gruppe TEXT,
  von DATE,
  bis DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(gruppe_id, person_id)
);

-- Indizes
CREATE INDEX idx_gruppen_typ ON gruppen(typ);
CREATE INDEX idx_gruppen_aktiv ON gruppen(aktiv) WHERE aktiv = true;
CREATE INDEX idx_gruppen_mitglieder_person ON gruppen_mitglieder(person_id);
CREATE INDEX idx_gruppen_mitglieder_gruppe ON gruppen_mitglieder(gruppe_id);
```

## Akzeptanzkriterien

- [ ] Migration läuft ohne Fehler
- [ ] RLS Policies: Management kann CRUD, alle können lesen
- [ ] Types sind in types.ts definiert
- [ ] Alle Server Actions funktionieren
- [ ] Initiale Gruppen sind vorhanden

## Story Points: 5
```

---

### Issue #D2: Admin Dashboard - System Status

**Title:** `feat(admin): System Status Card implementieren`
**Labels:** `frontend`, `admin`, `priority:high`
**Milestone:** Dashboards

**Body:**
```markdown
## Beschreibung

Erstelle eine System-Status-Komponente für das Admin Dashboard, die wichtige Systeminformationen anzeigt.

## Anforderungen

### Komponente: `SystemStatusCard`

**Pfad:** `components/admin/SystemStatusCard.tsx`

**Anzuzeigende Informationen:**
- Version (aus package.json)
- Build-Nummer / Commit Hash (optional, aus Umgebungsvariable)
- Umgebung (Development/Production)
- Health-Checks:
  - Database: OK/Error
  - Auth: OK/Error
  - Storage: OK/Error (optional)

### Tasks

- [ ] `SystemStatusCard` Komponente erstellen
- [ ] Version aus `package.json` lesen (Server Component)
- [ ] Umgebungsvariable für Build-Nummer: `NEXT_PUBLIC_BUILD_NUMBER`
- [ ] Health-Check Endpunkt oder direkte Prüfung
- [ ] Farbcodierung: Grün = OK, Rot = Error
- [ ] In Admin Dashboard integrieren

### Design

```
┌─────────────────────────────────┐
│ SYSTEM                          │
│                                 │
│ Version:     1.0.0              │
│ Build:       #142               │
│ Umgebung:    Production         │
│                                 │
│ ● Datenbank    OK               │
│ ● Auth         OK               │
│ ● Storage      OK               │
└─────────────────────────────────┘
```

## Akzeptanzkriterien

- [ ] Version wird korrekt angezeigt
- [ ] Umgebung wird korrekt erkannt (NODE_ENV)
- [ ] Health-Status wird visuell dargestellt
- [ ] Komponente ist in Admin Dashboard sichtbar

## Story Points: 2
```

---

### Issue #D3: Admin Dashboard - Daten Import/Export

**Title:** `feat(admin): CSV Import/Export implementieren`
**Labels:** `frontend`, `backend`, `admin`, `priority:medium`
**Milestone:** Dashboards

**Body:**
```markdown
## Beschreibung

Implementiere CSV Import/Export Funktionalität für Massendaten-Operationen.

## Anforderungen

### Komponente: `DataImportExportCard`

**Pfad:** `components/admin/DataImportExportCard.tsx`

### Import

**Unterstützte Entitäten:**
- Mitglieder (personen)
- Partner
- Stücke (optional)

**Workflow:**
1. Datei auswählen (CSV)
2. Vorschau der Daten
3. Validierung anzeigen (Fehler markieren)
4. Bestätigung
5. Import durchführen
6. Ergebnis anzeigen

**CSV Format Mitglieder:**
```csv
vorname,nachname,email,telefon,strasse,plz,ort,geburtstag,rolle
Max,Mustermann,max@example.com,0791234567,Musterstr 1,8000,Zürich,1990-05-15,mitglied
```

### Export

- Export aller Mitglieder als CSV
- Export aller Partner als CSV
- Export aller Daten (ZIP mit mehreren CSVs)

### Tasks

- [ ] `papaparse` Dependency hinzufügen
- [ ] `DataImportExportCard` Komponente
- [ ] Import-Modal mit Vorschau
- [ ] CSV Parser mit Validierung
- [ ] Server Action: `importMitglieder(data[])`
- [ ] Server Action: `importPartner(data[])`
- [ ] Server Action: `exportMitglieder()` → CSV
- [ ] Server Action: `exportPartner()` → CSV
- [ ] Fehlerbehandlung mit detaillierten Meldungen
- [ ] In Admin Dashboard integrieren

### Validierung

- Pflichtfelder prüfen (vorname, nachname, email)
- E-Mail Format validieren
- Duplikate erkennen (E-Mail)
- Ungültige Zeilen markieren

## Akzeptanzkriterien

- [ ] CSV Import für Mitglieder funktioniert
- [ ] Validierungsfehler werden angezeigt
- [ ] Vorschau vor Import
- [ ] Export generiert valides CSV
- [ ] Fehlerhafte Zeilen werden übersprungen mit Meldung

## Story Points: 8
```

---

### Issue #D4: Admin Dashboard - Dokumentation

**Title:** `feat(admin): Dokumentations-Links implementieren`
**Labels:** `frontend`, `admin`, `priority:low`
**Milestone:** Dashboards

**Body:**
```markdown
## Beschreibung

Erstelle Dokumentations-Card mit Links und Changelog-Anzeige.

## Anforderungen

### Komponente: `DocumentationCard`

**Pfad:** `components/admin/DocumentationCard.tsx`

**Inhalte:**
- Link: Benutzerhandbuch (extern oder `/docs`)
- Link: API Dokumentation (falls vorhanden)
- Changelog aus `CHANGELOG.md` laden und anzeigen

### Tasks

- [ ] `DocumentationCard` Komponente
- [ ] Links konfigurierbar machen
- [ ] `CHANGELOG.md` im Root erstellen (falls nicht vorhanden)
- [ ] Changelog parsen und anzeigen (letzte 5 Einträge)
- [ ] In Admin Dashboard integrieren

### Design

```
┌─────────────────────────────────┐
│ DOKUMENTATION                   │
│                                 │
│ 📖 Benutzerhandbuch             │
│ 📋 API Dokumentation            │
│ 📝 Changelog                    │
│                                 │
│ Letzte Änderungen:              │
│ • v1.1.0: Dashboards            │
│ • v1.0.1: Bugfixes              │
│ • v1.0.0: Initial Release       │
└─────────────────────────────────┘
```

## Akzeptanzkriterien

- [ ] Links sind klickbar und funktionieren
- [ ] Changelog wird aus Datei geladen
- [ ] Fallback wenn Changelog nicht existiert

## Story Points: 2
```

---

### Issue #D5: Admin Dashboard - Gruppen-Verwaltung

**Title:** `feat(admin): Gruppen-Verwaltung UI implementieren`
**Labels:** `frontend`, `admin`, `priority:high`
**Milestone:** Dashboards
**Depends on:** #D1

**Body:**
```markdown
## Beschreibung

CRUD UI für Gruppen im Admin-Bereich.

## Anforderungen

### Komponente: `GruppenTable`

**Pfad:** `components/admin/GruppenTable.tsx`

### Features

- Liste aller Gruppen
- Filter nach Typ (team, gremium, produktion)
- Gruppe erstellen (Modal)
- Gruppe bearbeiten
- Gruppe löschen (mit Bestätigung)
- Mitglieder einer Gruppe anzeigen
- Mitglieder hinzufügen/entfernen

### Tasks

- [ ] `GruppenTable` Komponente
- [ ] `GruppeForm` Modal für Create/Edit
- [ ] `GruppeMitgliederModal` für Mitgliederverwaltung
- [ ] Person-Suche für Hinzufügen
- [ ] Bestätigungs-Dialog für Löschen
- [ ] In Admin Dashboard integrieren

### Design

```
┌─────────────────────────────────────────────────────────────────┐
│ GRUPPEN                                    [+ Neue Gruppe]      │
├───────────────────┬─────────┬────────────────┬─────────────────┤
│ Name              │ Typ     │ Mitglieder     │ Aktionen        │
├───────────────────┼─────────┼────────────────┼─────────────────┤
│ Vorstand          │ Gremium │ 5 Mitglieder   │ [✏️] [👥] [🗑️] │
│ Technik-Team      │ Team    │ 8 Mitglieder   │ [✏️] [👥] [🗑️] │
│ Cast Revisor      │ Produkt.│ 12 Mitglieder  │ [✏️] [👥] [🗑️] │
└───────────────────┴─────────┴────────────────┴─────────────────┘
```

## Akzeptanzkriterien

- [ ] CRUD Operationen funktionieren
- [ ] Mitgliederverwaltung intuitiv
- [ ] Bestätigung bei Löschung
- [ ] Filter funktioniert

## Story Points: 5
```

---

### Issue #D6: Admin Dashboard - Vorstand-Switch

**Title:** `feat(admin): Switch zu Vorstand-Dashboard implementieren`
**Labels:** `frontend`, `admin`, `priority:medium`
**Milestone:** Dashboards

**Body:**
```markdown
## Beschreibung

Toggle im Header für ADMIN um zwischen Admin- und Vorstand-Dashboard zu wechseln.

## Anforderungen

### Implementierung

- Button/Toggle im Header (nur für ADMIN sichtbar)
- Wechsel zwischen `/admin` und `/dashboard`
- Visuelles Feedback welche Ansicht aktiv

### Tasks

- [ ] Toggle-Komponente im Header
- [ ] Nur für `role === 'ADMIN'` sichtbar
- [ ] State: aktive Ansicht (admin/vorstand)
- [ ] Styling: Aktive Ansicht hervorheben
- [ ] Optional: Keyboard Shortcut

### Design

```
┌─────────────────────────────────────────────────────────────────┐
│ BackstagePass                    [Admin | Vorstand]  Max ▼      │
└─────────────────────────────────────────────────────────────────┘
                                        ↑
                                   Toggle Switch
```

## Akzeptanzkriterien

- [ ] Toggle wechselt zwischen Dashboards
- [ ] Nur für ADMIN sichtbar
- [ ] Aktive Ansicht ist visuell erkennbar

## Story Points: 3
```

---

### Issue #D7: Vorstand Dashboard - 3-Säulen Layout

**Title:** `feat(vorstand): 3-Säulen Layout implementieren`
**Labels:** `frontend`, `vorstand`, `priority:high`
**Milestone:** Dashboards

**Body:**
```markdown
## Beschreibung

Implementiere das responsive 3-Säulen-Layout für das Vorstand-Dashboard.

## Anforderungen

### Layout

**Desktop (lg+):** 3 Spalten nebeneinander
**Tablet (md):** 2 Spalten + 1 darunter
**Mobile (sm):** 1 Spalte mit Tabs oder Akkordeon

### Komponenten

- `VorstandDashboard` - Hauptseite
- `VorstandModul` - Wiederverwendbare Säulen-Komponente
- Zeitraum-Filter: Diese Woche / Dieser Monat / Nächste Produktion

### Tasks

- [ ] `VorstandDashboard` Seite (ersetzt aktuelles `/dashboard` für VORSTAND)
- [ ] `VorstandModul` Basis-Komponente
- [ ] Responsive Grid (Tailwind)
- [ ] Zeitraum-Filter mit State
- [ ] Mobile Navigation (Tabs)

### Design

```
Desktop:
┌─────────────────┬─────────────────┬─────────────────┐
│ Modul 1         │ Modul 2         │ Modul 3         │
│ Mitglieder      │ Künstlerisch    │ Logistik        │
└─────────────────┴─────────────────┴─────────────────┘

Mobile:
┌─────────────────────────────────────────────────────┐
│ [Mitglieder] [Künstlerisch] [Logistik]              │
├─────────────────────────────────────────────────────┤
│ Inhalt des aktiven Tabs                             │
└─────────────────────────────────────────────────────┘
```

## Akzeptanzkriterien

- [ ] 3 Spalten auf Desktop
- [ ] Responsive auf Tablet und Mobile
- [ ] Filter funktioniert und aktualisiert Daten
- [ ] Mobile Tabs/Akkordeon funktioniert

## Story Points: 5
```

---

### Issue #D8: Vorstand Dashboard - Modul 1 (Mitglieder & Helfer)

**Title:** `feat(vorstand): Modul 1 - Mitglieder & Helfer implementieren`
**Labels:** `frontend`, `vorstand`, `priority:high`
**Milestone:** Dashboards
**Depends on:** #D7, #D11

**Body:**
```markdown
## Beschreibung

Implementiere Modul 1 des Vorstand-Dashboards: Mitglieder & Helfer Verwaltung.

## Anforderungen

### Inhalte

1. **Übersicht**
   - Anzahl Mitglieder (gesamt/aktiv)
   - Anzahl registrierte Helfer

2. **Handlungsbedarf** (rot/gelb markiert)
   - Fehlende Helfer für anstehende Einsätze
   - Unvollständige Profile

3. **Letzte Aktivitäten**
   - Neue Mitglieder
   - Austritte/Deaktivierungen

4. **Quick-Links**
   - → Mitglieder
   - → Helfereinsätze
   - → Gruppen

### Tasks

- [ ] `MitgliederModul` Komponente
- [ ] Statistik-Queries implementieren
- [ ] Handlungsbedarf-Berechnung
- [ ] Aktivitäten-Liste (letzte 7 Tage)
- [ ] Quick-Links

### Daten-Queries

```typescript
// Statistik
const stats = {
  mitglieder: await countMitglieder(),
  mitgliederAktiv: await countMitglieder({ aktiv: true }),
  helfer: await countByRole('HELFER')
}

// Offene Positionen
const offenePositionen = await getOffeneHelferPositionen(zeitraum)

// Aktivitäten
const aktivitaeten = await getLetzteMitgliederAktivitaeten(7)
```

## Akzeptanzkriterien

- [ ] Statistiken korrekt
- [ ] Handlungsbedarf farblich markiert
- [ ] Aktivitäten werden angezeigt
- [ ] Links funktionieren

## Story Points: 5
```

---

### Issue #D9: Vorstand Dashboard - Modul 2 (Künstlerische Produktion)

**Title:** `feat(vorstand): Modul 2 - Künstlerische Produktion implementieren`
**Labels:** `frontend`, `vorstand`, `priority:high`
**Milestone:** Dashboards
**Depends on:** #D7, #D11

**Body:**
```markdown
## Beschreibung

Implementiere Modul 2 des Vorstand-Dashboards: Künstlerische Produktion.

## Anforderungen

### Inhalte

1. **Übersicht**
   - Aktives Stück (Titel, Status)
   - Premiere-Datum
   - Besetzungsstatus (X/Y Rollen besetzt)

2. **Handlungsbedarf**
   - Unbesetzte Rollen

3. **Probenplan**
   - Kommende Proben (diese Woche)

4. **Quick-Links**
   - → Probenplan
   - → Besetzung
   - → Stücke

### Tasks

- [ ] `ProduktionModul` Komponente
- [ ] Aktives Stück ermitteln (Status = 'in_proben' oder 'aktiv')
- [ ] Besetzungsstatus berechnen
- [ ] Proben-Query (nächste 7 Tage)
- [ ] Quick-Links

### Daten-Queries

```typescript
// Aktives Stück
const aktivesStudck = await getAktivesStudck()

// Besetzung
const besetzung = {
  gesamt: await countRollen(stueckId),
  besetzt: await countBesetztRollen(stueckId)
}

// Proben
const proben = await getKommendeProben(stueckId, 7)
```

## Akzeptanzkriterien

- [ ] Aktives Stück wird angezeigt
- [ ] Unbesetzte Rollen als Warnung
- [ ] Proben werden aufgelistet
- [ ] Links funktionieren

## Story Points: 5
```

---

### Issue #D10: Vorstand Dashboard - Modul 3 (Produktion & Logistik)

**Title:** `feat(vorstand): Modul 3 - Produktion & Logistik implementieren`
**Labels:** `frontend`, `vorstand`, `priority:high`
**Milestone:** Dashboards
**Depends on:** #D7, #D11

**Body:**
```markdown
## Beschreibung

Implementiere Modul 3 des Vorstand-Dashboards: Produktion & Logistik.

## Anforderungen

### Inhalte

1. **Übersicht**
   - Anzahl Aufführungen
   - Nächste Aufführung (Datum, Titel)

2. **Handlungsbedarf**
   - Unbesetzte Schichten für Aufführungen

3. **Ressourcen-Status**
   - Aktive Reservierungen

4. **Termine**
   - Kommende Aufführungen

5. **Quick-Links**
   - → Aufführungen
   - → Ressourcen
   - → Räume

### Tasks

- [ ] `LogistikModul` Komponente
- [ ] Aufführungen-Statistik
- [ ] Schichten-Status berechnen
- [ ] Ressourcen-Reservierungen
- [ ] Quick-Links

## Akzeptanzkriterien

- [ ] Aufführungen werden angezeigt
- [ ] Unbesetzte Schichten als Warnung
- [ ] Ressourcen-Status sichtbar
- [ ] Links funktionieren

## Story Points: 5
```

---

### Issue #D11: Vorstand Dashboard - Handlungsbedarf-Komponente

**Title:** `feat(vorstand): Handlungsbedarf-Komponente implementieren`
**Labels:** `frontend`, `vorstand`, `priority:high`
**Milestone:** Dashboards

**Body:**
```markdown
## Beschreibung

Wiederverwendbare Komponente für Warnungen/Handlungsbedarf mit Farbcodierung.

## Anforderungen

### Komponente: `HandlungsbedarfCard`

**Pfad:** `components/dashboard/HandlungsbedarfCard.tsx`

**Props:**
```typescript
interface HandlungsbedarfCardProps {
  titel: string
  beschreibung: string
  schweregrad: 'ok' | 'warnung' | 'kritisch'
  anzahl?: number
  link?: string
  linkText?: string
}
```

**Farbcodierung:**
- `ok` (🟢): bg-green-50, border-green-200, text-green-800
- `warnung` (🟡): bg-yellow-50, border-yellow-200, text-yellow-800
- `kritisch` (🔴): bg-red-50, border-red-200, text-red-800

### Tasks

- [ ] `HandlungsbedarfCard` Komponente
- [ ] Farbcodierung implementieren
- [ ] Icon basierend auf Schweregrad
- [ ] Optionaler Link
- [ ] Badge für Anzahl

### Design

```
┌─────────────────────────────────┐
│ 🔴 2 Helfer fehlen              │
│    für Aufführung 15.02         │
│                                 │
│    [→ Jetzt zuweisen]           │
└─────────────────────────────────┘
```

## Akzeptanzkriterien

- [ ] Komponente ist wiederverwendbar
- [ ] Farbcodierung funktioniert
- [ ] Link ist optional und funktioniert

## Story Points: 3
```

---

### Issue #D12: Mitglieder Dashboard - Layout Restructure

**Title:** `feat(mitglieder): Mein-Bereich Layout neu strukturieren`
**Labels:** `frontend`, `mitglieder`, `priority:high`
**Milestone:** Dashboards

**Body:**
```markdown
## Beschreibung

Komplette Neustrukturierung des Mein-Bereich Layouts im Outlook-Style.

## Anforderungen

### Layout (Desktop)

```
┌────────────────────────────────────┬────────────────────────────────────────┐
│ KALENDER + TERMINE                 │ PROFIL + STUNDENKONTO                  │
│ (50%)                              │ (50%)                                  │
├────────────────────────────────────┼────────────────────────────────────────┤
│ ROLLEN-HISTORIE                    │ HELFEREINSATZ-HISTORIE                 │
│ (50%)                              │ (50%)                                  │
└────────────────────────────────────┴────────────────────────────────────────┘
```

### Layout (Mobile)

Alles untereinander, mit Profil zuerst.

### Tasks

- [ ] Neues Layout implementieren
- [ ] Responsive Grid
- [ ] Platzhalter für Sub-Komponenten

## Akzeptanzkriterien

- [ ] Layout entspricht Spezifikation
- [ ] Responsive auf allen Geräten

## Story Points: 3
```

---

### Issue #D13: Mitglieder Dashboard - Mini-Kalender

**Title:** `feat(mitglieder): Mini-Kalender mit Terminen implementieren`
**Labels:** `frontend`, `mitglieder`, `priority:high`
**Milestone:** Dashboards

**Body:**
```markdown
## Beschreibung

Implementiere Mini-Kalender mit markierten Terminen und iCal Export.

## Anforderungen

### Komponente: `MiniCalendar`

**Pfad:** `components/mein-bereich/MiniCalendar.tsx`

**Features:**
- Monatsansicht
- Navigation (Vor/Zurück)
- Termine markieren:
  - 🎭 Aufführungen (rot)
  - 🎬 Proben (blau)
  - 🛠️ Helfereinsätze (grün)
- Klick auf Tag → Liste der Termine
- iCal Export Button

### Tasks

- [ ] `MiniCalendar` Komponente (oder Library verwenden)
- [ ] Termine laden für aktuellen Monat
- [ ] Markierungen nach Typ
- [ ] Detail-Ansicht bei Klick
- [ ] iCal Export generieren

### iCal Format

```ics
BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
DTSTART:20250215T193000
DTEND:20250215T220000
SUMMARY:Premiere "Der Revisor"
LOCATION:Aula Schulhaus Widen
END:VEVENT
END:VCALENDAR
```

## Akzeptanzkriterien

- [ ] Kalender zeigt aktuellen Monat
- [ ] Termine sind farblich markiert
- [ ] Navigation zwischen Monaten
- [ ] iCal Export funktioniert

## Story Points: 8
```

---

### Issue #D14: Mitglieder Dashboard - Profil-Bearbeitung

**Title:** `feat(mitglieder): Profil-Bearbeitung implementieren`
**Labels:** `frontend`, `mitglieder`, `priority:medium`
**Milestone:** Dashboards

**Body:**
```markdown
## Beschreibung

Profil-Card mit Bearbeitungsmöglichkeit für persönliche Daten.

## Anforderungen

### Komponente: `ProfilCard`

**Pfad:** `components/mein-bereich/ProfilCard.tsx`

**Anzeigefelder:**
- Avatar (Initialen)
- Vorname, Nachname
- E-Mail
- Telefon
- Adresse (Strasse, PLZ, Ort)

**Bearbeitung:**
- Modal oder Inline-Edit
- Validierung
- Speichern in `personen` Tabelle

### Tasks

- [ ] `ProfilCard` Komponente
- [ ] Avatar mit Initialen
- [ ] `ProfilEditModal` oder Inline-Edit
- [ ] Server Action: `updatePerson(id, data)`
- [ ] Validierung (Pflichtfelder, E-Mail Format)

## Akzeptanzkriterien

- [ ] Profildaten werden angezeigt
- [ ] Bearbeitung öffnet Formular
- [ ] Änderungen werden gespeichert
- [ ] Validierungsfehler werden angezeigt

## Story Points: 3
```

---

### Issue #D15: Mitglieder Dashboard - Rollen-Historie

**Title:** `feat(mitglieder): Rollen-Historie implementieren`
**Labels:** `frontend`, `mitglieder`, `priority:medium`
**Milestone:** Dashboards

**Body:**
```markdown
## Beschreibung

Anzeige aller gespielten Rollen (aktuell + vergangene Produktionen).

## Anforderungen

### Komponente: `RollenHistorie`

**Pfad:** `components/mein-bereich/RollenHistorie.tsx`

**Inhalte:**
- Aktuelle Produktion hervorgehoben
- Vergangene Rollen nach Jahr gruppiert
- Rolle, Stück, Jahr
- Link zu Stück-Details

### Tasks

- [ ] `RollenHistorie` Komponente
- [ ] Daten aus `besetzungen` + `rollen` + `stuecke` laden
- [ ] Gruppierung nach Jahr
- [ ] Aktuelle Produktion markieren

## Akzeptanzkriterien

- [ ] Alle Rollen werden angezeigt
- [ ] Aktuelle Produktion ist hervorgehoben
- [ ] Chronologische Sortierung

## Story Points: 3
```

---

### Issue #D16: Mitglieder Dashboard - Helfereinsatz-Historie

**Title:** `feat(mitglieder): Helfereinsatz-Historie implementieren`
**Labels:** `frontend`, `mitglieder`, `priority:medium`
**Milestone:** Dashboards

**Body:**
```markdown
## Beschreibung

Anzeige aller Helfereinsätze mit Unterscheidung geplant/abgeschlossen.

## Anforderungen

### Komponente: `HelfereinsatzHistorie`

**Pfad:** `components/mein-bereich/HelfereinsatzHistorie.tsx`

**Inhalte:**
- Geplante Einsätze (oben)
- Abgeschlossene Einsätze (darunter)
- Stunden pro Einsatz
- Gesamt-Stunden

### Tasks

- [ ] `HelfereinsatzHistorie` Komponente
- [ ] Daten aus `helferschichten` laden
- [ ] Trennung geplant/abgeschlossen
- [ ] Stunden berechnen

## Akzeptanzkriterien

- [ ] Einsätze werden angezeigt
- [ ] Unterscheidung geplant/abgeschlossen
- [ ] Stunden sind korrekt

## Story Points: 3
```

---

### Issue #D17: Helfer Dashboard - Schichten-Liste erweitern

**Title:** `feat(helfer): Erweiterte Schichten-Liste implementieren`
**Labels:** `frontend`, `helfer`, `priority:high`
**Milestone:** Dashboards

**Body:**
```markdown
## Beschreibung

Erweiterte Darstellung der zugewiesenen Schichten mit allen Details.

## Anforderungen

### Komponente: `MeineSchichtenListe`

**Pfad:** `components/helfer/MeineSchichtenListe.tsx`

**Pro Schicht anzeigen:**
- Datum
- Anlass (Aufführung, Event)
- Schicht-Typ (Einlass, Abbau, etc.)
- Uhrzeit
- Ort
- Status (Bestätigt/Ausstehend)
- Kontaktperson mit Telefon

### Tasks

- [ ] `MeineSchichtenListe` Komponente
- [ ] `SchichtCard` für einzelne Schicht
- [ ] Kontaktinfo laden
- [ ] Status-Anzeige
- [ ] Sortierung nach Datum

## Akzeptanzkriterien

- [ ] Alle zugewiesenen Schichten sichtbar
- [ ] Details sind vollständig
- [ ] Kontakt ist angezeigt

## Story Points: 3
```

---

### Issue #D18: Helfer Dashboard - Offene Einsätze mit Priorisierung

**Title:** `feat(helfer): Offene Einsätze mit Dringlichkeit implementieren`
**Labels:** `frontend`, `helfer`, `priority:high`
**Milestone:** Dashboards

**Body:**
```markdown
## Beschreibung

Liste offener Einsätze mit Dringlichkeits-Anzeige und Anmelde-Funktion.

## Anforderungen

### Komponente: `OffeneEinsaetzeListe`

**Pfad:** `components/helfer/OffeneEinsaetzeListe.tsx`

**Features:**
- Priorisierung:
  - 🔴 Dringend: < 3 Tage
  - 🟡 Bald: 3-7 Tage
  - 🟢 Normal: > 7 Tage
- Anmelde-Button
- Anzahl freier Plätze
- Filter nach Zeitraum

### Tasks

- [ ] `OffeneEinsaetzeListe` Komponente
- [ ] `EinsatzCard` mit Anmelde-Button
- [ ] Priorisierungs-Logik
- [ ] Server Action: `meldeAnFuerSchicht(schichtId, personId)`
- [ ] Freie Plätze berechnen

### Priorisierung

```typescript
function getPrioritaet(datum: Date): 'dringend' | 'bald' | 'normal' {
  const tageBis = differenceInDays(datum, new Date())
  if (tageBis <= 3) return 'dringend'
  if (tageBis <= 7) return 'bald'
  return 'normal'
}
```

## Akzeptanzkriterien

- [ ] Einsätze sind priorisiert
- [ ] Anmeldung funktioniert
- [ ] Freie Plätze werden angezeigt
- [ ] Nach Anmeldung verschwindet Einsatz aus Liste

## Story Points: 5
```

---

### Issue #D19: Helfer Dashboard - Statistik

**Title:** `feat(helfer): Helfer-Statistik implementieren`
**Labels:** `frontend`, `helfer`, `priority:low`
**Milestone:** Dashboards

**Body:**
```markdown
## Beschreibung

Statistik-Card für Helfer mit Übersicht über geleistete Einsätze.

## Anforderungen

### Komponente: `HelferStatistik`

**Pfad:** `components/helfer/HelferStatistik.tsx`

**Inhalte:**
- Anzahl Einsätze gesamt
- Stunden geleistet gesamt
- Stunden dieses Jahr

### Tasks

- [ ] `HelferStatistik` Komponente
- [ ] Daten aus `helferschichten` aggregieren
- [ ] Jahres-Filter

## Akzeptanzkriterien

- [ ] Statistiken werden korrekt berechnet
- [ ] Anzeige ist übersichtlich

## Story Points: 2
```

---

## Issue-Erstellungs-Checkliste

1. [ ] Milestone "Dashboards" erstellen
2. [ ] Labels erstellen (falls nicht vorhanden)
3. [ ] Issues in dieser Reihenfolge erstellen:
   - [ ] #D1: Gruppen-Datenmodell
   - [ ] #D2: System Status
   - [ ] #D3: Import/Export
   - [ ] #D4: Dokumentation
   - [ ] #D5: Gruppen-Verwaltung
   - [ ] #D6: Vorstand-Switch
   - [ ] #D7: 3-Säulen Layout
   - [ ] #D8: Modul 1
   - [ ] #D9: Modul 2
   - [ ] #D10: Modul 3
   - [ ] #D11: Handlungsbedarf
   - [ ] #D12: Mitglieder Layout
   - [ ] #D13: Mini-Kalender
   - [ ] #D14: Profil-Bearbeitung
   - [ ] #D15: Rollen-Historie
   - [ ] #D16: Helfereinsatz-Historie
   - [ ] #D17: Schichten-Liste
   - [ ] #D18: Offene Einsätze
   - [ ] #D19: Helfer-Statistik
4. [ ] Dependencies verlinken ("Depends on #X")

---

## Sprint-Zuordnung

| Sprint | Issues |
|--------|--------|
| Sprint 1 | #D1, #D2 |
| Sprint 2 | #D3, #D4, #D5, #D6 |
| Sprint 3 | #D7, #D8, #D9, #D10, #D11 |
| Sprint 4 | #D12, #D13, #D14, #D15, #D16 |
| Sprint 5 | #D17, #D18, #D19 |
