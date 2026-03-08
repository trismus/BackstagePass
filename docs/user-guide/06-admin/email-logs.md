# E-Mail-Logs

> **Hinweis:** Dieser Bereich ist nur für **Administratoren** zugänglich.

Pfad: `/admin/email-logs`

---

## Übersicht

Die E-Mail-Logs protokollieren alle von BackstagePass versendeten E-Mails. So kann nachvollzogen werden, ob eine E-Mail erfolgreich zugestellt wurde oder ob es zu einem Fehler kam.

---

## Status-Typen

Jede E-Mail erhält einen der folgenden Status:

| Status | Bedeutung |
|--------|-----------|
| **Gesendet** | E-Mail wurde erfolgreich an den SMTP-Server übergeben |
| **Fehlgeschlagen** | Versand ist gescheitert |
| **Ausstehend** | E-Mail wartet auf Verarbeitung |
| **Wiederholung** | Erneuter Versuchsversand nach einem Fehler |

---

## E-Mail-Logs aufrufen

1. Gehe zu **"Admin"** → **"E-Mail Logs"**
2. Die Liste der zuletzt versendeten E-Mails wird angezeigt, neueste zuerst

### Angezeigte Informationen:

- **Zeitstempel** - Wann die E-Mail versendet wurde
- **Empfänger** - An wen die E-Mail ging
- **Betreff** - E-Mail-Betreff
- **Typ** - Art der E-Mail (z.B. Bestätigung, Einladung, Passwort-Reset)
- **Status** - Versandstatus (siehe oben)

---

## E-Mail-Typen

BackstagePass versendet folgende Arten von E-Mails:

| Typ | Auslöser |
|-----|---------|
| Bestätigung Helfer-Anmeldung | Helfer meldet sich für Helfereinsatz an |
| Helfer-Einladung | Helfer wird einem Einsatz zugewiesen |
| Wartelisten-Benachrichtigung | Platz auf der Warteliste wird frei |
| Passwort-Reset | Benutzer fordert Passwort-Reset an |
| Einladungs-E-Mail | Neues Mitglied wird angelegt |
| Event-Bestätigung | Anmeldung zu Veranstaltung bestätigt |

---

## Fehlgeschlagene E-Mails

Wenn eine E-Mail den Status "Fehlgeschlagen" hat:

1. Prüfe die E-Mail-Adresse des Empfängers auf Tippfehler
2. Prüfe ob die Domain des Empfängers erreichbar ist
3. Bei wiederholten Fehlern: Wende dich an den Entwickler (SMTP-Konfiguration)

---

## Häufige Fragen

### Kann ich eine fehlgeschlagene E-Mail erneut senden?
Aktuell ist kein manueller Retry über die Oberfläche möglich. Kontaktiere den Administrator für manuelle Massnahmen.

### Wie lange werden E-Mail-Logs aufbewahrt?
E-Mail-Logs werden gemäss der Datenschutzrichtlinie aufbewahrt (Audit-Logs: 1 Jahr). Ältere Einträge können archiviert werden.

### Wer sieht die E-Mail-Logs?
Nur Administratoren. Normale Mitglieder und Vorstand haben keinen Zugriff auf die Logs.

---

*Weiter zu: [Audit Log](./audit-log.md)*
