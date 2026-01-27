# Milestone: Dashboards

**Ziel:** Rollenspezifische Dashboards mit klarer Informationsarchitektur und Gruppen-System für flexible Team-Zugehörigkeiten.

**Priorität:** Hoch
**Ziel-Version:** v1.1

---

## Übersicht

### Dashboard-Prioritäten

| Prio | Dashboard | Zielgruppe | Fokus |
|------|-----------|------------|-------|
| 1 | Admin | ADMIN | Systemverwaltung, Import, Dokumentation |
| 2 | Vorstand | VORSTAND, ADMIN | 3-Säulen-Modell, Überblick, Warnungen |
| 3 | Mitglieder | MITGLIED_AKTIV | Outlook-Style, Kalender, Historie |
| 4 | Helfer | HELFER | Schichten, offene Einsätze |
| — | Partner | PARTNER | Später |

### Architektur-Entscheidungen

| Entscheidung | Gewählt | Begründung |
|--------------|---------|------------|
| Vorstand als Rolle oder Gruppe? | **Rolle** | Eigenes Dashboard mit speziellem Zugriff |
| Cast automatisch oder manuell? | **Beides** | Automatisch aus Besetzungen + manuell erweiterbar |
| Admin-Switch zu Vorstand | **Toggle im Header** | Einfacher Wechsel zwischen Dashboards |

---

## Datenmodell-Erweiterung: Gruppen

### Neue Tabellen

```sql
-- Gruppen (Teams, Gremien, Produktions-Casts)
CREATE TABLE gruppen (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  typ gruppen_typ NOT NULL,
  beschreibung TEXT,
  stueck_id UUID REFERENCES stuecke(id) ON DELETE SET NULL,
  aktiv BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enum für Gruppen-Typen
CREATE TYPE gruppen_typ AS ENUM ('team', 'gremium', 'produktion', 'sonstiges');

-- Gruppen-Mitgliedschaften
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
CREATE INDEX idx_gruppen_aktiv ON gruppen(aktiv);
CREATE INDEX idx_gruppen_mitglieder_person ON gruppen_mitglieder(person_id);
CREATE INDEX idx_gruppen_mitglieder_gruppe ON gruppen_mitglieder(gruppe_id);
```

### Vordefinierte Gruppen

| Name | Typ | Beschreibung |
|------|-----|--------------|
| Vorstand | gremium | Vereinsvorstand |
| Technik-Team | team | Technik & Bühnenbau |
| Maske & Kostüm | team | Maske und Kostümabteilung |
| Regie-Team | team | Regie und Regieassistenz |

---

## Dashboard-Spezifikationen

### 1. Admin Dashboard

**Route:** `/admin` (bestehend, erweitern)

