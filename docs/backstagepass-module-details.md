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

## 🧭 Advanced User Stories & Abläufe (je Modul ≥ 5)

### Modul „Mitglieder & Helfer“

1. **User Story: Import & Dublettenprüfung über mehrere Quellen**  
   **Als** Vorstandsmitglied **möchte ich** Mitglieder aus CSV/Excel importieren und Dubletten (Name, E‑Mail, Geburtsdatum) automatisch erkennen, **damit** die Datenqualität stimmt.  
   **Ablauf:** Import starten → System zeigt mögliche Dubletten mit Matching‑Score → Admin entscheidet Merge/Neu → Protokoll im Audit‑Log.

2. **User Story: Rollenbasierte Kommunikation mit Helfern**  
   **Als** Helferkoordination **möchte ich** alle Helfer einer bestimmten Rolle (z. B. Kasse) selektieren und per E‑Mail/SMS informieren, **damit** Änderungen schnell ankommen.  
   **Ablauf:** Rolle + Zeitraum filtern → Empfängerliste prüfen → Nachrichtenvorlage wählen → Versand & Zustellstatus einsehen.

3. **User Story: Helferbedarfsprognose mit Soll‑Stunden**  
   **Als** Vorstand **möchte ich** sehen, welche Mitglieder ihr Helferstunden‑Soll noch nicht erfüllen, **damit** ich gezielt nachfragen kann.  
   **Ablauf:** Soll‑Stunden pro Mitgliedstyp definieren → Stundenkonto aggregieren → Ampel‑Status & Erinnerungsvorschläge.

4. **User Story: Temporäre Verfügbarkeit mit Konfliktwarnung**  
   **Als** aktives Mitglied **möchte ich** Abwesenheiten für Proben/Events eintragen, **damit** ich bei Terminplanung berücksichtigt werde.  
   **Ablauf:** Abwesenheit eintragen → System prüft Konflikte mit bereits bestätigten Terminen → Benutzer bestätigt Ausnahme oder lehnt ab.

5. **User Story: Externe Helfer onboarding & Datenschutzhinweis**  
   **Als** Helferkoordination **möchte ich** externe Helfer mit minimalen Daten und DSGVO‑Hinweis erfassen, **damit** Einsätze legal geplant werden.  
   **Ablauf:** Schnellformular → Einwilligungstext bestätigen → Helfer wird als „Extern“ markiert → Zugriff nur auf Helfereinsätze.

### Modul „Künstlerische Produktion“

1. **User Story: Rollen‑ und Szenenbasierte Probenplanung**  
   **Als** Regie **möchte ich** Proben nach Szenen/Rollen planen, **damit** nur benötigte Mitglieder eingeladen werden.  
   **Ablauf:** Szene auswählen → Rollenliste wird automatisch geladen → Teilnehmer bestätigen → Probenplan aktualisiert.

2. **User Story: Konfliktprüfung mit anderen Produktionen**  
   **Als** Produktionsleitung **möchte ich** Termin‑Konflikte zwischen Produktionen erkennen, **damit** Schlüsselpersonen nicht doppelt gebucht werden.  
   **Ablauf:** Termin anlegen → System zeigt Konflikte (Person/Ort) → Alternativvorschläge → Freigabe.

3. **User Story: Anwesenheit & Probennotizen zentral dokumentieren**  
   **Als** Regieassistenz **möchte ich** Anwesenheit und Regie‑Notizen pro Probe erfassen, **damit** das Team transparent informiert ist.  
   **Ablauf:** Probe öffnen → Anwesenheit per Checkbox → Notizen + Aufgaben zuweisen → Zusammenfassung an Teilnehmende.

4. **User Story: Ersatz‑Besetzung & Cover‑Planung**  
   **Als** Regie **möchte ich** Cover‑Darsteller definieren, **damit** bei Ausfällen sofort Ersatz verfügbar ist.  
   **Ablauf:** Rolle öffnen → Cover‑Mitglieder hinzufügen → automatische Einladung bei Ausfall → Status‑Tracking.

