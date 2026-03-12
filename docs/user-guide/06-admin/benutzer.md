# Benutzerverwaltung (Admin)

> **Hinweis:** Dieser Bereich ist nur für **Administratoren** zugänglich.

Pfad: `/admin/users`

---

## Übersicht

Als Administrator verwaltest du Benutzerkonten und Zugriffsrechte.

---

## Benutzer vs. Mitglieder

| Begriff | Beschreibung |
|---------|--------------|
| **Mitglied** | Person im Vereinsverzeichnis (Personen-Daten) |
| **Benutzer** | Login-Konto mit Systemzugang |

Jedes Mitglied kann ein Benutzerkonto haben, muss aber nicht. Ein Benutzer ist mit einem Mitglied verknüpft.

---

## Benutzerübersicht

### Aufrufen:
1. Gehe zu **"Admin"** → **"Benutzer"**
2. Die Liste aller Benutzerkonten wird angezeigt

### Angezeigte Informationen:

| Spalte | Beschreibung |
|--------|--------------|
| **E-Mail** | Login-E-Mail |
| **Mitglied** | Verknüpftes Mitglied |
| **Rolle** | System-Rolle |
| **Status** | Aktiv / Gesperrt |
| **Letzter Login** | Zeitstempel der letzten Anmeldung |

---

## Systemrollen

| Rolle | Beschreibung | Berechtigungen |
|-------|--------------|----------------|
| **ADMIN** | Administrator | Voller Systemzugang inkl. Admin-Bereich |
| **VORSTAND** | Vereinsvorstand | Verwaltung, Events, Mitglieder, Helferliste |
| **MITGLIED_AKTIV** | Aktives Mitglied | Anmeldungen, Proben, Stundenkonto |
| **MITGLIED_PASSIV** | Passives Mitglied | Eingeschränkter Zugang |
| **HELFER** | Externer Helfer | Dashboard, eigenes Profil |
| **PARTNER** | Partner-Kontakt | Partner-Portal |
| **FREUNDE** | Vereinsfreunde | Willkommensseite, Veranstaltungen |

### Rolle ändern:
1. Öffne den Benutzer
2. Wähle die neue Rolle
3. Speichere
4. Die Berechtigungen werden sofort aktualisiert

---

## Passwort verwalten

### Passwort-Reset per E-Mail:
1. Finde den Benutzer in der Liste
2. Klicke auf **"Passwort zurücksetzen"**
3. Der Benutzer erhält eine E-Mail mit Reset-Link

### Manuelles Passwort setzen (Vorstand und Admin):
1. Öffne den Benutzer
2. Klicke auf **"Passwort setzen"**
3. Gib das neue Passwort ein
4. Teile es dem Benutzer sicher mit

> Vorstand-Mitglieder können ebenfalls Passwörter für andere Benutzer setzen — dies ist über das Mitgliederprofil unter `/mitglieder` möglich.

---

## Benutzer sperren und entsperren

### Konto sperren:
1. Öffne den Benutzer
2. Klicke auf **"Konto sperren"**
3. Bestätige die Aktion

Gesperrte Benutzer können sich nicht mehr anmelden. Ihre Daten bleiben erhalten.

### Konto entsperren:
1. Öffne den gesperrten Benutzer
2. Klicke auf **"Entsperren"**

---

## Benutzer löschen

> **Warnung:** Diese Aktion kann nicht rückgängig gemacht werden!

Das Löschen eines Benutzers entfernt den Login-Zugang dauerhaft. Mitgliedsdaten in der Vereinsverwaltung bleiben erhalten.

Empfehlung: Sperren statt Löschen — für die Nachvollziehbarkeit und falls der Benutzer später wieder Zugang benötigt.

---

## Häufige Fragen

### Ein Benutzer kann sich nicht anmelden
1. Prüfe, ob das Konto gesperrt ist
2. Prüfe die E-Mail-Adresse (Tippfehler?)
3. Sende einen Passwort-Reset oder setze das Passwort manuell

### Wie entferne ich Admin-Rechte?
Ändere die Rolle auf `VORSTAND` oder eine niedrigere Rolle. Es sollte immer mindestens ein Administrator-Konto aktiv bleiben.

### Kann ich mein eigenes Admin-Konto löschen?
Nein — als einziger Administrator ist das nicht möglich. Ein zweiter Admin muss die Aktion durchführen.

---

*Weiter zu: [E-Mail-Logs](./email-logs.md)*