**Layout:**
```
┌─────────────────────────────────────────────────────────────────────────────┐
│ ADMIN DASHBOARD                                        [→ Vorstand-Ansicht] │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────────────┐  │
│  │ SYSTEM          │  │ DATEN           │  │ DOKUMENTATION               │  │
│  │                 │  │                 │  │                             │  │
│  │ Version: 1.0.0  │  │ [CSV Import]    │  │ [📖 Benutzerhandbuch]       │  │
│  │ Build: #142     │  │  └ Mitglieder   │  │ [📋 API Dokumentation]      │  │
│  │ Env: Production │  │  └ Partner      │  │ [📝 Changelog]              │  │
│  │                 │  │  └ Stücke       │  │                             │  │
│  │ ● DB: OK        │  │                 │  │                             │  │
│  │ ● Auth: OK      │  │ [CSV Export]    │  │                             │  │
│  │ ● Storage: OK   │  │  └ Alle Daten   │  │                             │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────────────────┘  │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│ BENUTZERVERWALTUNG                                                          │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ [Bestehende UsersTable Komponente]                                      │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│ GRUPPEN-VERWALTUNG                                                          │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ [Neue GruppenTable Komponente]                                          │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│ [Audit Log →]                                                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Komponenten:**
- `SystemStatusCard` - Version, Build, Health-Checks
- `DataImportCard` - CSV Import für Mitglieder, Partner, Stücke
- `DocumentationCard` - Links zu Dokumentation
- `GruppenTable` - CRUD für Gruppen
- `UsersTable` - Bestehend

---

### 2. Vorstand Dashboard (3-Säulen-Modell)

**Route:** `/dashboard` (für VORSTAND und ADMIN mit Switch)

**Layout:**
```
┌─────────────────────────────────────────────────────────────────────────────┐
│ VORSTAND DASHBOARD                           Filter: [Diese Woche ▼]        │
├───────────────────────┬───────────────────────┬─────────────────────────────┤
│ MODUL 1               │ MODUL 2               │ MODUL 3                     │
│ Mitglieder & Helfer   │ Künstlerische Prod.   │ Produktion & Logistik       │
├───────────────────────┼───────────────────────┼─────────────────────────────┤
│                       │                       │                             │
│ 📊 ÜBERSICHT          │ 📊 ÜBERSICHT          │ 📊 ÜBERSICHT                │
│ Mitglieder: 45        │ Stück: "Der Revisor"  │ Aufführungen: 3             │
│ davon aktiv: 38       │ Status: In Proben     │ davon diese Wo: 1           │
│ Helfer: 12            │ Premiere: 15.02.2025  │                             │
│                       │                       │                             │
│ ⚠️ HANDLUNGSBEDARF    │ ⚠️ HANDLUNGSBEDARF    │ ⚠️ HANDLUNGSBEDARF          │
│ ┌─────────────────┐   │ ┌─────────────────┐   │ ┌─────────────────┐         │
│ │ 🔴 2 Helfer     │   │ │ 🟡 2 Rollen     │   │ │ 🔴 3 Schichten  │         │
│ │ fehlen für      │   │ │ unbesetzt       │   │ │ unbesetzt für   │         │
│ │ 15.02           │   │ │                 │   │ │ Premiere        │         │
│ └─────────────────┘   │ └─────────────────┘   │ └─────────────────┘         │
│                       │                       │                             │
│ 📅 AKTIVITÄTEN        │ 📅 PROBEN             │ 📅 TERMINE                  │
│ • Neu: Max Muster     │ • Mo 19:00 Szene 3    │ • Sa 15.02 Premiere         │
│ • Austritt: H. Meier  │ • Mi 19:00 Szene 5    │ • So 16.02 2. Auff.         │
│                       │ • Fr 19:00 Durchlauf  │ • Sa 22.02 Dernière         │
│                       │                       │                             │
│ [→ Mitglieder]        │ [→ Probenplan]        │ [→ Aufführungen]            │
│ [→ Helfereinsätze]    │ [→ Besetzung]         │ [→ Ressourcen]              │
│ [→ Gruppen]           │ [→ Stücke]            │ [→ Räume]                   │
└───────────────────────┴───────────────────────┴─────────────────────────────┘
```

**Komponenten:**
- `VorstandModul` - Wiederverwendbar für jede Säule
- `HandlungsbedarfCard` - Warnungen mit Farbcodierung
- `AktivitaetenListe` - Letzte Änderungen
- `QuickLinks` - Direktlinks zu Modulen

**Farbcodierung:**
- 🟢 Grün: Alles OK
- 🟡 Gelb: Aufmerksamkeit erforderlich
- 🔴 Rot: Kritisch, sofortiger Handlungsbedarf

---

### 3. Mitglieder Dashboard (Outlook-Style)

**Route:** `/mein-bereich` (bestehend, komplett neu gestalten)

**Layout:**
```
┌─────────────────────────────────────────────────────────────────────────────┐
│ MEIN BEREICH                                                                │
├────────────────────────────────────┬────────────────────────────────────────┤
│                                    │ MEIN PROFIL                            │
│ KALENDER                           │ ┌────────────────────────────────────┐ │
│ ┌────────────────────────────────┐ │ │ 📷 [Avatar]                        │ │
│ │      Februar 2025              │ │ │                                    │ │
│ │ Mo Di Mi Do Fr Sa So           │ │ │ Max Mustermann                     │ │
│ │                    1  2        │ │ │ max.mustermann@email.ch            │ │
│ │  3  4  5  6  7  8  9          │ │ │                                    │ │
│ │ 10 11 12 13 14 ●15 16          │ │ │ Musterstrasse 123                  │ │
│ │ 17 18 19 20 21 22 23          │ │ │ 8000 Zürich                        │ │
│ │ 24 25 26 27 28                │ │ │                                    │ │
│ └────────────────────────────────┘ │ │ Tel: 044 123 45 67                 │ │
│                                    │ │                                    │ │
│ 📅 ANSTEHENDE TERMINE              │ │ [✏️ Profil bearbeiten]             │ │
│ ┌────────────────────────────────┐ │ └────────────────────────────────────┘ │
│ │ Sa 15.02 19:30                 │ │                                        │
│ │ 🎭 Premiere "Der Revisor"      │ │ STUNDENKONTO                           │
│ │ Rolle: Bürgermeister           │ │ ┌────────────────────────────────────┐ │
│ ├────────────────────────────────┤ │ │ Aktueller Saldo                    │ │
│ │ Mi 19.02 19:00                 │ │ │ ┌──────────────────────────────┐   │ │
│ │ 🎬 Probe Szene 3+4             │ │ │ │      +12.5 Stunden           │   │ │
│ │ Ort: Proberaum                 │ │ │ └──────────────────────────────┘   │ │
│ └────────────────────────────────┘ │ │                                    │ │
│                                    │ │ Dieses Jahr: +8.0h                 │ │
│ [📅 Kalender exportieren (iCal)]   │ │ [→ Details anzeigen]               │ │
│                                    │ └────────────────────────────────────┘ │
├────────────────────────────────────┼────────────────────────────────────────┤
│ MEINE ROLLEN                       │ MEINE HELFEREINSÄTZE                   │
│ ┌────────────────────────────────┐ │ ┌────────────────────────────────────┐ │
│ │ 🎭 AKTUELLE PRODUKTION         │ │ │ 📊 Übersicht                       │ │
│ │ "Der Revisor" (2025)           │ │ │ Geleistet: 24.5h | Geplant: 4h    │ │
│ │ └─ Bürgermeister (Hauptrolle)  │ │ │                                    │ │
│ │                                │ │ │ ⏳ GEPLANT                         │ │
│ │ 📜 VERGANGENE PRODUKTIONEN     │ │ │ • So 16.02 - Abbau (2h)           │ │
│ │ • 2024: "Hamlet" - Polonius    │ │ │                                    │ │
│ │ • 2023: "Faust" - Wagner       │ │ │ ✅ ABGESCHLOSSEN                   │ │
│ │ • 2022: "Räuber" - Franz       │ │ │ • Sa 08.02 - Aufbau (4h)          │ │
│ │                                │ │ │ • Fr 07.02 - Ticketverkauf (3h)   │ │
│ │ [→ Alle Rollen anzeigen]       │ │ │                                    │ │
│ └────────────────────────────────┘ │ │ [→ Alle Einsätze anzeigen]         │ │
│                                    │ └────────────────────────────────────┘ │
└────────────────────────────────────┴────────────────────────────────────────┘
```

**Komponenten:**
- `MiniCalendar` - Monatsansicht mit markierten Terminen
- `TerminListe` - Anstehende Termine (Proben, Aufführungen, Einsätze)
- `ProfilCard` - Persönliche Daten mit Bearbeiten-Link
- `StundenkontoCard` - Saldo und Übersicht
- `RollenHistorie` - Aktuelle + vergangene Rollen
- `HelfereinsatzHistorie` - Geplante + abgeschlossene Einsätze

---

### 4. Helfer Dashboard

**Route:** `/helfer` (bestehend, erweitern)

**Layout:**
```
┌─────────────────────────────────────────────────────────────────────────────┐
│ HELFER BEREICH                                          Hallo, Hans Helfer │
├─────────────────────────────────────┬───────────────────────────────────────┤
│ MEINE SCHICHTEN                     │ OFFENE EINSÄTZE                       │
│                                     │                                       │
│ 📊 Übersicht                        │ ⭐ DRINGEND GESUCHT                   │
│ Bestätigt: 2 | Ausstehend: 1        │ ┌───────────────────────────────────┐ │
│                                     │ │ 🔴 Premiere 15.02                 │ │
│ ┌─────────────────────────────────┐ │ │    Ticketverkauf                  │ │
│ │ 📅 Sa, 15.02.2025               │ │ │    18:00-19:30                    │ │
│ │                                 │ │ │    2 Helfer gesucht!              │ │
│ │ 🎭 Premiere "Der Revisor"       │ │ │                                   │ │
│ │ Schicht: Einlass                │ │ │    [Jetzt anmelden]               │ │
│ │ Zeit: 18:00 - 19:30             │ │ └───────────────────────────────────┘ │
│ │ Ort: Aula Schulhaus Widen       │ │                                       │
│ │                                 │ │ 📋 WEITERE MÖGLICHKEITEN             │
│ │ Status: ✅ Bestätigt            │ │ ┌───────────────────────────────────┐ │
│ │ Kontakt: Maria Müller           │ │ │ 🟡 Abbau 16.02                    │ │
│ │          079 123 45 67          │ │ │    Helfer Abbau                   │ │
│ └─────────────────────────────────┘ │ │    21:00-23:00                    │ │
│                                     │ │    4 Plätze frei                  │ │
│ ┌─────────────────────────────────┐ │ │    [Details] [Anmelden]           │ │
│ │ 📅 So, 16.02.2025               │ │ └───────────────────────────────────┘ │
│ │                                 │ │                                       │
│ │ 🔧 Abbau nach Dernière          │ │ ┌───────────────────────────────────┐ │
│ │ Schicht: Abbau                  │ │ │ 🟢 Flyer verteilen 20.02          │ │
│ │ Zeit: 21:00 - 23:00             │ │ │    Werbung                        │ │
│ │ Ort: Aula Schulhaus Widen       │ │ │    14:00-17:00                    │ │
│ │                                 │ │ │    3 Plätze frei                  │ │
│ │ Status: ⏳ Ausstehend           │ │ │    [Details] [Anmelden]           │ │
│ └─────────────────────────────────┘ │ └───────────────────────────────────┘ │
│                                     │                                       │
│ STATISTIK                           │ ┌───────────────────────────────────┐ │
│ ┌─────────────────────────────────┐ │ │ 🟢 Catering 22.02                 │ │
│ │ Einsätze gesamt: 8              │ │ │    Dernière                       │ │
│ │ Stunden geleistet: 24.5h        │ │ │    17:00-22:00                    │ │
│ │ Dieses Jahr: 12h                │ │ │    2 Plätze frei                  │ │
│ └─────────────────────────────────┘ │ │    [Details] [Anmelden]           │ │
│                                     │ └───────────────────────────────────┘ │
│ [→ Alle meine Schichten]            │                                       │
│ [→ Mein Profil]                     │ [→ Alle offenen Einsätze]             │
└─────────────────────────────────────┴───────────────────────────────────────┘
```

**Komponenten:**
- `MeineSchichtenListe` - Zugewiesene Schichten mit Details
- `OffeneEinsaetzeListe` - Verfügbare Einsätze mit Priorisierung
- `EinsatzCard` - Einzelner Einsatz mit Anmelde-Button
- `HelferStatistik` - Geleistete Stunden

**Priorisierung offener Einsätze:**
- 🔴 Dringend: < 3 Tage, unbesetzte Pflichtpositionen
- 🟡 Bald: 3-7 Tage
- 🟢 Normal: > 7 Tage

---

## Issues

### Epic 0: Datenmodell

#### Issue #D1: Gruppen-Datenmodell implementieren
**Labels:** `database`, `backend`, `priority:high`

**Beschreibung:**
Erstelle das Datenmodell für Gruppen und Gruppen-Mitgliedschaften.

**Tasks:**
- [ ] Migration erstellen: `gruppen` Tabelle
- [ ] Migration erstellen: `gruppen_mitglieder` Tabelle
- [ ] Enum `gruppen_typ` erstellen
- [ ] RLS Policies definieren
- [ ] TypeScript Types in `types.ts` ergänzen
- [ ] Server Actions für CRUD erstellen

**Migration:**
```sql
-- Datei: supabase/migrations/YYYYMMDDHHMMSS_add_gruppen.sql

