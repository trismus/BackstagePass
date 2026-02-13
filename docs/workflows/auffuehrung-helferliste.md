# Workflow: Von der Aufführung zur veröffentlichten Helferliste

Dieses Dokument beschreibt den kompletten Ablauf, wie ein Vorstandsmitglied eine Aufführung anlegt, die Helferliste konfiguriert und für externe Helfer veröffentlicht.

---

## Übersicht

```
Aufführung anlegen
       │
       ▼
Zeitblöcke definieren (Aufbau, Einlass, Vorstellung, Abbau, ...)
       │
       ▼
Schichten erstellen (Bar, Garderobe, Einlass, ... mit Anzahl)
       │
       ▼
Sichtbarkeit festlegen (intern / öffentlich pro Schicht)
       │
       ▼
Helferliste veröffentlichen → öffentlicher Link wird generiert
       │
       ▼
Link an externe Helfer verteilen (E-Mail, WhatsApp, etc.)
       │
       ▼
Helfer melden sich über den öffentlichen Link an
       │
       ▼
Helferliste abschliessen (wenn genügend Helfer gefunden)
```

---

## Schritt 1: Aufführung anlegen

**Navigation:** Aufführungen → Neue Aufführung (`/auffuehrungen/neu`)

**Berechtigung:** ADMIN oder VORSTAND

Folgende Angaben werden beim Erstellen erfasst:

| Feld | Beschreibung | Pflicht |
|------|-------------|---------|
| Titel | Name der Aufführung (z.B. "Premiere Sommernachtstraum") | Ja |
| Datum | Datum der Aufführung | Ja |
| Startzeit | Beginn der Veranstaltung | Nein |
| Endzeit | Ende der Veranstaltung | Nein |
| Ort | Veranstaltungsort | Nein |
| Beschreibung | Zusätzliche Informationen | Nein |
| Max. Teilnehmer | Maximale Anzahl Teilnehmer | Nein |

### Vorlage verwenden (optional)

Falls bereits Aufführungs-Vorlagen (`/templates`) existieren, können diese beim Erstellen angewendet werden. Eine Vorlage füllt automatisch vor:
- Zeitblöcke (z.B. Aufbau, Einlass, Vorstellung, Abbau)
- Schichten mit Rollen und benötigter Anzahl
- Ressourcen-Reservierungen

So muss nicht jedes Mal alles von Hand eingerichtet werden.

---

## Schritt 2: Aufführung konfigurieren

**Navigation:** Aufführungen → [Aufführung auswählen] (`/auffuehrungen/[id]`)

Auf der Detailseite werden die Bausteine der Aufführung eingerichtet.

### 2a: Zeitblöcke definieren

Zeitblöcke gliedern den Tag in Abschnitte. Typische Beispiele:

| Zeitblock | Von | Bis | Typ |
|-----------|-----|-----|-----|
| Aufbau | 14:00 | 16:00 | Aufbau |
| Einlass | 19:00 | 19:30 | Einlass |
| Vorstellung | 19:30 | 21:30 | Vorführung |
| Pause | 20:15 | 20:30 | Pause |
| Abbau | 21:30 | 23:00 | Abbau |

Zeitblöcke dienen als Rahmen für die Schichten — sie bestimmen, wann welche Helfer gebraucht werden.

### 2b: Schichten erstellen

Schichten beschreiben die konkreten Aufgaben und wie viele Personen dafür benötigt werden. Jede Schicht wird einem Zeitblock zugeordnet.

Beispiele:

| Schicht (Rolle) | Zeitblock | Anzahl benötigt | Sichtbarkeit |
|-----------------|-----------|-----------------|--------------|
| Bar | Einlass | 3 | Intern |
| Bar | Vorstellung | 2 | Intern |
| Garderobe | Einlass | 2 | Öffentlich |
| Einlasskontrolle | Einlass | 2 | Öffentlich |
| Aufbau Helfer | Aufbau | 5 | Öffentlich |
| Abbau Helfer | Abbau | 4 | Öffentlich |

**Wichtig:** Die **Sichtbarkeit** bestimmt, wer die Schicht sehen und sich dafür anmelden kann:
- **Intern** — Nur eingeloggte Mitglieder sehen diese Schicht
- **Öffentlich** — Auch externe Helfer (ohne Login) können sich über den öffentlichen Link anmelden

