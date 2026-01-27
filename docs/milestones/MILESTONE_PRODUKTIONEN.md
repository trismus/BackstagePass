# GitHub Blueprint: Milestone "Produktionen"

Dieses Dokument enthält alle Informationen zum Erstellen des Milestones und der Issues auf GitHub.

---

## Milestone erstellen

**URL:** `https://github.com/trismus/BackstagePass/milestones/new`

| Feld | Wert |
|------|------|
| **Title** | Produktionen |
| **Due date** | _(optional)_ |
| **Description** | Theaterproduktionen strukturiert planen, besetzen und betreuen. Verwaltung von Stücken, Besetzungen, Dokumenten und Produktionsstatus. |

---

## Issues erstellen

Für jedes Issue: `https://github.com/trismus/BackstagePass/issues/new`

---

### Issue #1: Produktions-Entität erstellen

```
Title: [Produktionen] Produktions-Entität erstellen

Labels: enhancement, backend, database, priority:high
Milestone: Produktionen
```

**Body:**
```markdown
## Beschreibung
Erstelle eine neue Entität "Produktion" als übergeordnetes Objekt für Theaterprojekte. Eine Produktion verbindet ein Stück mit einem konkreten Aufführungszeitraum.

## Anforderungen
- [ ] Produktion anlegen mit Titel, Beschreibung, Zeitraum
- [ ] Status-Workflow (Planung → Casting → Proben → Premiere → Abgeschlossen)
- [ ] Verknüpfung mit Stück (optional, für Eigenproduktionen)
- [ ] Spielzeit/Saison zuordnen
- [ ] Produktionsleitung zuweisen

## Datenmodell
```typescript
interface Produktion {
  id: string
  titel: string
  beschreibung: string | null
  stueck_id: string | null     // Verknüpfung zu Stücke
  status: ProduktionStatus
  saison: string               // z.B. "2026/2027"
  proben_start: date | null
  premiere: date | null
  derniere: date | null
  produktionsleitung_id: string | null
  created_at: timestamp
  updated_at: timestamp
}

type ProduktionStatus =
  | 'planung'
  | 'casting'
  | 'proben'
  | 'premiere'
  | 'laufend'
  | 'abgeschlossen'
  | 'abgesagt'
```

## Technische Details
- Neue Tabelle `produktionen`
- RLS: Lesen für alle, Schreiben für Management
- Verknüpfung zu bestehender `stuecke` Tabelle

## Akzeptanzkriterien
- [ ] Produktion kann erstellt und bearbeitet werden
- [ ] Status kann durch Workflow geändert werden
- [ ] Produktionsübersicht zeigt alle Produktionen
- [ ] Filter nach Status und Saison

## Abhängigkeiten
- Bestehende `stuecke` Tabelle
```

---

### Issue #2: Produktions-Dashboard

```
Title: [Produktionen] Produktions-Dashboard

Labels: enhancement, frontend, priority:high
Milestone: Produktionen
```

**Body:**
```markdown
## Beschreibung
Erstelle ein Dashboard zur Übersicht aller Produktionen mit Status-Tracking.

## Anforderungen
- [ ] Kanban-Board nach Status (Planung, Casting, Proben, etc.)
- [ ] Listenansicht mit Sortierung
- [ ] Schnellzugriff auf aktuelle Produktion
- [ ] Fortschrittsanzeige (Proben, Besetzung)
- [ ] Timeline-Ansicht über Saison

## UI-Komponenten
- [ ] `app/(protected)/produktionen/page.tsx`
- [ ] `components/produktionen/ProduktionKanban.tsx`
- [ ] `components/produktionen/ProduktionListe.tsx`
- [ ] `components/produktionen/ProduktionTimeline.tsx`
- [ ] `components/produktionen/ProduktionCard.tsx`

## Akzeptanzkriterien
- [ ] Alle Produktionen auf einen Blick
- [ ] Drag & Drop im Kanban ändert Status
- [ ] Klick öffnet Produktions-Detail
- [ ] Filterung nach Saison

## Abhängigkeiten
- Issue #1 (Produktions-Entität)
```

---

### Issue #3: Besetzungs-Management

```
Title: [Produktionen] Besetzungs-Management

Labels: enhancement, frontend, backend, priority:high
Milestone: Produktionen
```