-- Enum für Gruppen-Typen
CREATE TYPE gruppen_typ AS ENUM ('team', 'gremium', 'produktion', 'sonstiges');

-- Gruppen Tabelle
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

-- Gruppen-Mitgliedschaften
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
CREATE INDEX idx_gruppen_stueck ON gruppen(stueck_id) WHERE stueck_id IS NOT NULL;
CREATE INDEX idx_gruppen_mitglieder_person ON gruppen_mitglieder(person_id);
CREATE INDEX idx_gruppen_mitglieder_gruppe ON gruppen_mitglieder(gruppe_id);

-- Updated at trigger
CREATE TRIGGER set_gruppen_updated_at
  BEFORE UPDATE ON gruppen
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- RLS
ALTER TABLE gruppen ENABLE ROW LEVEL SECURITY;
ALTER TABLE gruppen_mitglieder ENABLE ROW LEVEL SECURITY;

-- Policies für gruppen
CREATE POLICY "Gruppen sind für authentifizierte Benutzer lesbar"
  ON gruppen FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Management kann Gruppen verwalten"
  ON gruppen FOR ALL
  TO authenticated
  USING (is_management())
  WITH CHECK (is_management());

-- Policies für gruppen_mitglieder
CREATE POLICY "Gruppen-Mitgliedschaften sind für authentifizierte Benutzer lesbar"
  ON gruppen_mitglieder FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Management kann Gruppen-Mitgliedschaften verwalten"
  ON gruppen_mitglieder FOR ALL
  TO authenticated
  USING (is_management())
  WITH CHECK (is_management());