Standardmässig werden neue Schichten als **intern** erstellt.

### 2c: Info-Blöcke hinzufügen (optional)

Info-Blöcke sind Textabschnitte, die auf der öffentlichen Helferliste angezeigt werden. Damit können wichtige Informationen für Helfer kommuniziert werden, z.B.:
- Treffpunkt und Anfahrt
- Parkplatz-Hinweise
- Was mitbringen (bequeme Schuhe, etc.)
- Kontaktperson vor Ort

### 2d: Räume und Ressourcen (optional)

Für die interne Planung können Räume und Ressourcen (Technik, Material) reserviert werden. Dies ist für die öffentliche Helferliste nicht relevant, aber hilft bei der Gesamtplanung.

---

## Schritt 3: Helferliste vorbereiten

**Navigation:** Aufführung → Button "Zur Helferliste" (`/auffuehrungen/[id]/helferliste`)

Diese Seite zeigt die interne Ansicht der Helferliste mit allen Admin-Funktionen.

### 3a: Sichtbarkeit der Schichten prüfen

Bevor die Helferliste veröffentlicht wird, sollte geprüft werden, welche Schichten öffentlich sichtbar sein sollen.

**Einzeln umschalten:** Jede Schicht hat einen Sichtbarkeits-Toggle (Intern/Öffentlich).

**Alle auf einmal:** Mit den Buttons "Alle öffentlich" oder "Alle intern" kann die Sichtbarkeit aller Schichten auf einen Schlag geändert werden.

**Empfehlung:** Schichten, die spezielles Wissen oder Vertrauen erfordern (z.B. Kasse, Technik), als **intern** belassen. Allgemeine Aufgaben (Aufbau, Garderobe, Bar) als **öffentlich** markieren.

### 3b: Status-Übersicht

Die Helferliste hat drei Zustände:

| Status | Bedeutung |
|--------|-----------|
| **Entwurf** | Noch nicht öffentlich. Nur intern sichtbar. Schichten und Zeitblöcke können frei bearbeitet werden. |
| **Veröffentlicht** | Öffentlicher Link ist aktiv. Externe Helfer können sich anmelden. |
| **Abgeschlossen** | Keine neuen Anmeldungen mehr möglich (weder intern noch extern). Bestehende Anmeldungen bleiben sichtbar. |

---

## Schritt 4: Helferliste veröffentlichen

**Aktion:** Button "Helferliste veröffentlichen" auf der Helferliste-Seite

Was passiert beim Veröffentlichen:
1. Ein eindeutiger **öffentlicher Token** (UUID) wird generiert
2. Der Status wechselt auf **Veröffentlicht**
3. Der öffentliche Link wird angezeigt und kann kopiert werden

**Format des Links:** `https://backstagepass.ch/helfer/anmeldung/[token]`

Dieser Link kann nun an potenzielle Helfer verteilt werden — per E-Mail, WhatsApp, auf der Website, in Social Media, etc.

### Öffentlichen Link erneuern

Falls der Link unerwünscht geteilt wurde, kann mit "Link erneuern" ein neuer Token generiert werden. Der alte Link wird dadurch sofort ungültig.

---

## Schritt 5: Was Helfer auf der öffentlichen Seite sehen

Wenn ein externer Helfer den Link öffnet, sieht er:

1. **Veranstaltungsdetails:** Titel, Datum, Uhrzeit, Ort
2. **Info-Blöcke:** Wichtige Hinweise (Treffpunkt, Anfahrt, etc.)
3. **Verfügbare Schichten:** Nur Schichten mit Sichtbarkeit "Öffentlich", gruppiert nach Zeitblöcken
4. **Verfügbarkeit:** Wie viele Plätze pro Schicht noch frei sind

### Anmeldung als externer Helfer

Der Helfer wählt eine oder mehrere Schichten aus und füllt das Anmeldeformular aus:

| Feld | Pflicht |
|------|---------|
| Vorname | Ja |
| Nachname | Ja |
| E-Mail | Ja |
| Telefon | Nein |
| Datenschutz-Einwilligung (DSGVO) | Ja |

