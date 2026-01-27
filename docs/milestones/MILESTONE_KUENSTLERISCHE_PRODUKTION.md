# GitHub Blueprint: Milestone "Künstlerische Produktion"

Dieses Dokument enthält alle Informationen zum Erstellen des Milestones und der Issues auf GitHub.

---

## Milestone erstellen

**URL:** `https://github.com/trismus/BackstagePass/milestones/new`

| Feld | Wert |
|------|------|
| **Title** | Künstlerische Produktion |
| **Due date** | _(optional)_ |
| **Description** | Terminplanung für Proben, Aufführungen und Meetings. Kalenderansichten, Einladungen, Teilnahme-Tracking und Erinnerungen. |

---

## Issues erstellen

Für jedes Issue: `https://github.com/trismus/BackstagePass/issues/new`

---

### Issue #1: Probenplan-Generator

```
Title: [Künstlerisch] Probenplan-Generator

Labels: enhancement, frontend, backend, priority:high
Milestone: Künstlerische Produktion
```

**Body:**
```markdown
## Beschreibung
Erstelle einen Generator für Probenpläne mit wiederkehrenden Terminen und intelligenter Szenen-Planung.

## Anforderungen
- [ ] Wiederkehrende Proben erstellen (z.B. jeden Dienstag 19-22 Uhr)
- [ ] Szenen/Akte einer Probe zuweisen
- [ ] Automatische Einladung der betroffenen Darsteller
- [ ] Konflikt-Erkennung mit Verfügbarkeiten
- [ ] Probenplan-Vorlage speichern und wiederverwenden

## Workflow
1. Zeitraum und Rhythmus festlegen
2. Proben werden generiert
3. Szenen den Proben zuweisen
4. Verfügbarkeits-Check
5. Einladungen versenden

## UI-Komponenten
- [ ] `components/proben/ProbenplanGenerator.tsx`
- [ ] `components/proben/ProbenSzenenZuweisung.tsx`
- [ ] `components/proben/VerfuegbarkeitsCheck.tsx`

## Akzeptanzkriterien
- [ ] Mehrere Proben auf einmal erstellbar
- [ ] Szenen können Proben zugewiesen werden
- [ ] Konflikte werden angezeigt
- [ ] Einladungen werden automatisch erstellt

## Abhängigkeiten
- Bestehendes Proben-System
- Milestone "Mitglieder" (Verfügbarkeiten)
- Milestone "Produktionen" (Besetzung)
```

---

### Issue #2: Kalender-Gesamtansicht

```
Title: [Künstlerisch] Kalender-Gesamtansicht

Labels: enhancement, frontend, priority:high
Milestone: Künstlerische Produktion
```

**Body:**
```markdown
## Beschreibung
Erstelle eine umfassende Kalenderansicht für alle Termine (Proben, Aufführungen, Meetings).

## Anforderungen
- [ ] Monats-, Wochen- und Tagesansicht
- [ ] Farbkodierung nach Termin-Typ
- [ ] Filter nach Produktion, Typ, eigene Termine
- [ ] Drag & Drop zum Verschieben von Terminen
- [ ] Klick für Details / Quick-Edit
- [ ] Sync-Export (iCal)

## Filter-Optionen
- Nach Produktion
- Nach Typ (Probe, Aufführung, Meeting, Sonstiges)
- Nur meine Termine
- Nach Rolle (wenn mehrere Rollen)

## UI-Komponenten
- [ ] `app/(protected)/kalender/page.tsx`
- [ ] `components/kalender/KalenderMonat.tsx`
- [ ] `components/kalender/KalenderWoche.tsx`
- [ ] `components/kalender/KalenderTag.tsx`
- [ ] `components/kalender/TerminPopover.tsx`
- [ ] `components/kalender/KalenderFilter.tsx`

## Akzeptanzkriterien
- [ ] Alle Ansichten funktionieren
- [ ] Filter kombinierbar
- [ ] Drag & Drop verschiebt Termine
- [ ] iCal-Export funktioniert

## Abhängigkeiten
- Bestehende Veranstaltungen/Proben
```

---

### Issue #3: Einladungs-System

```
Title: [Künstlerisch] Einladungs- und Teilnahme-System

Labels: enhancement, frontend, backend, priority:high
Milestone: Künstlerische Produktion
```

**Body:**
```markdown
## Beschreibung
Erweitere das Anmeldesystem um automatische Einladungen und detailliertes Teilnahme-Tracking.

## Anforderungen
- [ ] Automatische Einladung bei Termin-Erstellung
- [ ] Einladung basierend auf Besetzung/Rolle
- [ ] Teilnahme-Status: Offen, Zugesagt, Abgesagt, Vielleicht
- [ ] Absage mit Grund
- [ ] Vertretung anfragen
- [ ] Übersicht: Wer kommt, wer fehlt

## Datenmodell-Erweiterung
```typescript
interface Teilnahme {
  id: string
  termin_id: string
  person_id: string
  status: 'offen' | 'zugesagt' | 'abgesagt' | 'vielleicht'
  absage_grund: string | null
  vertretung_id: string | null
  eingeladen_am: timestamp
  geantwortet_am: timestamp | null
}
```

## Notifications
- [ ] E-Mail bei neuer Einladung
- [ ] Push-Notification (optional)
- [ ] Erinnerung vor Termin
- [ ] Zusammenfassung für Regie (wer kommt)

## Akzeptanzkriterien
- [ ] Einladungen werden automatisch erstellt
- [ ] Mitglieder können Zu-/Absagen
- [ ] Absage-Gründe werden erfasst
- [ ] Übersicht zeigt Teilnahmestatus

## Abhängigkeiten
- Bestehendes Anmeldungen-System
- Milestone "Produktionen" (Besetzung für Auto-Einladung)
```