-- Initiale Gruppen
INSERT INTO gruppen (name, typ, beschreibung) VALUES
  ('Vorstand', 'gremium', 'Vereinsvorstand'),
  ('Technik-Team', 'team', 'Technik und Bühnenbau'),
  ('Maske & Kostüm', 'team', 'Maske und Kostümabteilung'),
  ('Regie-Team', 'team', 'Regie und Regieassistenz');
```

**Types:**
```typescript
// In lib/supabase/types.ts ergänzen

export type GruppenTyp = 'team' | 'gremium' | 'produktion' | 'sonstiges'

export type Gruppe = {
  id: string
  name: string
  typ: GruppenTyp
  beschreibung: string | null
  stueck_id: string | null
  aktiv: boolean
  created_at: string
  updated_at: string
}

export type GruppenMitglied = {
  id: string
  gruppe_id: string
  person_id: string
  rolle_in_gruppe: string | null
  von: string | null
  bis: string | null
  created_at: string
}

export type GruppeMitMitglieder = Gruppe & {
  mitglieder: (GruppenMitglied & {
    person: Pick<Person, 'id' | 'vorname' | 'nachname' | 'email'>
  })[]
}

export type PersonMitGruppen = Person & {
  gruppen: (GruppenMitglied & {
    gruppe: Pick<Gruppe, 'id' | 'name' | 'typ'>
  })[]
}
```

**Akzeptanzkriterien:**
- [ ] Migration läuft erfolgreich
- [ ] RLS Policies funktionieren
- [ ] Types sind definiert
- [ ] CRUD Actions funktionieren

---

### Epic 1: Admin Dashboard

#### Issue #D2: Admin Dashboard - System Status
**Labels:** `frontend`, `admin`, `priority:high`

**Beschreibung:**
Erstelle die System-Status-Komponente für das Admin Dashboard.

**Tasks:**
- [ ] `SystemStatusCard` Komponente erstellen
- [ ] Versionsnummer aus package.json lesen
- [ ] Build-Nummer / Commit Hash anzeigen (optional)
- [ ] Umgebung anzeigen (Development/Production)
- [ ] Health-Checks implementieren (DB, Auth)

**Komponente:**
```typescript
// components/admin/SystemStatusCard.tsx