Was im Hintergrund passiert:
1. **Helfer-Profil:** Anhand der E-Mail-Adresse wird ein Profil in `externe_helfer_profile` gesucht oder neu erstellt. Wiederkehrende Helfer werden automatisch erkannt.
2. **Anmeldung erstellt:** In `auffuehrung_zuweisungen` wird ein Eintrag mit Status "Zugesagt" erstellt.
3. **Bestätigungs-E-Mail:** Der Helfer erhält eine E-Mail mit:
   - Übersicht der angemeldeten Schichten
   - ICS-Kalenderdatei zum Import
   - Link zum persönlichen Dashboard (`/helfer/meine-einsaetze/[dashboard-token]`)
   - Abmeldungs-Links für jede einzelne Schicht

**Kein Login nötig:** Der gesamte Ablauf funktioniert ohne Benutzerkonto. Alles läuft über Token-basierte Links.

---

## Schritt 6: Anmeldungen verwalten

**Navigation:** Aufführung → Zur Helferliste (`/auffuehrungen/[id]/helferliste`)

Auf der internen Helferliste sieht das Vorstandsmitglied:
- Alle Schichten (intern + öffentlich) mit aktueller Belegung
- Namen der angemeldeten Helfer (Mitglieder + externe)
- Status jeder Anmeldung

### Für den Helfer: Persönliches Dashboard

Jeder externe Helfer hat ein persönliches Dashboard unter `/helfer/meine-einsaetze/[dashboard-token]` (Link aus der Bestätigungs-E-Mail). Dort sieht er:
- Alle kommenden Einsätze mit Details
- Vergangene Einsätze (einklappbar)
- Abmelde-Links (sofern die Frist noch nicht abgelaufen ist)
- Links zur Anmeldung für weitere Schichten

### Abmeldung durch Helfer

Helfer können sich selbst abmelden über den Abmelde-Link in der E-Mail oder im Dashboard. Dabei gilt:
- Falls eine **Abmeldefrist** auf der Veranstaltung konfiguriert ist, muss die Abmeldung vor dieser Frist erfolgen
- Ohne konfigurierte Frist gilt ein Fallback von **6 Stunden vor Veranstaltungsbeginn**
- Nach Ablauf der Frist ist eine Online-Abmeldung nicht mehr möglich

---

## Schritt 7: Helferliste abschliessen

**Aktion:** Button "Helferliste abschliessen" auf der Helferliste-Seite

- Status wechselt auf **Abgeschlossen**
- Es sind keine neuen Anmeldungen mehr möglich (intern + extern)
- Bestehende Anmeldungen bleiben bestehen
- Der öffentliche Link zeigt die Meldung "Die Anmeldung ist abgeschlossen"

**Hinweis:** Nur Admins können eine abgeschlossene Helferliste wieder zurücksetzen.

---

## Zusammenfassung der Seiten

| Schritt | Seite | Beschreibung |
|---------|-------|-------------|
| 1 | `/auffuehrungen/neu` | Aufführung anlegen |
| 2 | `/auffuehrungen/[id]` | Zeitblöcke, Schichten, Ressourcen konfigurieren |
| 3-4 | `/auffuehrungen/[id]/helferliste` | Sichtbarkeit prüfen, veröffentlichen, verwalten |
| 5 | `/helfer/anmeldung/[token]` | Öffentliche Anmeldeseite für externe Helfer |
| — | `/helfer/meine-einsaetze/[token]` | Persönliches Dashboard des Helfers |
| — | `/helfer/helferliste/abmeldung/[token]` | Abmeldeseite für einzelne Schichten |

---

## Berechtigungen

| Aktion | ADMIN | VORSTAND | Aktives Mitglied | Externe Helfer |
|--------|-------|----------|------------------|----------------|
| Aufführung anlegen | Ja | Ja | Nein | Nein |
| Zeitblöcke/Schichten bearbeiten | Ja | Ja | Nein | Nein |
| Sichtbarkeit ändern | Ja | Ja | Nein | Nein |
| Helferliste veröffentlichen | Ja | Ja | Nein | Nein |
| Helferliste abschliessen | Ja | Ja | Nein | Nein |
| Intern anmelden (alle Schichten) | Ja | Ja | Ja | Nein |
| Extern anmelden (öffentliche Schichten) | — | — | — | Ja (via Link) |
| Abgeschlossene Liste zurücksetzen | Ja | Nein | Nein | Nein |
