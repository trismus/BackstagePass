# Benutzerverwaltung (Admin)

> **Hinweis:** Dieser Bereich ist nur für **Administratoren** zugänglich.

---

## Übersicht

Als Administrator verwaltest du Benutzerkonten, Berechtigungen und Systemzugang.

---

## Benutzer vs. Mitglieder

| Begriff | Beschreibung |
|---------|--------------|
| **Mitglied** | Person im Vereinsverzeichnis |
| **Benutzer** | Login-Konto mit Systemzugang |

Jedes Mitglied kann ein Benutzerkonto haben, muss aber nicht.

---

## Benutzerübersicht

### Aufrufen:
1. Gehe zu **"Admin"** → **"Benutzer"**
2. Die Liste aller Benutzerkonten wird angezeigt

### Spalten:

| Spalte | Beschreibung |
|--------|--------------|
| **E-Mail** | Login-E-Mail |
| **Mitglied** | Verknüpftes Mitglied |
| **Rolle** | System-Rolle |
| **Status** | Aktiv/Gesperrt |
| **Letzter Login** | Wann zuletzt angemeldet |

---

## Benutzerrollen

### Systemrollen:

| Rolle | Beschreibung | Berechtigungen |
|-------|--------------|----------------|
| **ADMIN** | Administrator | Voller Systemzugang |
| **VORSTAND** | Vereinsvorstand | Verwaltung, Events, Mitglieder |
| **MITGLIED_AKTIV** | Aktives Mitglied | Anmeldungen, Proben, Stundenkonto |
| **MITGLIED_PASSIV** | Passives Mitglied | Eingeschränkter Zugang |
| **HELFER** | Externer Helfer | Nur Helfereinsätze |
| **PARTNER** | Partner-Kontakt | Partner-Bereich |
| **FREUNDE** | Vereinsfreunde | Minimaler Zugang |

### Rolle ändern:
1. Öffne den Benutzer
2. Wähle die neue Rolle
3. Speichere
4. Die Berechtigungen werden sofort aktualisiert

---

## Benutzer erstellen

### Manuell:
1. Gehe zu **"Admin"** → **"Benutzer"**
2. Klicke auf **"Neuer Benutzer"**
3. Gib die E-Mail-Adresse ein
4. Wähle die Rolle
5. Optional: Verknüpfe mit Mitglied
6. Klicke auf **"Erstellen"**

### Automatisch (bei Mitglied-Erstellung):
- Beim Anlegen eines Mitglieds wird automatisch ein Benutzerkonto erstellt
- Das Mitglied erhält eine Einladungs-E-Mail

---

## Passwort zurücksetzen

### Für einen Benutzer:
1. Finde den Benutzer in der Liste
2. Klicke auf **"Passwort zurücksetzen"**
3. Der Benutzer erhält eine E-Mail mit Reset-Link

### Manuelles Passwort setzen:
1. Öffne den Benutzer
2. Klicke auf **"Passwort setzen"**
3. Gib das neue Passwort ein
4. Teile es dem Benutzer mit (sicher!)

---

## Benutzer sperren

Bei Problemen oder Austritten:

1. Öffne den Benutzer
2. Klicke auf **"Konto sperren"**
3. Gib optional einen Grund an
4. Bestätige

### Auswirkungen:
- Benutzer kann sich nicht mehr anmelden
- Laufende Sitzungen werden beendet
- Daten bleiben erhalten

### Konto entsperren:
1. Öffne den gesperrten Benutzer
2. Klicke auf **"Entsperren"**
3. Der Benutzer kann sich wieder anmelden

---

## Benutzer löschen

> **Warnung:** Diese Aktion kann nicht rückgängig gemacht werden!

1. Öffne den Benutzer
2. Klicke auf **"Löschen"**
3. Bestätige zweimal
4. Das Konto wird dauerhaft entfernt

### Besser: Sperren statt Löschen
- Für die Historie
- Falls später erneut Zugang benötigt wird

---

## Anmeldungen überwachen

### Login-Historie:
1. Öffne einen Benutzer
2. Gehe zu **"Anmeldungen"**
3. Sieh alle Login-Versuche:
   - Datum und Uhrzeit
   - IP-Adresse
   - Erfolg/Misserfolg

### Verdächtige Aktivitäten:
- Mehrere fehlgeschlagene Logins
- Unbekannte IP-Adressen
- Logins zu ungewöhnlichen Zeiten

---

## Massenoperationen

### Mehrere Benutzer bearbeiten:
1. Markiere die Benutzer
2. Wähle die Aktion:
   - Rolle ändern
   - Sperren
   - E-Mail senden

### Einladungen erneut senden:
- Für alle Benutzer, die sich noch nie angemeldet haben

---

## Häufige Fragen

### Ein Benutzer kann sich nicht anmelden
1. Prüfe, ob das Konto gesperrt ist
2. Prüfe die E-Mail-Adresse
3. Sende einen Passwort-Reset

### Wie entferne ich Admin-Rechte?
- Ändere die Rolle auf "VORSTAND" oder niedriger
- Es muss mindestens ein Admin bleiben

### Kann ich mein eigenes Konto löschen?
- Nein, nicht als einziger Admin
- Ein anderer Admin muss es tun

---

*Weiter zu: [Systemeinstellungen](./einstellungen.md)*