---

### Issue #4: Anwesenheits-Tracking

```
Title: [Künstlerisch] Anwesenheits-Tracking

Labels: enhancement, frontend, backend, priority:medium
Milestone: Künstlerische Produktion
```

**Body:**
```markdown
## Beschreibung
Implementiere ein System zur Erfassung der tatsächlichen Anwesenheit bei Terminen.

## Anforderungen
- [ ] Check-in bei Termin (manuell oder QR-Code)
- [ ] Anwesenheitsliste für Regie
- [ ] Nachträgliche Erfassung möglich
- [ ] Verspätung erfassen
- [ ] Statistik: Anwesenheitsquote pro Mitglied

## Datenmodell
```typescript
interface Anwesenheit {
  id: string
  teilnahme_id: string
  status: 'anwesend' | 'abwesend' | 'verspaetet'
  check_in_zeit: timestamp | null
  erfasst_von: string        // wer hat eingetragen
  notiz: string | null
}
```

## UI-Komponenten
- [ ] `components/proben/AnwesenheitsListe.tsx`
- [ ] `components/proben/CheckInButton.tsx`
- [ ] `components/proben/AnwesenheitsStatistik.tsx`

## Akzeptanzkriterien
- [ ] Anwesenheit kann erfasst werden
- [ ] Statistik pro Mitglied einsehbar
- [ ] Nachträgliche Korrektur möglich
- [ ] Export für Dokumentation

## Abhängigkeiten
- Issue #3 (Einladungs-System)
```

---

### Issue #5: Erinnerungen und Benachrichtigungen

```
Title: [Künstlerisch] Erinnerungs-System

Labels: enhancement, backend, priority:medium
Milestone: Künstlerische Produktion
```

**Body:**
```markdown
## Beschreibung
Implementiere ein System für automatische Erinnerungen und Benachrichtigungen.

## Anforderungen
- [ ] Erinnerung X Tage/Stunden vor Termin
- [ ] Konfigurierbare Erinnerungszeiten pro Benutzer
- [ ] Verschiedene Kanäle: E-Mail, Push, In-App
- [ ] Zusammenfassungs-Mail (Woche voraus)
- [ ] Änderungs-Benachrichtigungen (Termin verschoben)

## Datenmodell
```typescript
interface Erinnerung {
  id: string
  termin_id: string
  person_id: string
  typ: 'vor_termin' | 'aenderung' | 'zusammenfassung'
  geplant_fuer: timestamp
  gesendet_am: timestamp | null
  kanal: 'email' | 'push' | 'in_app'
}

interface BenutzerErinnerungsSettings {
  person_id: string
  standard_vorlauf: number      // Stunden
  email_aktiviert: boolean
  push_aktiviert: boolean
  wochenzusammenfassung: boolean
}
```

## Technische Details
- Supabase Edge Function für Cron-Job
- E-Mail via Resend oder ähnlich
- Push via Web Push API (optional)

## Akzeptanzkriterien
- [ ] Erinnerungen werden gesendet
- [ ] Benutzer kann Einstellungen anpassen
- [ ] Keine doppelten Erinnerungen
- [ ] Änderungen werden kommuniziert

## Abhängigkeiten
- Issue #3 (Einladungs-System)
```

---

### Issue #6: Proben-Protokoll

```
Title: [Künstlerisch] Proben-Protokoll

Labels: enhancement, frontend, priority:medium
Milestone: Künstlerische Produktion
```

**Body:**
```markdown
## Beschreibung
Ermögliche das Führen von Proben-Protokollen zur Dokumentation.

## Anforderungen
- [ ] Protokoll-Editor pro Probe
- [ ] Vorlagen für Standard-Punkte
- [ ] Notizen zu Szenen
- [ ] Aufgaben aus Protokoll erstellen
- [ ] Protokoll teilen / exportieren

## Protokoll-Struktur
```markdown
# Probenprotokoll - [Datum]

## Anwesend
- Person A, Person B, ...

## Geprobt
- Szene 1.3: Gut, Blocking fertig
- Szene 2.1: Noch unsicher, wiederholen

## Aufgaben
- [ ] Person X: Text lernen bis nächste Probe
- [ ] Technik: Spot für Szene 2.1 einrichten