5. **User Story: Aufführungs‑Check‑in & Ablauf‑Timer**  
   **Als** Inspizienz **möchte ich** am Aufführungstag Check‑ins und Ablauf‑Timer nutzen, **damit** der Produktionsablauf stabil bleibt.  
   **Ablauf:** Check‑in‑Liste starten → Anwesenheit live markieren → Timer für Szenenwechsel → Abschlussbericht speichern.

### Modul „Produktion & Logistik“

1. **User Story: Ressourcen‑ und Raumreservierungen mit Freigabe**  
   **Als** Produktionsleitung **möchte ich** Räume, Technik und Requisiten reservieren, **damit** es keine Überschneidungen gibt.  
   **Ablauf:** Ressource auswählen → Zeitraum blocken → Freigabe durch Verantwortliche → Reservierung bestätigt.

2. **User Story: Material‑Inventar mit Zu‑ und Abgängen**  
   **Als** Requisite **möchte ich** Materialbewegungen dokumentieren, **damit** Bestand und Kosten nachvollziehbar sind.  
   **Ablauf:** Entnahme/Retouren erfassen → Bestand aktualisiert → Warnung bei Mindestbestand → CSV‑Export.

3. **User Story: Transport‑ und Aufbau‑Checklisten pro Aufführung**  
   **Als** Logistik **möchte ich** Checklisten für Aufbau/Abbau erstellen, **damit** Teams strukturiert arbeiten.  
   **Ablauf:** Checkliste aus Template → Aufgaben zuweisen → Live‑Status (offen/erledigt) → Nachbereitung.

4. **User Story: Budget‑Tracking mit Freigabeworkflow**  
   **Als** Vorstand **möchte ich** Ausgaben je Produktion freigeben, **damit** Budgetgrenzen eingehalten werden.  
   **Ablauf:** Kostenantrag erstellen → Genehmigungsstufe → Buchungsnachweis hochladen → Bericht im Dashboard.

5. **User Story: Risiko‑ & Notfallplanung**  
   **Als** Produktionsleitung **möchte ich** Risiken (Ausfall, Technik, Wetter) dokumentieren und Maßnahmen hinterlegen, **damit** schnell reagiert werden kann.  
   **Ablauf:** Risiko registrieren → Eintrittswahrscheinlichkeit + Impact bewerten → Maßnahmenplan → Status review.

---

## 🧩 Milestone: Produktionsplanung – Logistischer Prozess (Aufführungen & Helfereinsätze)

Der vollständige Milestone inklusive Scope und Issues ist ausgelagert:  
➡️ **[docs/milestones/produktionsplanung-logistik.md](./milestones/produktionsplanung-logistik.md)**
**Ziel:** Die Planung von Aufführungsserien, Ressourcen, Helferschichten und Helferprofilen in klar getrennten Ebenen abbilden (Serie → Aufführung → Organisation → Personen).

### Scope (Ergebnisbild)
- Aufführungsserien als Master‑Planungsebene mit Status‑Flow (Draft → Planung → Publiziert → Abgeschlossen)
- Automatische Generierung von Aufführungen (Datumsliste/Wiederholungslogik + Ausnahmen + Sondervorstellungen)
- Ressourcenbedarf (Räume, Technik, Material) je Aufführung mit Default‑Vorlagen
- Schichttemplates → konkrete, buchbare Schichten mit Slot‑Logik und Status
- Ausschreibung intern/extern inkl. Link/QR und Sichtbarkeitssteuerung
- Einheitliche Helferprofile mit Typen (Mitglied/Extern/Freund) + Zugehörigkeiten
- Partnervereine mit Kontingenten und Erfüllungsgrad
- Anmeldeflow inkl. Konfliktprüfung, Slot‑Verwaltung und Kurzregistrierung
- Backoffice‑Steuerung, Export, Nachbearbeitung & Historie