interface SystemStatus {
  version: string
  buildNumber?: string
  environment: 'development' | 'production'
  health: {
    database: 'ok' | 'error'
    auth: 'ok' | 'error'
    storage: 'ok' | 'error'
  }
}
```

**Akzeptanzkriterien:**
- [ ] Version wird korrekt angezeigt
- [ ] Umgebung wird korrekt erkannt
- [ ] Health-Status wird angezeigt

---

#### Issue #D3: Admin Dashboard - Daten Import/Export
**Labels:** `frontend`, `backend`, `admin`, `priority:medium`

**Beschreibung:**
Implementiere CSV Import/Export Funktionalität.

**Tasks:**
- [ ] `DataImportCard` Komponente erstellen
- [ ] CSV Parser implementieren (papaparse)
- [ ] Import für Mitglieder (personen)
- [ ] Import für Partner
- [ ] Export aller Daten als CSV
- [ ] Validierung und Fehlerbehandlung
- [ ] Import-Vorschau mit Bestätigung

**Import-Format Mitglieder:**
```csv
vorname,nachname,email,telefon,strasse,plz,ort,geburtstag,rolle
Max,Mustermann,max@example.com,0791234567,Musterstr 1,8000,Zürich,1990-05-15,mitglied
```

**Akzeptanzkriterien:**
- [ ] CSV Import funktioniert
- [ ] Validierungsfehler werden angezeigt
- [ ] Export generiert valides CSV
- [ ] Vorschau vor Import

---

#### Issue #D4: Admin Dashboard - Dokumentation
**Labels:** `frontend`, `admin`, `priority:low`

**Beschreibung:**
Erstelle Dokumentations-Links und integriere Changelog.

**Tasks:**
- [ ] `DocumentationCard` Komponente
- [ ] Link zu Benutzerhandbuch (extern oder intern)
- [ ] Link zu API Dokumentation
- [ ] Changelog aus CHANGELOG.md laden und anzeigen

**Akzeptanzkriterien:**
- [ ] Dokumentations-Links funktionieren
- [ ] Changelog wird korrekt angezeigt

---

#### Issue #D5: Admin Dashboard - Gruppen-Verwaltung
**Labels:** `frontend`, `admin`, `priority:high`

**Beschreibung:**
CRUD UI für Gruppen im Admin-Bereich.

**Tasks:**
- [ ] `GruppenTable` Komponente
- [ ] Gruppe erstellen (Modal/Formular)
- [ ] Gruppe bearbeiten
- [ ] Gruppe löschen (mit Bestätigung)
- [ ] Mitglieder zu Gruppe hinzufügen/entfernen
- [ ] Filter nach Typ

**Akzeptanzkriterien:**
- [ ] Alle CRUD Operationen funktionieren
- [ ] Mitgliederverwaltung intuitiv
- [ ] Bestätigung bei Löschung

---

#### Issue #D6: Admin Dashboard - Vorstand-Switch
**Labels:** `frontend`, `admin`, `priority:medium`

**Beschreibung:**
Toggle im Header für Admin um zum Vorstand-Dashboard zu wechseln.

**Tasks:**
- [ ] Switch-Button im Header für ADMIN
- [ ] State Management für aktive Ansicht
- [ ] Routing: Admin-Dashboard vs Vorstand-Dashboard
- [ ] Visuelles Feedback welche Ansicht aktiv ist

**Akzeptanzkriterien:**
- [ ] Toggle wechselt zwischen Dashboards
- [ ] Aktive Ansicht ist klar erkennbar
- [ ] Nur für ADMIN sichtbar

---

### Epic 2: Vorstand Dashboard

#### Issue #D7: Vorstand Dashboard - 3-Säulen Layout
**Labels:** `frontend`, `vorstand`, `priority:high`

**Beschreibung:**
Implementiere das 3-Säulen-Layout für das Vorstand-Dashboard.

**Tasks:**
- [ ] Responsive 3-Spalten Grid
- [ ] `VorstandModul` Basis-Komponente
- [ ] Zeitraum-Filter (Diese Woche/Monat/Produktion)
- [ ] Mobile: Tabs oder Akkordeon

**Layout:**
```
Desktop: 3 Spalten nebeneinander
Tablet: 2 Spalten + 1 darunter
Mobile: 1 Spalte (Tabs oder Akkordeon)
```

**Akzeptanzkriterien:**
- [ ] 3 Spalten auf Desktop
- [ ] Responsive auf allen Geräten
- [ ] Filter funktioniert

---

#### Issue #D8: Vorstand Dashboard - Modul 1 (Mitglieder & Helfer)
**Labels:** `frontend`, `vorstand`, `priority:high`

**Beschreibung:**
Implementiere Modul 1: Mitglieder & Helfer Verwaltung.

**Tasks:**
- [ ] Übersicht: Anzahl Mitglieder (aktiv/gesamt)
- [ ] Übersicht: Anzahl Helfer
- [ ] Handlungsbedarf: Fehlende Helfer für Einsätze
- [ ] Aktivitäten: Neue/ausgetretene Mitglieder
- [ ] Quick-Links: Mitglieder, Helfereinsätze, Gruppen

**Daten-Abfragen:**
```typescript
// Mitglieder-Statistik
const { count: total } = await supabase.from('personen').select('*', { count: 'exact', head: true })
const { count: aktiv } = await supabase.from('personen').select('*', { count: 'exact', head: true }).eq('aktiv', true)