## Notizen
- Nächste Probe: Fokus auf Akt 2
```

## UI-Komponenten
- [ ] `components/proben/ProbenProtokoll.tsx`
- [ ] `components/proben/ProtokollEditor.tsx`
- [ ] `components/proben/AufgabenAusProtokoll.tsx`

## Akzeptanzkriterien
- [ ] Protokoll kann erstellt werden
- [ ] Vorlagen beschleunigen Eingabe
- [ ] Aufgaben können extrahiert werden
- [ ] Export als PDF/Markdown

## Abhängigkeiten
- Bestehendes Proben-System
- Issue #4 (Anwesenheits-Tracking)
```

---

### Issue #7: Meeting-Verwaltung

```
Title: [Künstlerisch] Meeting-Verwaltung

Labels: enhancement, frontend, priority:low
Milestone: Künstlerische Produktion
```

**Body:**
```markdown
## Beschreibung
Erweitere das Terminsystem um spezifische Meeting-Funktionen (Vorstandssitzungen, Regiebesprechungen, etc.).

## Anforderungen
- [ ] Meeting-Typ (Vorstand, Regie, Team, etc.)
- [ ] Agenda erstellen
- [ ] Beschlüsse erfassen
- [ ] Protokoll-Vorlage für Meetings
- [ ] Wiederkehrende Meetings

## Meeting-Typen
- Vorstandssitzung
- Regiebesprechung
- Ensemble-Meeting
- Technik-Meeting
- Allgemeine Versammlung

## UI-Komponenten
- [ ] `components/meetings/MeetingForm.tsx`
- [ ] `components/meetings/AgendaEditor.tsx`
- [ ] `components/meetings/BeschlussListe.tsx`

## Akzeptanzkriterien
- [ ] Meetings können erstellt werden
- [ ] Agenda ist vorab sichtbar
- [ ] Beschlüsse werden dokumentiert
- [ ] Protokoll kann exportiert werden

## Abhängigkeiten
- Issue #3 (Einladungs-System)
- Issue #6 (Proben-Protokoll als Basis)
```

---

### Issue #8: Persönlicher Terminkalender

```
Title: [Künstlerisch] Persönlicher Terminkalender

Labels: enhancement, frontend, priority:low
Milestone: Künstlerische Produktion
```

**Body:**
```markdown
## Beschreibung
Erstelle eine persönliche Kalenderansicht für Mitglieder mit nur den eigenen Terminen.

## Anforderungen
- [ ] Nur eigene Termine anzeigen
- [ ] Integration in Mein-Bereich
- [ ] Kompakte Widget-Ansicht
- [ ] iCal-Feed für externen Kalender
- [ ] Zu-/Absage direkt aus Kalender

## UI-Komponenten
- [ ] `components/mein-bereich/MeinKalender.tsx`
- [ ] `components/mein-bereich/TerminWidget.tsx`
- [ ] `components/mein-bereich/iCalExport.tsx`

## Akzeptanzkriterien
- [ ] Nur relevante Termine sichtbar
- [ ] Quick-Actions für Zu-/Absage
- [ ] iCal-Feed ist abonnierbar
- [ ] Widget auf Mein-Bereich Dashboard

## Abhängigkeiten
- Issue #2 (Kalender-Gesamtansicht)
- Issue #3 (Einladungs-System)
```

---

## Checkliste für GitHub

### Milestone
- [ ] Milestone "Künstlerische Produktion" erstellen

### Issues (in dieser Reihenfolge erstellen)
1. [ ] Issue #2: Kalender-Gesamtansicht (keine direkten Abhängigkeiten)
2. [ ] Issue #3: Einladungs-System (Basis für andere)
3. [ ] Issue #1: Probenplan-Generator (nach Mitglieder & Produktionen)
4. [ ] Issue #4: Anwesenheits-Tracking (nach #3)
5. [ ] Issue #5: Erinnerungs-System (nach #3)
6. [ ] Issue #6: Proben-Protokoll (nach #4)
7. [ ] Issue #7: Meeting-Verwaltung (nach #3, #6)
8. [ ] Issue #8: Persönlicher Kalender (nach #2, #3)

### Labels prüfen
- [ ] `priority:high`
- [ ] `priority:medium`
- [ ] `priority:low`
- [ ] `frontend`
- [ ] `backend`
- [ ] `enhancement`

---

## Zusammenfassung

| Metrik | Wert |
|--------|------|
| **Milestone** | Künstlerische Produktion |
| **Anzahl Issues** | 8 |
| **Priorität High** | 3 |
| **Priorität Medium** | 3 |
| **Priorität Low** | 2 |

---

## Abhängigkeiten zwischen Milestones

```
┌─────────────────┐
│   Mitglieder    │
│ (Verfügbarkeit) │
└────────┬────────┘
         │
         ▼
┌─────────────────┐     ┌─────────────────────────┐
│  Produktionen   │────▶│ Künstlerische Produktion│
│  (Besetzung)    │     │    (Terminplanung)      │
└─────────────────┘     └─────────────────────────┘
```

Die drei Milestones bauen aufeinander auf:
1. **Mitglieder** liefert die Personenbasis und Verfügbarkeiten
2. **Produktionen** strukturiert die Projekte und Besetzungen
3. **Künstlerische Produktion** koordiniert die Termine basierend auf 1 & 2
