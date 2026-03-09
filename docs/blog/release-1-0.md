# BackstagePass 1.0 ist live — die neue Vereinssoftware der Theatergruppe Widen

**Datum:** 9. März 2026
**Autor:** Das BackstagePass-Team
**Tags:** Release, Vereinsverwaltung, Theatergruppe Widen, Software

---

Seit Jahren organisiert die Theatergruppe Widen — "s'Theater uf em Mutschelle" — ihre Produktionen mit einer Mischung aus Telefonanrufen, Excel-Tabellen und guter Laune. Das funktioniert. Aber mit wachsendem Vereinsleben, komplexeren Produktionen und immer mehr Helfern stösst man irgendwann an Grenzen.

Heute ist der Tag, an dem das anders wird.

**BackstagePass 1.0 ist live** — eine massgeschneiderte Vereinsverwaltungssoftware, die wir von Grund auf für die Theatergruppe Widen entwickelt haben. Eine Plattform, die so aufgebaut ist, wie wir als Verein funktionieren: mit klaren Rollen, guter Übersicht und wenig administrativem Aufwand.

---

## Was ist BackstagePass?

BackstagePass ist eine webbasierte Anwendung, über die alle relevanten Vereinsprozesse der TGW an einem Ort zusammenlaufen. Von der Mitgliederverwaltung über die Probenplanung bis zur Helferkoordination an Aufführungsabenden — alles ist miteinander verknüpft und für jede Rolle im Verein zugänglich.

