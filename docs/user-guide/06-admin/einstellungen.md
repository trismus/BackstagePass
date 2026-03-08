# Systemeinstellungen

> **Hinweis:** Dieser Bereich ist nur für **Administratoren** zugänglich.

---

## Übersicht

Systemeinstellungen werden derzeit über die Supabase-Datenbank und die Deployment-Konfiguration (Vercel) verwaltet. Eine eigene Einstellungsseite in der App ist nicht verfügbar.

Bei Bedarf an Konfigurationsänderungen (z.B. E-Mail-Absender, SMTP, Datenbankwerte) wende dich an den Entwickler.

---

## E-Mail-Konfiguration

Der E-Mail-Versand nutzt Gmail SMTP. Die Konfiguration erfolgt über Umgebungsvariablen in Vercel. Änderungen am Absender-Namen oder der Absender-Adresse erfordern einen Eingriff auf Deployment-Ebene.

---

## Datenschutz und Aufbewahrungsfristen

Die Aufbewahrungsfristen für Benutzerdaten sind in der [Datenschutzerklärung](https://backstage-pass.vercel.app/datenschutz) festgelegt:

| Datentyp | Aufbewahrung |
|----------|--------------|
| Mitglieder-Daten | Mitgliedschaft + 3 Jahre nach Austritt |
| Externe Helfer | Bis 2 Jahre nach letzter Anmeldung |
| Audit-Logs | 1 Jahr |
| Session-Cookies | 30 Tage Inaktivität oder bei Abmeldung |

---

## Backup

Automatische Datenbankbackups werden von Supabase verwaltet. Bei Bedarf an einem Daten-Restore wende dich an den Entwickler.

---

## Häufige Fragen

### Ich muss die Vereinskontaktdaten anpassen
Kontaktdaten (E-Mail, Website) sind aktuell fest in der App hinterlegt:
- E-Mail: theatergruppewiden@gmail.com
- Website: https://www.theater-widen.ch

Änderungen erfordern einen Code-Deployment durch den Entwickler.

### Ich habe mich aus dem Admin-Bereich ausgesperrt
Kontaktiere den Entwickler. Der Zugang kann direkt über die Datenbank wiederhergestellt werden.

---

*Weiter zu: [Audit-Log](./audit-log.md)*