**Body:**
```markdown
## Beschreibung
Erweitere das bestehende Besetzungssystem um produktionsspezifische Funktionen.

## Anforderungen
- [ ] Besetzung pro Produktion (nicht nur pro Stück)
- [ ] Besetzungsstatus (Offen, Vorgemerkt, Besetzt, Abgesagt)
- [ ] Zweitbesetzung / Understudy
- [ ] Besetzungsvorschläge basierend auf Skills
- [ ] Besetzungshistorie (wer spielte welche Rolle wann)

## Datenmodell-Erweiterung
```typescript
interface ProduktionsBesetzung {
  id: string
  produktion_id: string
  rolle_id: string           // aus stuecke/rollen
  person_id: string | null
  typ: 'hauptbesetzung' | 'zweitbesetzung'
  status: 'offen' | 'vorgemerkt' | 'besetzt' | 'abgesagt'
  notizen: string | null
}
```

## UI-Komponenten
- [ ] `components/produktionen/BesetzungsMatrix.tsx`
- [ ] `components/produktionen/BesetzungsEditor.tsx`
- [ ] `components/produktionen/BesetzungsVorschlag.tsx`

## Akzeptanzkriterien
- [ ] Rollen können Personen zugewiesen werden
- [ ] Doppelbesetzungen sichtbar
- [ ] Offene Rollen hervorgehoben
- [ ] Drag & Drop Zuweisung möglich

## Abhängigkeiten
- Issue #1 (Produktions-Entität)
- Bestehendes Rollen-System aus `stuecke`
```

---

### Issue #4: Team-Zuweisung

```
Title: [Produktionen] Team-Zuweisung (Stab)

Labels: enhancement, frontend, backend, priority:medium
Milestone: Produktionen
```

**Body:**
```markdown
## Beschreibung
Ermögliche die Zuweisung von Produktionsteam-Mitgliedern (Stab) zu einer Produktion.

## Anforderungen
- [ ] Stabfunktionen definieren (Regie, Technik, Maske, Kostüm, etc.)
- [ ] Personen zu Stabfunktionen zuweisen
- [ ] Mehrere Personen pro Funktion möglich
- [ ] Externe Mitarbeiter erfassen (ohne Mitgliederprofil)

## Datenmodell
```typescript
interface StabFunktion {
  id: string
  name: string            // z.B. "Regie", "Bühnenbild"
  kategorie: 'kuenstlerisch' | 'technisch' | 'organisation'
}

interface ProduktionsStab {
  id: string
  produktion_id: string
  funktion_id: string
  person_id: string | null    // Vereinsmitglied
  externer_name: string | null // oder externe Person
  externer_kontakt: string | null
}
```

## Akzeptanzkriterien
- [ ] Stabfunktionen können zugewiesen werden
- [ ] Teamübersicht auf Produktions-Seite
- [ ] Interne und externe Teammitglieder möglich
- [ ] Kontaktliste generierbar

## Abhängigkeiten
- Issue #1 (Produktions-Entität)
```

---

### Issue #5: Produktions-Dokumente

```
Title: [Produktionen] Dokumentenverwaltung

Labels: enhancement, frontend, backend, priority:medium
Milestone: Produktionen
```

**Body:**
```markdown
## Beschreibung
Implementiere eine Dokumentenverwaltung für produktionsbezogene Dateien.

## Anforderungen
- [ ] Dokument-Upload (PDF, Word, Bilder)
- [ ] Kategorien (Skript, Spielplan, Technik, Werbung, etc.)
- [ ] Versionierung (neues Skript hochladen)
- [ ] Freigabe-Status (Entwurf, Freigegeben)
- [ ] Download für berechtigte Personen

## Datenmodell
```typescript
interface ProduktionsDokument {
  id: string
  produktion_id: string
  name: string
  kategorie: DokumentKategorie
  datei_url: string          // Supabase Storage
  version: number
  status: 'entwurf' | 'freigegeben'
  hochgeladen_von: string
  created_at: timestamp
}

type DokumentKategorie =
  | 'skript'
  | 'spielplan'
  | 'technik'
  | 'requisiten'
  | 'kostueme'
  | 'werbung'
  | 'sonstiges'
```

## Technische Details
- Supabase Storage Bucket `produktions-dokumente`
- RLS für Bucket-Zugriff
- Virus-Scan bei Upload (optional)

## Akzeptanzkriterien
- [ ] Dokumente können hochgeladen werden
- [ ] Kategorisierung funktioniert
- [ ] Alte Versionen bleiben erhalten
- [ ] Download nur für Berechtigte

## Abhängigkeiten
- Issue #1 (Produktions-Entität)
```

