# 🎯 GitHub Issues - Alle 12 Issues zum Kopieren/Einfügen

> Repository: https://github.com/trismus/Argus
> Gehe zu: Issues → New Issue → Copy & Paste Content
> Labels: Füge hinzu nach Erstellung

---

# 🔧 MODULE 0: FOUNDATION

---

## EPIC 0: Fundament für alle Module – Authentifizierung & Mitgliederverwaltung

```
Title: Epic: Fundament für alle Module – Authentifizierung & Mitgliederverwaltung

Body:
## Ziel
Authentifizierung, Benutzerverwaltung und rollenbasierte Zugriffsrechte als sichere Grundlage für alle Module einrichten.

## Nutzen / User Storys
- Als Mitglied möchte ich mich sicher anmelden können, um auf die Plattform zuzugreifen.
- Als Admin möchte ich Benutzer und Rollen verwalten können.
- Als Regie/Produktion möchte ich nur relevante Daten sehen (basierend auf meiner Rolle).

## Vorschlag
- Supabase Auth für sichere Authentifizierung
- Rollenmodell (Member, Admin, Regie, Produktion, Technik, Maske, etc.)
- RLS Policies für Datenschutz und Zugriffsrechte
- Persönliche Profile und Settings
- Audit Log für kritische Aktionen

## Abhängigkeiten
- Alle anderen Module (1, 2, 3) hängen von Modul 0 ab

Labels: epic, module-0, backend
```

---

## Issue 0.1: Benutzer-Authentifizierung & Login-System

```
Title: Benutzer-Authentifizierung & Login-System

Body:
## Ziel
Ein sicheres Login/Logout-System mit Email-Authentifizierung über Supabase aufbauen.

## Nutzen / User Storys
- Als Mitglied möchte ich mich mit Email und Passwort anmelden können.
- Als Mitglied möchte ich mein Passwort zurücksetzen können, wenn ich es vergesse.
- Als Plattform möchte ich sichere Authentifizierung ohne Sicherheitslücken.

## Vorschlag
- Supabase Auth (Email/Passwort)
- Login-Page mit Email/Passwort-Feldern
- Passwort-Reset via Email
- Session-Management (Tokens)
- Logout-Funktion
- ggf. "Remember Me" Option

## Akzeptanzkriterien
- [ ] Login funktioniert mit korrekten Credentials
- [ ] Falsches Passwort wird abgelehnt
- [ ] Passwort-Reset sendet Email und setzt neues Passwort
- [ ] Session bleibt erhalten bei Seitenwechsel
- [ ] Logout löscht Session & Redirect zu Login-Page
- [ ] Error-Handling für ungültige Email-Formate

## Alternativen
- OAuth (Google/GitHub) statt Email/Passwort
- 2FA für zusätzliche Sicherheit (optional für Phase 2)

Labels: feature, module-0, backend, UI/UX
```

---

## Issue 0.2: Mitgliederprofil & Benutzerverwaltung

```
Title: Mitgliederprofil & Benutzerverwaltung

Body:
## Ziel
Benutzerprofile mit persönlichen Daten, Kontaktinformationen und Einstellungen verwalten.

## Nutzen / User Storys
- Als Mitglied möchte ich mein Profil (Name, Email, Telefon, Bio) sehen und bearbeiten können.
- Als Admin möchte ich alle Benutzer und deren Daten verwalten können.
- Als Mitglied möchte ich meine Datenschutz-Einstellungen kontrollieren.

## Vorschlag
- Profil-Seite mit bearbeitbarem Namen, Email, Telefon, Bio
- Avatar/Profilbild Upload (optional)
- Datenschutz-Einstellungen (Wer sieht mein Profil?)
- Admin-Panel zur Verwaltung aller Benutzer
- Benutzer-Liste mit Filter & Suche
- Benutzer aktivieren/deaktivieren (Soft Delete)

## Akzeptanzkriterien
- [ ] Mitglied kann Profildaten einsehen und bearbeiten
- [ ] Avatar-Upload funktioniert
- [ ] Admin sieht alle Benutzer in einer Tabelle
- [ ] Admin kann Benutzer aktivieren/deaktivieren
- [ ] Benutzer-Suche funktioniert
- [ ] Änderungen werden im Audit Log geloggt

## Alternativen
- Profile als Read-Only für Member (nur Admin kann ändern)
- Avatar-Upload nicht unterstützen

Labels: feature, module-0, frontend, database
```