// Offene Helfer-Positionen
const offeneSchichten = await supabase
  .from('auffuehrung_schichten')
  .select(`
    id, rolle, anzahl_benoetigt,
    zuweisungen:auffuehrung_zuweisungen(count),
    veranstaltung:veranstaltungen!inner(datum, titel)
  `)
  .gte('veranstaltungen.datum', today)
```

**Akzeptanzkriterien:**
- [ ] Statistiken werden korrekt angezeigt
- [ ] Handlungsbedarf ist farblich markiert
- [ ] Links funktionieren

---

#### Issue #D9: Vorstand Dashboard - Modul 2 (Künstlerische Produktion)
**Labels:** `frontend`, `vorstand`, `priority:high`

**Beschreibung:**
Implementiere Modul 2: Künstlerische Produktion.

**Tasks:**
- [ ] Übersicht: Aktives Stück mit Status
- [ ] Übersicht: Premiere-Datum
- [ ] Handlungsbedarf: Unbesetzte Rollen
- [ ] Probenplan: Kommende Proben diese Woche
- [ ] Besetzungsstatus: X/Y Rollen besetzt
- [ ] Quick-Links: Probenplan, Besetzung, Stücke

**Akzeptanzkriterien:**
- [ ] Aktives Stück wird angezeigt
- [ ] Unbesetzte Rollen als Warnung
- [ ] Proben der Woche sichtbar

---

#### Issue #D10: Vorstand Dashboard - Modul 3 (Produktion & Logistik)
**Labels:** `frontend`, `vorstand`, `priority:high`

**Beschreibung:**
Implementiere Modul 3: Produktion & Logistik.

**Tasks:**
- [ ] Übersicht: Anzahl Aufführungen
- [ ] Übersicht: Nächste Aufführung
- [ ] Handlungsbedarf: Unbesetzte Schichten
- [ ] Ressourcen-Status: Reservierungen
- [ ] Raum-Status: Buchungen
- [ ] Quick-Links: Aufführungen, Ressourcen, Räume

**Akzeptanzkriterien:**
- [ ] Aufführungen werden angezeigt
- [ ] Unbesetzte Schichten als Warnung
- [ ] Ressourcen-Status sichtbar

---

#### Issue #D11: Vorstand Dashboard - Handlungsbedarf-Komponente
**Labels:** `frontend`, `vorstand`, `priority:high`

**Beschreibung:**
Wiederverwendbare Komponente für Warnungen/Handlungsbedarf.

**Tasks:**
- [ ] `HandlungsbedarfCard` Komponente
- [ ] Farbcodierung: Grün/Gelb/Rot
- [ ] Icon basierend auf Schweregrad
- [ ] Link zur Problemlösung
- [ ] Anzahl offener Punkte als Badge

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

**Akzeptanzkriterien:**
- [ ] Farbcodierung funktioniert
- [ ] Komponente ist wiederverwendbar
- [ ] Links funktionieren

---

### Epic 3: Mitglieder Dashboard

#### Issue #D12: Mitglieder Dashboard - Layout Restructure
**Labels:** `frontend`, `mitglieder`, `priority:high`

**Beschreibung:**
Komplette Neustrukturierung des Mein-Bereich Layouts im Outlook-Style.

**Tasks:**
- [ ] 2-Spalten Layout (Kalender links, Profil rechts)
- [ ] Untere Sektion: Rollen + Helfereinsätze
- [ ] Responsive Design (Mobile: 1 Spalte)

**Akzeptanzkriterien:**
- [ ] Layout entspricht Spezifikation
- [ ] Responsive auf allen Geräten

---

#### Issue #D13: Mitglieder Dashboard - Mini-Kalender
**Labels:** `frontend`, `mitglieder`, `priority:high`

**Beschreibung:**
Implementiere Mini-Kalender mit markierten Terminen.

**Tasks:**
- [ ] `MiniCalendar` Komponente
- [ ] Monatsansicht
- [ ] Termine markieren (Proben, Aufführungen, Einsätze)
- [ ] Klick auf Tag zeigt Details
- [ ] Navigation zwischen Monaten
- [ ] iCal Export Button

**Akzeptanzkriterien:**
- [ ] Kalender zeigt aktuellen Monat
- [ ] Termine sind markiert
- [ ] iCal Export funktioniert

---

#### Issue #D14: Mitglieder Dashboard - Profil-Bearbeitung
**Labels:** `frontend`, `mitglieder`, `priority:medium`

**Beschreibung:**
Profil-Card mit Bearbeitungsmöglichkeit.

**Tasks:**
- [ ] `ProfilCard` Komponente mit Daten aus `personen`
- [ ] Avatar (Initialen oder Bild)
- [ ] Inline-Edit oder Modal für Bearbeitung
- [ ] Felder: Name, Adresse, Telefon, E-Mail
- [ ] Validierung

**Akzeptanzkriterien:**
- [ ] Profildaten werden angezeigt
- [ ] Bearbeitung funktioniert
- [ ] Änderungen werden gespeichert

---

#### Issue #D15: Mitglieder Dashboard - Rollen-Historie
**Labels:** `frontend`, `mitglieder`, `priority:medium`

**Beschreibung:**
Anzeige aller gespielten Rollen (aktuell + Historie).

**Tasks:**
- [ ] `RollenHistorie` Komponente
- [ ] Aktuelle Produktion hervorheben
- [ ] Vergangene Rollen nach Jahr gruppiert
- [ ] Link zu Stück-Details

**Daten-Abfrage:**
```typescript
const rollen = await supabase
  .from('besetzungen')
  .select(`
    id, typ,
    rolle:rollen(id, name, typ),
    stueck:rollen(stueck:stuecke(id, titel, premiere_datum, status))
  `)
  .eq('person_id', personId)
  .order('stueck.premiere_datum', { ascending: false })
