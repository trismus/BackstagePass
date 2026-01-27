# Audit-Log

> **Hinweis:** Dieser Bereich ist nur für **Administratoren** zugänglich.

---

## Übersicht

Das Audit-Log protokolliert alle wichtigen Aktionen im System. Es dient der Nachvollziehbarkeit und Sicherheit.

---

## Was wird protokolliert?

### Benutzeraktionen:

| Aktion | Beschreibung |
|--------|--------------|
| **Login** | Erfolgreiche Anmeldungen |
| **Login fehlgeschlagen** | Fehlversuche |
| **Logout** | Abmeldungen |
| **Passwort geändert** | Passwortänderungen |

### Datenbankaktionen:

| Aktion | Beschreibung |
|--------|--------------|
| **Erstellt** | Neue Einträge (Mitglieder, Events, etc.) |
| **Geändert** | Bearbeitungen |
| **Gelöscht** | Löschungen |

### Admin-Aktionen:

| Aktion | Beschreibung |
|--------|--------------|
| **Rolle geändert** | Berechtigungsänderungen |
| **Konto gesperrt** | Kontosperrungen |
| **Einstellung geändert** | Systemeinstellungen |

---

## Audit-Log aufrufen

### So greifst du darauf zu:

1. Gehe zu **"Admin"** → **"Audit-Log"**
2. Die neuesten Einträge werden angezeigt

### Spalten:

| Spalte | Beschreibung |
|--------|--------------|
| **Zeitstempel** | Wann die Aktion stattfand |
| **Benutzer** | Wer hat die Aktion ausgeführt |
| **Aktion** | Was wurde gemacht |
| **Objekt** | Was wurde verändert |
| **Details** | Zusätzliche Informationen |

---

## Logs filtern

### Nach Zeitraum:
- Heute
- Letzte 7 Tage
- Letzter Monat
- Benutzerdefiniert

### Nach Benutzer:
1. Klicke auf **"Filter"**
2. Wähle **"Benutzer"**
3. Suche nach Name oder E-Mail

### Nach Aktionstyp:
- Login/Logout
- Erstellung
- Änderung
- Löschung
- Admin-Aktion

### Nach Objekt:
- Mitglieder
- Events
- Proben
- Einstellungen

---

## Log-Details ansehen

### So siehst du Details:

1. Finde den Eintrag
2. Klicke auf **"Details"** oder die Zeile
3. Sieh alle Informationen:
   - Vorher/Nachher-Werte
   - IP-Adresse
   - Browser/Gerät

### Beispiel:

```
Zeitstempel: 27.01.2026 14:32:15
Benutzer: admin@tgw.ch
Aktion: Mitglied geändert
Objekt: Max Mustermann (ID: 123)
Änderungen:
  - Rolle: MITGLIED_AKTIV → VORSTAND
  - Status: Passiv → Aktiv
IP: 192.168.1.100
Browser: Chrome 120
```

---

## Logs exportieren

### So exportierst du Logs:

1. Setze die gewünschten Filter
2. Klicke auf **"Exportieren"**
3. Wähle das Format:
   - CSV (für Analysen)
   - PDF (für Dokumentation)
   - JSON (für technische Auswertung)
4. Lade die Datei herunter

---

## Sicherheitsrelevante Ereignisse

### Besonders beachten:

- **Mehrere fehlgeschlagene Logins** - Möglicher Angriff
- **Login von unbekannter IP** - Ungewöhnlicher Zugriff
- **Admin-Aktionen** - Kritische Änderungen
- **Massenänderungen** - Automatisierte Aktionen

### Benachrichtigungen:

Optionale Alerts bei:
- Mehr als 5 fehlgeschlagene Logins
- Admin-Rolle geändert
- Einstellungen verändert

---

## Aufbewahrung

### Log-Retention:

| Log-Typ | Aufbewahrungsdauer |
|---------|-------------------|
| **Login-Logs** | 90 Tage |
| **Datenänderungen** | 1 Jahr |
| **Admin-Aktionen** | 2 Jahre |
| **Sicherheits-Events** | 2 Jahre |

### Alte Logs:
- Werden automatisch archiviert
- Bei Bedarf: Anfrage an Admin
- Vollständige Löschung nach Aufbewahrungsfrist

---

## Compliance

Das Audit-Log unterstützt:

- **DSGVO-Anforderungen** - Nachvollziehbarkeit von Datenänderungen
- **Vereinsrecht** - Dokumentation von Beschlüssen
- **Interne Revision** - Kontrolle der Admin-Tätigkeiten

---

## Häufige Fragen

### Kann ich Logs löschen?
- Nein, Audit-Logs sind unveränderlich
- Dies dient der Integrität

### Wer kann Logs sehen?
- Nur Administratoren
- Keine Weitergabe an normale Benutzer

### Wie lange werden Logs gespeichert?
- Siehe Aufbewahrungsfristen oben
- Konfigurierbar in Einstellungen

### Ich finde einen bestimmten Eintrag nicht
- Prüfe den Zeitraum-Filter
- Nutze die Suche
- Prüfe den Aktionstyp-Filter

---

## Best Practices

### Regelmässige Überprüfung:
- Wöchentlich: Login-Anomalien
- Monatlich: Admin-Aktionen
- Quartalsweise: Vollständiger Review

### Bei Verdacht:
1. Filtere nach betroffenen Zeitraum
2. Prüfe alle Aktionen
3. Dokumentiere Erkenntnisse
4. Ergreife Massnahmen

---

*Zurück zur [Übersicht](../README.md)*