---

## Issue 0.3: Rollenmanagement & Permissions

```
Title: Rollenmanagement & Permissions

Body:
## Ziel
Ein flexibles Rollenmodell mit Permissions für verschiedene Funktionen und Zugriffsebenen aufbauen.

## Nutzen / User Storys
- Als Admin möchte ich Rollen (Member, Admin, Regie, Produktion, etc.) zuweisen können.
- Als Regie möchte ich nur künstlerische Funktionen sehen und verwalten können.
- Als Produktion möchte ich nur Aufführungs- & Logistik-Daten sehen und verwalten können.

## Vorschlag
- Rollen-Modell mit Rollen:
  - Member (Standard-Mitglied)
  - Admin (Super-Admin)
  - Regie (Künstlerische Leitung)
  - Produktion (Produktionsleitung)
  - Technik (Technisches Team)
  - Maske/Kostüm (Creative Team)
- Permission-System (Wer darf was machen?)
- Mehrfach-Rollen pro Mitglied möglich
- Admin-Panel zur Rollen-Zuweisung
- RLS Policies in Supabase für Datenzugriff

## Akzeptanzkriterien
- [ ] Admin kann Rollen zuweisen/entfernen
- [ ] Mitglied kann mehrere Rollen haben
- [ ] RLS Policies sind implementiert
- [ ] Regie sieht nur künstlerische Daten
- [ ] Produktion sieht nur Logistik-Daten
- [ ] Audit Log trackt Rollen-Änderungen

## Alternativen
- Feste Rollen ohne Flexibility
- RLS später implementieren (Security Risk!)

Labels: feature, module-0, backend, database
```

---

## Issue 0.4: Audit Log & Activity Tracking

```
Title: Audit Log & Activity Tracking

Body:
## Ziel
Alle kritischen Aktionen (Login, Profil-Änderungen, Rollen-Zuweisung) für Transparenz und Sicherheit loggen.

## Nutzen / User Storys
- Als Admin möchte ich sehen, wer was wann getan hat (für Accountability).
- Als Security-Officer möchte ich verdächtige Aktivitäten erkennen (mehrere failed Logins, etc.).

## Vorschlag
- Audit Log für kritische Aktionen:
  - Login/Logout
  - Profil-Änderungen
  - Rollen-Zuweisung
  - Admin-Aktionen
  - Data Changes (wer hat was geändert)
- Audit Log Admin-Dashboard mit Filter & Export
- Optional: Email-Alert bei verdächtigen Aktivitäten

## Akzeptanzkriterien
- [ ] Alle Login/Logout-Events werden geloggt
- [ ] Profil-Änderungen werden mit alte/neue Werte geloggt
- [ ] Admin-Panel zeigt Audit Log
- [ ] Filter nach Benutzer, Datum, Action möglich
- [ ] Audit Log kann exportiert werden

## Alternativen
- Nur Fehler-Logging (nicht alle Aktionen)
- Audit Log nur für Admins sichtbar (ja, das ist gut!)

Labels: feature, module-0, backend, chore
```

---

# 🎉 MODUL 1: VEREINSLEBEN & HELFEREINSÄTZE

---

## EPIC 1: Vereinsleben & Helfereinsätze zentral abbilden

