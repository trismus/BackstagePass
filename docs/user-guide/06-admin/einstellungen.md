# Systemeinstellungen

> **Hinweis:** Dieser Bereich ist nur für **Administratoren** zugänglich.

---

## Übersicht

In den Systemeinstellungen konfigurierst du das gesamte System.

---

## Vereinseinstellungen

### Grunddaten:

| Einstellung | Beschreibung |
|-------------|--------------|
| **Vereinsname** | Name des Vereins |
| **Logo** | Vereinslogo für Header |
| **Adresse** | Offizielle Vereinsadresse |
| **E-Mail** | Kontakt-E-Mail |
| **Website** | Vereinswebsite |

### So änderst du die Daten:
1. Gehe zu **"Admin"** → **"Einstellungen"**
2. Wähle **"Vereinsdaten"**
3. Ändere die gewünschten Felder
4. Speichere

---

## Stundenkonto-Einstellungen

### Soll-Stunden definieren:

| Einstellung | Beschreibung |
|-------------|--------------|
| **Soll-Stunden pro Jahr** | Mindestbeitrag in Stunden |
| **Gilt für** | Welche Rollen haben Soll-Stunden |
| **Übertrag** | Werden Überstunden übertragen |

### Konfiguration:
1. Gehe zu **"Einstellungen"** → **"Stundenkonto"**
2. Setze die Soll-Stunden (z.B. 20h/Jahr)
3. Wähle die betroffenen Mitglieder-Typen
4. Aktiviere/Deaktiviere Übertrag
5. Speichere

---

## E-Mail-Einstellungen

### Absender konfigurieren:

| Einstellung | Beschreibung |
|-------------|--------------|
| **Absender-Name** | z.B. "Theatergruppe Widen" |
| **Absender-E-Mail** | noreply@... oder info@... |
| **Antwort-Adresse** | Wohin gehen Antworten |

### E-Mail-Vorlagen:

Anpassbare Vorlagen für:
- Willkommens-E-Mail
- Passwort-Reset
- Event-Einladung
- Erinnerungen

### Vorlage bearbeiten:
1. Gehe zu **"Einstellungen"** → **"E-Mail-Vorlagen"**
2. Wähle die Vorlage
3. Bearbeite Text und Platzhalter
4. Teste mit **"Test-E-Mail senden"**
5. Speichere

---

## Benachrichtigungen

### Globale Einstellungen:

| Einstellung | Beschreibung |
|-------------|--------------|
| **Event-Erinnerungen** | Wie viele Tage vorher |
| **Proben-Erinnerungen** | Automatische Erinnerungen |
| **Wöchentliche Übersicht** | Zusammenfassung per E-Mail |

### Konfiguration:
1. Gehe zu **"Einstellungen"** → **"Benachrichtigungen"**
2. Aktiviere/Deaktiviere Optionen
3. Setze Zeiträume
4. Speichere

---

## Datenschutz

### Sichtbarkeitseinstellungen:

| Einstellung | Beschreibung |
|-------------|--------------|
| **Kontaktdaten** | Wer sieht Telefonnummern |
| **Adressen** | Wer sieht Adressen |
| **Geburtsdaten** | Wer sieht Geburtstage |

### Datenaufbewahrung:
- Wie lange werden Logs gespeichert
- Wann werden inaktive Konten gelöscht

---

## Integrationen

### Kalender-Export:
- iCal-Feed aktivieren/deaktivieren
- Öffentlicher vs. privater Kalender

### Geplante Integrationen:
- Google Calendar Sync
- Outlook Integration
- Slack-Benachrichtigungen

---

## Erscheinungsbild

### Theme:
| Option | Beschreibung |
|--------|--------------|
| **Hell** | Standardmäßig helles Design |
| **Dunkel** | Dunkles Design |
| **System** | Folgt Systemeinstellung |

### Farbschema:
- Primärfarbe anpassen
- Akzentfarbe wählen
- Logo-Platzierung

---

## Wartung

### Wartungsmodus aktivieren:

Bei Updates oder Problemen:
1. Gehe zu **"Einstellungen"** → **"Wartung"**
2. Aktiviere den **Wartungsmodus**
3. Gib eine Nachricht für Benutzer ein
4. Speichere

### Auswirkungen:
- Nur Admins können sich anmelden
- Benutzer sehen Wartungsmeldung

---

## Backup & Daten

### Datenexport:
1. Gehe zu **"Einstellungen"** → **"Daten"**
2. Klicke auf **"Vollständiger Export"**
3. Wähle das Format (JSON, CSV)
4. Lade die Datei herunter

### Automatische Backups:
- Werden regelmässig erstellt
- Von Supabase verwaltet
- Bei Bedarf: Support kontaktieren

---

## Logs

### System-Logs:
- Fehler und Warnungen
- Performance-Metriken
- Debugging-Informationen

### Zugriff:
1. Gehe zu **"Admin"** → **"Logs"**
2. Filtere nach Zeitraum oder Typ
3. Analysiere Probleme

---

## Häufige Fragen

### Änderungen wirken nicht sofort
- Manche Einstellungen erfordern einen Cache-Clear
- Benutzer müssen sich ggf. neu anmelden

### Ich habe mich aus dem Admin-Bereich ausgesperrt
- Kontaktiere den Entwickler
- Zugang über Datenbank möglich

### Wie setze ich alles zurück?
- Nicht empfohlen
- Bei Bedarf: Entwickler kontaktieren

---

*Weiter zu: [Audit-Log](./audit-log.md)*