```

**Akzeptanzkriterien:**
- [ ] Alle Rollen werden angezeigt
- [ ] Aktuelle Produktion ist hervorgehoben
- [ ] Historie ist chronologisch

---

#### Issue #D16: Mitglieder Dashboard - Helfereinsatz-Historie
**Labels:** `frontend`, `mitglieder`, `priority:medium`

**Beschreibung:**
Anzeige aller Helfereinsätze (geplant + abgeschlossen).

**Tasks:**
- [ ] `HelfereinsatzHistorie` Komponente
- [ ] Geplante Einsätze oben
- [ ] Abgeschlossene Einsätze darunter
- [ ] Stunden pro Einsatz
- [ ] Gesamt-Stunden

**Akzeptanzkriterien:**
- [ ] Einsätze werden korrekt angezeigt
- [ ] Unterscheidung geplant/abgeschlossen
- [ ] Stunden sind sichtbar

---

### Epic 4: Helfer Dashboard

#### Issue #D17: Helfer Dashboard - Schichten-Liste
**Labels:** `frontend`, `helfer`, `priority:high`

**Beschreibung:**
Erweiterte Darstellung der zugewiesenen Schichten.

**Tasks:**
- [ ] `MeineSchichtenListe` Komponente
- [ ] Detailansicht pro Schicht (Anlass, Zeit, Ort, Kontakt)
- [ ] Status: Bestätigt/Ausstehend
- [ ] Sortierung nach Datum
- [ ] Kontaktinfo des Verantwortlichen

**Akzeptanzkriterien:**
- [ ] Alle zugewiesenen Schichten sichtbar
- [ ] Details sind vollständig
- [ ] Kontakt ist erreichbar

---

#### Issue #D18: Helfer Dashboard - Offene Einsätze mit Priorisierung
**Labels:** `frontend`, `helfer`, `priority:high`

**Beschreibung:**
Liste offener Einsätze mit Dringlichkeits-Promotion.

**Tasks:**
- [ ] `OffeneEinsaetzeListe` Komponente
- [ ] Priorisierung: Dringend (🔴), Bald (🟡), Normal (🟢)
- [ ] Anmelde-Button pro Einsatz
- [ ] Anzahl freier Plätze
- [ ] Filter nach Zeitraum

**Priorisierungs-Logik:**
```typescript
function getPrioritaet(datum: Date, freie_plaetze: number): 'dringend' | 'bald' | 'normal' {
  const tage_bis = differenceInDays(datum, new Date())
  if (tage_bis <= 3) return 'dringend'
  if (tage_bis <= 7) return 'bald'
  return 'normal'
}
```

**Akzeptanzkriterien:**
- [ ] Priorisierung funktioniert
- [ ] Anmeldung funktioniert
- [ ] Freie Plätze werden angezeigt

---

#### Issue #D19: Helfer Dashboard - Statistik
**Labels:** `frontend`, `helfer`, `priority:low`

**Beschreibung:**
Statistik-Card für Helfer.

**Tasks:**
- [ ] `HelferStatistik` Komponente
- [ ] Anzahl Einsätze gesamt
- [ ] Stunden geleistet gesamt
- [ ] Stunden dieses Jahr

**Akzeptanzkriterien:**
- [ ] Statistiken werden korrekt berechnet
- [ ] Anzeige ist übersichtlich

---

## Abhängigkeiten

```
Issue #D1 (Gruppen-Datenmodell)
    │
    └──► Issue #D5 (Gruppen-Verwaltung)