```
Title: Epic: Vereinsleben & Helfereinsätze zentral abbilden

Body:
## Ziel
Vereinsinterne Anlässe und externe Helfereinsätze inklusive Anmeldung, Rollen, Kalender und Helferstunden transparent verwalten.

## Nutzen/ User Storys
- Als Mitglied möchte ich mich zu Vereinsanlässen an- und abmelden können, um meine Teilnahme zu planen.
- Als Organisator:in möchte ich Teilnehmerlisten sehen, um den Anlass vorzubereiten.
- Als Verein möchte ich Engagement und Helferstunden nachvollziehen.

## Vorschlag
- Modul mit Vereinsevents, Helferevents, An-/Abmeldung, Rollen, Kalender und Helferstunden.
- Persönliche Übersichten je Mitglied.

## Alternativen
- Externe Tools für Anmeldungen (Doodle/Forms).
- Nur interne Events, keine externen Helfereinsätze.

## Abhängigkeiten
- Module 0 (Auth & Mitgliederverwaltung) muss fertig sein

Labels: epic, module-1, frontend
```

---

## Issue 1.1: Vereinsevents verwalten (Erstellen/Planen/Anmelden)

```
Title: Vereinsevents verwalten (Erstellen/Planen/Anmelden)

Body:
## Ziel
Vereinsinterne Anlässe (z. B. GV, Helferessen, Ausflug) als Events mit An- und Abmeldung verwaltbar machen.

## Nutzen/ User Storys
- Als Mitglied möchte ich mich zu Vereinsanlässen an- und abmelden können, um meine Teilnahme zu planen.
- Als Organisator:in möchte ich Teilnehmerlisten sehen, um den Anlass vorzubereiten.

## Vorschlag
- Event-Objekt mit Datum, Ort, Beschreibung, Kapazität, An-/Abmeldestatus.
- Anmeldelogik inkl. Warteliste (optional).
- Übersichtsliste der Events für Mitglieder.

## Akzeptanzkriterien
- [ ] Event kann erstellt werden mit Datum, Ort, Beschreibung
- [ ] Mitglied kann sich an-/abmelden
- [ ] Organisator sieht Teilnehmerliste
- [ ] Warteliste funktioniert (wenn Kapazität erreicht)
- [ ] Event-Kalender zeigt alle kommenden Events
- [ ] Absagen-Benachrichtigung geht an abgemeldete Organisatoren

## Alternativen
- Anmeldungen nur über externes Tool (z. B. Doodle/Forms) ohne Integration.
- Nur interne Events ohne externen Helferbezug abbilden.

Labels: feature, module-1, frontend, database
```

---

## Issue 1.2: Externe Helfereinsätze abbilden

```
Title: Externe Helfereinsätze abbilden

Body:
## Ziel
Externe Helfereinsätze bei Partnerorganisationen erfassen und verwalten.

## Nutzen/ User Storys
- Als Mitglied möchte ich Einsätze bei Partnerorganisationen sehen und mich eintragen können.
- Als Verein möchte ich Einsatzhistorien pro Mitglied nachvollziehen können.

## Vorschlag
- Helferevent-Objekt mit Partner, Einsatzzeit, Rollenbedarf.
- Anmeldung mit Rollen/Schichten.
- Export oder Übersicht für Nachweis.

## Akzeptanzkriterien
- [ ] Helferevent kann erstellt werden mit Partner, Zeit, Rollenbedarf
- [ ] Mitglied kann sich mit Rolle/Schicht anmelden
- [ ] Einsatzhistorie pro Mitglied verfügbar
- [ ] Export der Einsatzhistorie möglich (PDF/CSV)
- [ ] Partnerliste verwaltbar
- [ ] Rollenbedarf ist flexibel (z.B. 2x Auf-, 1x Abbau, 3x Auf-/Abbau)

## Alternativen
- Nur interne Helfereinsätze, externe nur als Notizfeld.
- Einsatzhistorie ausschließlich manuell.

Labels: feature, module-1, frontend, database
```

---

## Issue 1.3: Persönliche Einsatz- und Kalenderübersicht