### Issues / Feature Requests
1. **Aufführungsserie anlegen & verwalten**  
   **Feature:** Serie mit Titel, Produktion, Standard‑Ort/Zeiten, Standard‑Ressourcen, Standard‑Schichttemplates und Status‑Flow.  
   **Akzeptanzkriterien:** Serie speichert Defaults; Statuswechsel auditierbar.

2. **Aufführungen aus Serie generieren**  
   **Feature:** Generierung per Datumsliste oder Wiederholungslogik (z. B. Fr–So), inkl. Ausnahmen & Sondervorstellungen.  
   **Akzeptanzkriterien:** Jede Aufführung ist eigenständig, bleibt aber mit der Serie verknüpft.

3. **Ressourcenbedarf pro Aufführung**  
   **Feature:** Ressourcen (Räume/Technik/Material) als nicht‑personale Planungsebene mit fix/variabel‑Logik.  
   **Akzeptanzkriterien:** Ressourcen‑Defaults können pro Aufführung überschrieben werden.

4. **Schichttemplates definieren**  
   **Feature:** Wiederverwendbare Templates mit Rolle, Zeitfenster, Slot‑Anzahl und optionalen Qualifikationen.  
   **Akzeptanzkriterien:** Templates serienweit definierbar, mehreren Aufführungen zuweisbar.

5. **Schichten aus Templates erzeugen**  
   **Feature:** Konkrete Schichten pro Aufführung mit Start/Endzeit, Slots und initialem Status „offen“.  
   **Akzeptanzkriterien:** Schichten sind buchbar und zeigen Belegungsgrad.

6. **Ausschreibung & Sichtbarkeit steuern**  
   **Feature:** Schichten intern/extern veröffentlichen über App/Web/E‑Mail/Link/QR.  
   **Akzeptanzkriterien:** Status (offen/teilweise/voll/geschlossen) ist sichtbar und filterbar.

7. **Helferprofile & Typenmodell**  
   **Feature:** Einheitliches Helferprofil (Mitglied/Extern/Freund) mit minimalem Onboarding für Externe/Freunde.  
   **Akzeptanzkriterien:** Jede Person existiert genau einmal; Profile sind wiederverwendbar.

8. **Zugehörigkeiten & Partnervereine**  
   **Feature:** Trennung von Helferprofil und Zugehörigkeit (Partnerverein, Freund, mehrere Organisationen).  
   **Akzeptanzkriterien:** Zugehörigkeiten sind auswertbar und für Kontakt/Abrechnung nutzbar.

9. **Partnerverein‑Kontingente & Erfüllungsgrad**  
   **Feature:** Kontingente pro Serie/Aufführung (z. B. „8 Service‑Helfer“) und Monitoring.  
   **Akzeptanzkriterien:** Anzeige „erwartet vs. registriert“ pro Partnerverein.

10. **Anmeldeflow mit Konfliktprüfung**  
   **Feature:** Helfer wählen Aufführung + Schichten, System prüft Überschneidung, Mehrfachbelegung, Slot‑Verfügbarkeit.  
   **Akzeptanzkriterien:** Blockierte Anmeldungen werden begründet; erfolgreiche Anmeldung erzeugt Einsatzdatensatz.

11. **Backoffice‑Übersichten & Aktionen**  
   **Feature:** Übersichten zu Serien/Aufführungen, Besetzungsgrad, kritischen Rollen und Helferlisten.  
   **Akzeptanzkriterien:** Manuelle Zuweisung, Schicht‑Sperre/Erweiterung, Export (PDF/Excel).

12. **Nachbearbeitung & Historie**  
   **Feature:** Aufführungen abschließen, No‑Shows erfassen, Einsatzhistorie & Dankes‑Mails.  
   **Akzeptanzkriterien:** Historie je Helfer aktualisiert; Statistik zu Engpassrollen verfügbar.

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