Issue #D7 (3-Säulen Layout)
    │
    ├──► Issue #D8 (Modul 1)
    ├──► Issue #D9 (Modul 2)
    └──► Issue #D10 (Modul 3)

Issue #D11 (Handlungsbedarf) ──► wird von #D8, #D9, #D10 verwendet

Issue #D12 (Layout) ──► #D13, #D14, #D15, #D16

Issue #D17, #D18 können parallel
```

---

## Priorisierung nach Sprint

### Sprint 1: Foundation
- [ ] #D1: Gruppen-Datenmodell
- [ ] #D2: System Status Card

### Sprint 2: Admin Dashboard
- [ ] #D3: Daten Import/Export
- [ ] #D4: Dokumentation
- [ ] #D5: Gruppen-Verwaltung
- [ ] #D6: Vorstand-Switch

### Sprint 3: Vorstand Dashboard
- [ ] #D7: 3-Säulen Layout
- [ ] #D11: Handlungsbedarf-Komponente
- [ ] #D8: Modul 1
- [ ] #D9: Modul 2
- [ ] #D10: Modul 3

### Sprint 4: Mitglieder Dashboard
- [ ] #D12: Layout Restructure
- [ ] #D13: Mini-Kalender
- [ ] #D14: Profil-Bearbeitung
- [ ] #D15: Rollen-Historie
- [ ] #D16: Helfereinsatz-Historie

### Sprint 5: Helfer Dashboard
- [ ] #D17: Schichten-Liste
- [ ] #D18: Offene Einsätze
- [ ] #D19: Statistik

---

## Schätzung

| Issue | Beschreibung | Story Points |
|-------|--------------|--------------|
| #D1 | Gruppen-Datenmodell | 5 |
| #D2 | System Status | 2 |
| #D3 | Import/Export | 8 |
| #D4 | Dokumentation | 2 |
| #D5 | Gruppen-Verwaltung | 5 |
| #D6 | Vorstand-Switch | 3 |
| #D7 | 3-Säulen Layout | 5 |
| #D8 | Modul 1 | 5 |
| #D9 | Modul 2 | 5 |
| #D10 | Modul 3 | 5 |
| #D11 | Handlungsbedarf | 3 |
| #D12 | Mitglieder Layout | 3 |
| #D13 | Mini-Kalender | 8 |
| #D14 | Profil-Bearbeitung | 3 |
| #D15 | Rollen-Historie | 3 |
| #D16 | Helfereinsatz-Historie | 3 |
| #D17 | Schichten-Liste | 3 |
| #D18 | Offene Einsätze | 5 |
| #D19 | Helfer-Statistik | 2 |
| **Total** | | **78 SP** |