```
Title: Persönliche Einsatz- und Kalenderübersicht

Body:
## Ziel
Persönliche Kalender- und Einsatzübersichten bereitstellen.

## Nutzen/ User Storys
- Als Mitglied möchte ich alle meine Einsätze und Vereinsanlässe in einer Übersicht sehen.
- Als Verein möchte ich Engagement und Helferstunden transparent machen.

## Vorschlag
- Personal Dashboard: kommende/abgeschlossene Einsätze, Stundenkonto.
- Kalender-Ansicht (Monat/Woche).
- Filter nach Eventtyp (Verein/extern).

## Akzeptanzkriterien
- [ ] Dashboard zeigt kommende Einsätze/Events
- [ ] Kalender-Ansicht (Monat/Woche/Tag) funktioniert
- [ ] Stundenkonto wird automatisch berechnet
- [ ] Filter nach Eventtyp funktioniert
- [ ] Vergangenheit zeigt abgeschlossene Einsätze
- [ ] Ikal-Export (ical) zum Hinzufügen zu persönlichem Kalender

## Alternativen
- Nur Listenansicht ohne Kalender.
- Keine persönliche Übersicht (nur Eventlisten).

Labels: feature, module-1, frontend, UI/UX
```

---

# 🎬 MODUL 2: OPERATIVE AUFFÜHRUNGSLOGISTIK

---

## EPIC 2: Operative Aufführungslogistik effizient planen

```
Title: Epic: Operative Aufführungslogistik effizient planen

Body:
## Ziel
Aufführungen, Helferpläne, Räume, Ressourcen und wiederkehrende Abläufe für die Spielphase koordinieren.

## Nutzen / User Storys
- Als Produktionsleitung möchte ich Zeitblöcke, Helferrollen und Ressourcen pro Aufführung planen.
- Als Helfer:in möchte ich klar sehen, wann und wo ich gebraucht werde.

## Vorschlag
- Aufführungen mit Zeitblöcken, Helferrollen und Schichten.
- Ressourcen- und Raumverwaltung mit Verfügbarkeiten.
- Templates für wiederkehrende Abläufe.

## Alternativen
- Schichtplanung in externem Tool.
- Nur Aufführungszeiten ohne Ressourcen-/Schichtlogik.

## Abhängigkeiten
- Module 0 (Auth & Mitgliederverwaltung) muss fertig sein
- Module 1 (Vereinsleben) hilft beim Helfer-Kontext

Labels: epic, module-2, backend
```

---

## Issue 2.1: Aufführungen mit Zeitblöcken planen

```
Title: Aufführungen mit Zeitblöcken planen

Body:
## Ziel
Aufführungen inklusive Zeitblöcken und Schichten planbar machen.

## Nutzen/ User Storys
- Als Produktionsleitung möchte ich pro Aufführung Zeitblöcke definieren, um Schichten zu planen.
- Als Helfer:in möchte ich sehen, wann ich gebraucht werde.

## Vorschlag
- Aufführung-Objekt mit Datum, Zeit, Status.
- Zeitblock/Schicht-Objekte mit Start/Ende, Bedarf.
- Verknüpfung zu Helferrollen.

## Akzeptanzkriterien
- [ ] Aufführung kann erstellt werden mit Datum, Uhrzeit, Ort, Status
- [ ] Zeitblöcke können pro Aufführung definiert werden
- [ ] Schichten können erstellt werden (mit Helferrolle, Personenanzahl)
- [ ] Schicht-Übersicht zeigt Bedarf vs. Belegung
- [ ] Kalender zeigt alle Aufführungen
- [ ] Änderungen triggern Benachrichtigungen für Helfer

## Alternativen
- Nur fixe Aufführungszeiten ohne Schichtplanung.
- Schichten in externem Tool verwalten.

Labels: feature, module-2, backend, database
```

---

## Issue 2.2: Ressourcen & Räume verwalten