Die App läuft unter [backstage-pass.vercel.app](https://backstage-pass.vercel.app) und ist für alle Vereinsmitglieder, Helfer und Partner der TGW verfügbar. Konto und Zugang werden vom Vorstand vergeben.

---

## Was kann BackstagePass?

### Mitgliederverwaltung

Der Vorstand verwaltet alle Vereinsmitglieder zentral: Kontaktdaten, Notfallkontakte, Fähigkeiten und Rollen. Profile lassen sich anlegen, bearbeiten und archivieren. Wer neu in den Verein kommt, erhält eine Einladungsmail und wird über einen Onboarding-Wizard durch die ersten Schritte geführt.

Die Personendetailseite zeigt auf einen Blick, an welchen Produktionen jemand beteiligt ist, welche Rollen er oder sie spielt und wie viele Helferstunden bereits geleistet wurden.

### Kalender und Veranstaltungen

Proben, Aufführungen, Vereinsevents und externe Helfereinsätze erscheinen in einer gemeinsamen Kalenderansicht. Mitglieder sehen nur, was für sie relevant ist — angepasst an ihre Rolle im Verein. Für aktive Mitglieder gibt es ein persönliches Dashboard im Outlook-Stil mit kommenden Terminen, eigenen Anmeldungen und offenen Schichten.

### Helferliste und Mitmachen-System

Eines der Kernstücke von BackstagePass ist das Helfersystem. Der Vorstand legt für jede Aufführung Zeitblöcke und Schichten an — zum Beispiel Kasse, Service, Garderobe, Auf- und Abbau. Diese Schichten werden öffentlich ausgeschrieben.

Vereinsmitglieder können sich über die App direkt anmelden. Externe Helfer und Freunde des Vereins erhalten einen persönlichen Link per E-Mail und können sich darüber registrieren — ganz ohne App-Konto. Das System prüft dabei automatisch auf Zeitkonflikte: Wer sich für zwei Schichten bewirbt, die sich überschneiden, wird freundlich darauf hingewiesen.

Auf der Vorstand-Seite gibt es eine Helferliste mit Ampelsystem: Grün bedeutet ausreichend besetzt, Gelb signalisiert Handlungsbedarf, Rot zeigt eine kritische Lücke. So sieht der Vorstand auf einen Blick, wo noch Helfer gebraucht werden.

### Stücke, Szenen, Rollen und Besetzungen

BackstagePass bildet die künstlerische Seite des Vereinslebens vollständig ab. Ein Stück wird mit seinen Szenen und Rollen angelegt. Dann wird besetzt: Wer spielt welche Rolle? Wer ist Regisseur, wer Souffleuse, wer Bühnenbildner?

Diese Besetzungsdaten fliessen automatisch in andere Bereiche ein: Wer besetzt ist, wird bei einer neuen Probe automatisch als Teilnehmer eingeladen. Wer in einer Produktion mitwirkt, sieht die Aufführungen dieser Produktion in seinem persönlichen Kalender.

### Probenplanung

Proben lassen sich mit Datum, Uhrzeit, Raum und zugewiesenen Szenen anlegen. Wer zu einer Probe eingeladen werden soll, schlägt das System anhand der Besetzung vor — Vorschau inklusive, damit der Regisseur vor dem Versand prüfen kann, wen er wirklich braucht.

Der Probenplan-Generator analysiert die verfügbaren Termine und hilft dabei, sinnvolle Probenfolgen zu entwickeln. Teilnehmer erhalten Einladungen und können ihre Anwesenheit bestätigen oder absagen.

### Stundenkonto

Für Vorstandsmitglieder und aktive Mitglieder führt BackstagePass ein Stundenkonto. Geleistete Helfereinsätze werden automatisch erfasst. Der Vorstand kann auf einen Blick sehen, wer sein Stunden-Soll erfüllt — und wer noch nachzieht.

### Raum- und Ressourcenverwaltung

Proberäume, das Vereinslokal, Technikequipment und Bühnenausstattung lassen sich reservieren. Das System verhindert Doppelbelegungen. Wer einen Raum oder eine Ressource buchen möchte, sieht sofort, ob und wann er verfügbar ist.

### Aufführungs-Templates

Damit nicht bei jeder Aufführung dasselbe von Grund auf neu geplant werden muss, gibt es Templates. Ein Template definiert, welche Zeitblöcke und Schichten für eine typische Abendvorstellung benötigt werden — inklusive relativer Zeitangaben (z.B. "Kasse: 2 Stunden vor Vorstellungsbeginn"). Wird das Template auf eine konkrete Aufführung angewendet, berechnet das System automatisch die absoluten Zeiten.

### E-Mail-System

BackstagePass verschickt automatische Bestätigungsmails bei Anmeldungen, Statusänderungen und Einladungen. Alle versendeten E-Mails werden in einem Log erfasst und sind für Admins einsehbar — inklusive Sendestatus. Funktioniert der Versand einmal nicht, bleibt das nicht unbemerkt.

### Partner-Portal

Partnervereine, die regelmässig Helfer zur Verfügung stellen, erhalten einen eigenen Zugang. Im Partner-Portal sehen sie ihre Daten, die anstehenden Veranstaltungen und können Kontakt aufnehmen. Das entlastet den Vorstand von wiederkehrenden Kommunikationsaufgaben.

---

## Für wen ist die App da?

BackstagePass kennt sieben Rollen — abgestimmt auf die echten Strukturen eines Theatervereins:

| Rolle | Wer? | Was sieht und kann er? |
|-------|------|------------------------|
| **Administrator** | IT-Verantwortliche | Vollzugriff, Benutzerverwaltung, Audit-Log |
| **Vorstand** | Vorstandsmitglieder | Alle Verwaltungsmodule, Berichte, Schichtplanung |
| **Aktives Mitglied** | Ensemble, Technik, Orga | Eigene Termine, Anmeldungen, Proben, Aufführungen |
| **Passives Mitglied** | Fördermitglieder | Stücke, Veranstaltungen, eigenes Profil |
| **Helfer** | Externe Einsatzkräfte | Eigene Schichten, Profil |
| **Partner** | Partnervereine | Partner-Portal, Veranstaltungsübersicht |
| **Freunde** | Interessierte | Willkommensbereich, Veranstaltungen |

Jede Rolle sieht nur, was sie braucht. Kein Informationsüberfluss, keine falschen Klicks in Bereiche, die einen nichts angehen.

---

## Datenschutz

BackstagePass wurde von Beginn an datenschutzkonform entwickelt — nach dem Schweizer nDSG (Datenschutzgesetz), gültig seit 1. September 2023. Das bedeutet konkret:

- Personendaten werden nur so lange gespeichert, wie nötig
- Externe Helfer-Daten werden nach spätestens zwei Jahren ohne aktive Einsätze gelöscht
- Mitgliederdaten werden nach Austritt drei Jahre aufbewahrt
- Alle Datenbankzugriffe sind durch Row Level Security geschützt: Kein Benutzer kann Daten sehen oder ändern, für die er keine Berechtigung hat
- Sicherheitsrelevante Aktionen werden in einem Audit-Log protokolliert

Die vollständige Datenschutzerklärung findet sich in der App unter `/datenschutz`.

---

## Sicherheit

Sicherheit war kein Nachgedanke. Alle Tabellen in der Datenbank sind mit Row Level Security (RLS) geschützt — jede Anfrage wird datenbankweit auf Berechtigungen geprüft, unabhängig davon, was die Applikationsschicht erlaubt. Zusätzlich prüfen alle serverseitigen Aktionen Berechtigungen explizit, bevor sie Daten lesen oder verändern.

Eingaben werden konsequent validiert. Die gesamte Kommunikation läuft verschlüsselt über HTTPS. Ein dediziertes Audit-Log erfasst sicherheitsrelevante Ereignisse für ein Jahr.

Vor dem Release hat Ioannis, unser QA- und Security-Spezialist, eine umfassende Sicherheitsprüfung durchgeführt. Alle kritischen Befunde wurden behoben.

---

## Technologie

BackstagePass basiert auf einem modernen, bewährten Stack:

**Next.js 15** (App Router) — Das Frontend-Framework aus dem Hause Vercel. Serverseitiges Rendering by default, schnelle Ladezeiten, starkes TypeScript-Ökosystem.

**Supabase** — Eine Open-Source-Alternative zu Firebase, basierend auf PostgreSQL. Supabase liefert Authentifizierung, Datenbank und Echtzeit-Funktionen in einem. Row Level Security ist direkt in der Datenbank verankert.

**Tailwind CSS** — Utility-first CSS-Framework mit einer eigenen Farbpalette für die TGW: Bühnenfarben, Vorhangrot, Akzenttöne — das Design ist auf das Theater abgestimmt.

**Vercel** — Hosting und Deployment. Jeder Commit auf `main` wird automatisch deployed. Zero-Downtime-Releases sind Standard.

Die App ist ein Monorepo: Der Quellcode, die Datenbankmigrationen und die Dokumentation leben gemeinsam in einem Repository. Das macht Änderungen nachvollziehbar und konsistent.

---

## Wie die App entstanden ist

BackstagePass wurde von Christian Stebler entwickelt — mit Unterstützung eines strukturierten AI-Teams, das jeden Schritt der Entwicklung begleitet hat:

**Martin** (Architekt) hat das Datenbankschema entworfen, Migrationen geplant und Sicherheitskonzepte ausgearbeitet. **Peter** (Entwickler) hat den Code geschrieben — Feature für Feature, in sauberen Pull Requests mit Tests. **Kim** (UI/UX) hat das Design-System aufgebaut und die Benutzerführung gestaltet. **Ioannis** (QA & Security) hat jeden Pull Request überprüft und die Sicherheitsauditierung durchgeführt. **Johannes** (Dokumentation) hat Entscheidungen festgehalten, Architekturaufzeichnungen erstellt und dafür gesorgt, dass das Wissen im Projekt bleibt.

202 Issues. 19 abgeschlossene Milestones. Alles auf null offene Punkte.

---

## Was kommt als Nächstes?

Version 1.0 ist ein vollständiges, produktionsreifes System — aber kein abgeschlossenes. Die Arbeit geht weiter.

Auf der Roadmap stehen:

- **Produktions-Dashboard**: Eine Gesamtübersicht über Besetzungsstand, offene Schichten und Probenfortschritt pro Produktion
- **Erweitertes Berichtswesen**: Auswertungen zu Helferstunden, Besetzungshistorie, Raumnutzung
- **Verfügbarkeitsmanagement**: Aktive Mitglieder können Abwesenheiten eintragen, die bei der Probenplanung berücksichtigt werden
- **Mobile Optimierung**: Die App funktioniert heute auf dem Smartphone — der nächste Schritt ist eine noch stärkere Optimierung für mobile Nutzung an Aufführungsabenden
- **Öffentliche Veranstaltungsseite**: Eine öffentlich zugängliche Seite mit dem aktuellen Spielplan der TGW

Rückmeldungen, Wünsche und Fehlerberichte sind willkommen. Wer ein Feedback hat, kann sich direkt beim Vorstand melden: [theatergruppewiden@gmail.com](mailto:theatergruppewiden@gmail.com)

---

## Vorhang auf

BackstagePass ist die Bühne hinter der Bühne. Es nimmt der Theatermacherei nicht den Zauber — aber es nimmt dem Vorstand die Zettelwirtschaft, den Mitgliedern die Terminverwirrung und dem Helferkoordinator die schlaflosen Nächte.

"s'Theater uf em Mutschelle" hat jetzt sein eigenes digitales Zuhause.

Danke an alle, die mitgeholfen haben — auf und hinter der Bühne.

**Das BackstagePass-Team**
[backstage-pass.vercel.app](https://backstage-pass.vercel.app) | [www.theater-widen.ch](https://www.theater-widen.ch)
