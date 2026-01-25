# 🎭 BackstagePass – Detailkonzept der drei Kernmodule

Dieses Dokument beschreibt die drei zentralen Module von **BackstagePass** und konkretisiert deren Ziele, Kernfunktionen, Datenobjekte sowie typische Nutzerabläufe.

---

## 1) 👥 Modul „Mitglieder“

**Ziel:** Alle Vereinsmitglieder, Rollen und Kontaktinformationen an einem Ort verwalten.

### Kernfunktionen
- Mitgliederprofil anlegen, bearbeiten, archivieren
- Rollen & Zuständigkeiten (Ensemble, Technik, Regie, Orga)
- Kontaktverwaltung inkl. Notfallkontakt
- Verfügbarkeiten und Teilnahme-Status

### Wichtige Datenobjekte
- **Mitglied** (Name, Rolle, Status, Kontakt)
- **Rollen** (Schauspiel, Technik, Regie, Produktion)
- **Verfügbarkeit** (Datum, Zeitfenster, Status)

### Typische Workflows
1. Neues Mitglied wird angelegt (Stammdaten + Rolle).
2. Verfügbarkeit wird pro Zeitraum gepflegt.
3. Mitglied wird Produktionen/Terminen zugeordnet.

---

## 2) 🎬 Modul „Produktionen“

**Ziel:** Theaterproduktionen strukturiert planen, besetzen und betreuen.

### Kernfunktionen
- Produktion anlegen mit Status (Planung, Casting, Proben, Premiere)
- Besetzung & Teamzuweisung
- Produktionsdokumente (Stück, Skript, Casting-Notizen)
- Übersicht über laufende und kommende Produktionen

### Wichtige Datenobjekte
- **Produktion** (Titel, Zeitraum, Status)
- **Rollenbesetzung** (Mitglied ↔ Rolle in Produktion)
- **Dokumente** (Skript, Spielplan, Requisitenliste)

### Typische Workflows
1. Produktion wird geplant und im System angelegt.
2. Rollenbesetzung wird Schritt für Schritt ergänzt.
3. Produktion erhält einen Probenplan (Künstlerische Produktion) und wird aktiv verfolgt.

---

## 3) 🎭 Modul „Künstlerische Produktion“

**Ziel:** Alle Proben, Aufführungen und Meetings zentral planen und kommunizieren.

### Kernfunktionen
- Termine erstellen (Probe, Aufführung, Meeting)
- Kalenderansicht mit Filter (Produktion, Rolle, Zeitraum)
- Einladungen & Teilnahme-Status (Zusagen/Absagen)
- Erinnerungen und Check-in vor Ort

### Wichtige Datenobjekte
- **Termin** (Typ, Datum, Ort, Produktion)
- **Teilnahme** (Mitglied ↔ Termin, Status)
- **Erinnerung** (Zeitpunkt, Versandstatus)

### Typische Workflows
1. Regie erstellt Probenplan mit wiederkehrenden Terminen.
2. Mitglieder erhalten Einladungen und bestätigen Teilnahme.
3. Anwesenheit wird nach Termin dokumentiert.

---

## 🎯 Zusammenspiel der Module

Die drei Module sind eng verzahnt und bilden gemeinsam den Kern von BackstagePass:

- **Mitglieder** liefern die Personenbasis.
- **Produktionen** strukturieren die künstlerischen Projekte.
- **Künstlerische Produktion** steuert die konkrete Zusammenarbeit im Kalender.

Damit entsteht ein klarer, praxisnaher Ablauf: **Mitglied → Produktion → Termin**.

---

## 🗂️ Milestones-Transkript (für Springer)

**Ziel:** Die Modul-Ideen als Milestone-Grundlage festhalten und an den Bühnenmeister zur Ausformulierung übergeben.

### Milestone 1: Mitglieder
- Fokus: Mitgliederprofil, Rollen/Zuständigkeiten, Kontaktverwaltung, Verfügbarkeiten.
- Kernobjekte: Mitglied, Rollen, Verfügbarkeit.
- Workflow: Mitglied anlegen → Verfügbarkeit pflegen → Zuordnung zu Produktion/Terminen.

### Milestone 2: Produktionen
- Fokus: Produktion anlegen, Besetzung & Teamzuweisung, Dokumente, Status-Tracking.
- Kernobjekte: Produktion, Rollenbesetzung, Dokumente.
- Workflow: Produktion planen → Rollenbesetzung ergänzen → Probenplan anlegen.

### Milestone 3: Künstlerische Produktion
- Fokus: Terminplanung (Probe/Aufführung/Meeting), Kalenderansicht, Einladungen, Erinnerungen.
- Kernobjekte: Termin, Teilnahme, Erinnerung.
- Workflow: Regie erstellt Probenplan → Einladungen/Teilnahmen → Anwesenheit dokumentieren.

**Übergabe an Bühnenmeister:** Bitte die obigen Milestones technisch ausformulieren (Datenmodelle, Schnittstellen, RLS, Komponentenstruktur).