```
Title: Ressourcen & Räume verwalten

Body:
## Ziel
Räume und Ressourcen (Technik/Material) für Aufführungen planen.

## Nutzen/ User Storys
- Als Produktionsleitung möchte ich Ressourcen zuordnen, um Engpässe zu vermeiden.
- Als Technikteam möchte ich benötigtes Material rechtzeitig bereitstellen.

## Vorschlag
- Ressourcen- und Raumobjekte mit Verfügbarkeit.
- Zuordnung zu Aufführungen/Schichten.
- Konfliktanzeige (z. B. Doppelbelegung).

## Akzeptanzkriterien
- [ ] Raum-Katalog erstellen (Bühne, Foyer, Lager, etc.)
- [ ] Ressourcen-Katalog erstellen (Licht, Ton, Materialien)
- [ ] Reservierungen pro Aufführung sind möglich
- [ ] Verfügbarkeitsprüfung für Doppelbelegungen
- [ ] Konflikt-Warnung bei Überbuchung
- [ ] Ressourcen-Checkliste vor Aufführung

## Alternativen
- Ressourcen nur in Freitext.
- Raumplanung getrennt von Aufführungen.

Labels: feature, module-2, backend, database
```

---

## Issue 2.3: Einsatz-Templates für wiederkehrende Abläufe

```
Title: Einsatz-Templates für wiederkehrende Abläufe

Body:
## Ziel
Wiederkehrende Abläufe als Templates für Schichtplanung abbilden.

## Nutzen/ User Storys
- Als Produktionsleitung möchte ich standardisierte Abläufe schneller anlegen.
- Als Helfer:in möchte ich konsistente Rollen/Schichten sehen.

## Vorschlag
- Template-Objekt mit Rollen, Zeiten, Ressourcen.
- Kopierfunktion auf neue Aufführungen.
- Anpassbarkeit pro Aufführung.

## Akzeptanzkriterien
- [ ] Templates können erstellt werden (Name, Zeitblöcke, Schichten, Ressourcen)
- [ ] Template kann auf neue Aufführung kopiert werden
- [ ] Zeiten können pro Aufführung angepasst werden
- [ ] Template-Bibliothek verwaltbar
- [ ] Templates können gelöscht/archiviert werden
- [ ] Schnelle Vorschau vor Anwendung

## Alternativen
- Manuelle Schichtplanung ohne Vorlagen.
- Nur Rollen-Templates, keine Zeitblöcke.

Labels: feature, module-2, backend, chore
```

---

# 🎭 MODUL 3: KÜNSTLERISCHE LEITUNG

---

## EPIC 3: Künstlerische Planung vom Stück bis zur Probe strukturieren

```
Title: Epic: Künstlerische Planung vom Stück bis zur Probe strukturieren

Body:
## Ziel
Stückentwicklung, Rollen-/Szenenstruktur, Besetzung und Probenplanung zentral steuern.

## Nutzen/ User Storys
- Als Regie möchte ich Szenen, Rollen und Besetzungen klar strukturieren.
- Als Ensemblemitglied möchte ich meine Rollen und Proben übersichtlich sehen.

## Vorschlag
- Stück, Szenen, Rollen und Besetzungen verknüpft abbilden.
- Probenplanung inkl. künstlerischer Funktionen.

## Alternativen
- Planung in separaten Dokumenten ohne Verknüpfung.
- Proben nur als Freitext ohne Funktionen.

## Abhängigkeiten
- Module 0 (Auth & Mitgliederverwaltung) muss fertig sein

Labels: epic, module-3, backend
```

---

## Issue 3.1: Stück, Szenen und Rollen strukturieren