---

### Issue #6: Produktions-Status-Workflow

```
Title: [Produktionen] Status-Workflow mit Checklisten

Labels: enhancement, frontend, priority:medium
Milestone: Produktionen
```

**Body:**
```markdown
## Beschreibung
Implementiere einen geführten Workflow für Produktionsphasen mit Checklisten.

## Anforderungen
- [ ] Checkliste pro Phase (Planung, Casting, Proben, etc.)
- [ ] Pflicht- und optionale Punkte
- [ ] Automatischer Status-Wechsel wenn Pflichtpunkte erledigt
- [ ] Fortschrittsanzeige pro Phase
- [ ] Benachrichtigung bei Phase-Wechsel

## Beispiel-Checklisten
```
PLANUNG:
- [x] Stück ausgewählt
- [x] Budget genehmigt
- [ ] Aufführungsdaten festgelegt
- [ ] Probenraum reserviert

CASTING:
- [ ] Casting-Termin geplant
- [ ] Alle Rollen ausgeschrieben
- [ ] Casting durchgeführt
- [ ] Besetzung bekanntgegeben
```

## UI-Komponenten
- [ ] `components/produktionen/StatusWorkflow.tsx`
- [ ] `components/produktionen/PhaseChecklist.tsx`
- [ ] `components/produktionen/StatusProgress.tsx`

## Akzeptanzkriterien
- [ ] Checklisten werden pro Phase angezeigt
- [ ] Punkte können abgehakt werden
- [ ] Fortschritt ist visuell erkennbar
- [ ] Status-Wechsel wird protokolliert

## Abhängigkeiten
- Issue #1 (Produktions-Entität)
- Issue #2 (Produktions-Dashboard)
```

---

### Issue #7: Produktions-Übersicht-Widgets

```
Title: [Produktionen] Dashboard-Widgets für aktuelle Produktion

Labels: enhancement, frontend, priority:low
Milestone: Produktionen
```

**Body:**
```markdown
## Beschreibung
Erstelle Widgets für das Haupt-Dashboard zur Anzeige der aktuellen Produktion.

## Anforderungen
- [ ] "Aktuelle Produktion" Widget mit Countdown zur Premiere
- [ ] Proben-Fortschritt (X von Y Proben absolviert)
- [ ] Besetzungs-Status (X von Y Rollen besetzt)
- [ ] Nächste Termine für die Produktion
- [ ] Quick-Links zur Produktions-Seite

## UI-Komponenten
- [ ] `components/dashboard/AktuelleProduktionWidget.tsx`
- [ ] `components/dashboard/ProduktionCountdown.tsx`
- [ ] `components/dashboard/ProduktionProgress.tsx`

## Akzeptanzkriterien
- [ ] Widget zeigt aktuelle/nächste Produktion
- [ ] Countdown zählt korrekt herunter
- [ ] Fortschrittsbalken sind aussagekräftig
- [ ] Widget ist auf Dashboard integriert

## Abhängigkeiten
- Issue #1 (Produktions-Entität)
- Issue #3 (Besetzungs-Management)
```

---

## Checkliste für GitHub

### Milestone
- [ ] Milestone "Produktionen" erstellen

### Issues (in dieser Reihenfolge erstellen)
1. [ ] Issue #1: Produktions-Entität (keine Abhängigkeiten)
2. [ ] Issue #2: Produktions-Dashboard (nach #1)
3. [ ] Issue #3: Besetzungs-Management (nach #1)
4. [ ] Issue #4: Team-Zuweisung (nach #1)
5. [ ] Issue #5: Dokumentenverwaltung (nach #1)
6. [ ] Issue #6: Status-Workflow (nach #1, #2)
7. [ ] Issue #7: Dashboard-Widgets (nach #1, #3)

### Labels prüfen
- [ ] `priority:high`
- [ ] `priority:medium`
- [ ] `priority:low`
- [ ] `frontend`
- [ ] `backend`
- [ ] `database`
- [ ] `enhancement`

---

## Zusammenfassung

| Metrik | Wert |
|--------|------|
| **Milestone** | Produktionen |
| **Anzahl Issues** | 7 |
| **Priorität High** | 3 |
| **Priorität Medium** | 3 |
| **Priorität Low** | 1 |