```
Title: Stück, Szenen und Rollen strukturieren

Body:
## Ziel
Stück, Szenen und Rollen strukturiert erfassen und verknüpfen.

## Nutzen/ User Storys
- Als Regie möchte ich Szenen und Rollen sauber strukturiert dokumentieren.
- Als Produktionsteam möchte ich schnell sehen, welche Rollen in welchen Szenen auftreten.

## Vorschlag
- Stück-Objekt mit Szenenliste.
- Rollenobjekt, zugeordnet zu Szenen.
- Übersicht über Szenen/Rollen-Matrix.

## Akzeptanzkriterien
- [ ] Stück kann erstellt werden mit Titel, Beschreibung, Status
- [ ] Szenen können pro Stück erstellt werden (Nummer, Titel, Ort, Beschreibung)
- [ ] Rollen können pro Szene definiert werden
- [ ] Szenen/Rollen-Matrix zeigt Übersicht
- [ ] Rollenbeschreibungen editierbar
- [ ] Szenen-Reihenfolge sortierbar

## Alternativen
- Nur Szenenliste ohne Rollenbezug.
- Rollen nur als Freitext.

Labels: feature, module-3, backend, database
```

---

## Issue 3.2: Besetzung verwalten

```
Title: Besetzung verwalten

Body:
## Ziel
Besetzungen für Rollen erfassen und nachvollziehbar machen.

## Nutzen/ User Storys
- Als Regie möchte ich Rollen mit Darsteller:innen besetzen können.
- Als Ensemblemitglied möchte ich meine Rollenübersicht sehen.

## Vorschlag
- Besetzungsobjekt Rolle ↔ Mitglied.
- Mehrfachbesetzung/Alternates möglich.
- Rollenübersicht pro Mitglied.

## Akzeptanzkriterien
- [ ] Rollen können mit Mitgliedern besetzt werden
- [ ] Mehrfachbesetzung möglich (Hauptrolle + Substitute)
- [ ] Besetzungshistorie verfügbar (wer spielte wann)
- [ ] Rollenübersicht pro Mitglied abrufbar
- [ ] Unbesetzte Rollen sichtbar
- [ ] Besetzungsänderungen geloggt

## Alternativen
- Besetzungen nur in externen Dokumenten.
- Keine Besetzungshistorie.

Labels: feature, module-3, frontend, database
```

---

## Issue 3.3: Probenplanung mit künstlerischen Funktionen

```
Title: Probenplanung mit künstlerischen Funktionen

Body:
## Ziel
Probenplanung inklusive künstlerischer Funktionen (Regie, Regieassistenz, Bühnenbau, Maske, Technik) ermöglichen.

## Nutzen/ User Storys
- Als Regie möchte ich Proben inkl. beteiligter Funktionen planen.
- Als Technik/Maske möchte ich Proben mit Vorlauf kennen.

## Vorschlag
- Probe-Objekt mit Datum/Zeit, Szenenbezug.
- Zuordnung künstlerischer Funktionen.
- Teilnehmerliste & Benachrichtigungen (optional).

## Akzeptanzkriterien
- [ ] Probe kann erstellt werden mit Datum, Uhrzeit, Ort, Szenenbezug
- [ ] Künstlerische Funktionen können zugewiesen werden (Regie, Regieassistenz, Bühnenbau, Maske, Technik)
- [ ] Teilnehmerliste (Rollen + Funktionen) generierbar
- [ ] Benachrichtigungen an relevante Funktionen
- [ ] Proben-Kalender zeigt alle Proben
- [ ] Probe kann abgesagt/verschoben werden

## Alternativen
- Proben ohne Funktionszuordnung.
- Funktionen nur als Freitext pro Probe.

Labels: feature, module-3, frontend, database
```

---

# 📌 ANLEITUNG ZUM ERSTELLEN

1. Gehe zu: https://github.com/trismus/Argus/issues/new
2. Kopiere jeweils den **Title** und **Body**
3. Für Labels: Kopiere diese **nach** Erstellung (Rechts-Menü)
4. **Reihenfolge:** Epics zuerst, dann Issues darunter

---

**Total: 4 Epics + 12 Issues = 16 Einträge**

Alle Inhalte sind einsatzbereit! 🚀
