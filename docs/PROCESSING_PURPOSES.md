# Verarbeitungszwecke personenbezogener Daten

Dieses Dokument beschreibt die Zwecke der Datenverarbeitung gemaess DSGVO Art. 5(1)(c) (Datenminimierung) und Art. 13/14 (Informationspflichten).

## Uebersicht der verarbeiteten Datenkategorien

| Tabelle | Datenkategorie | Zweck | Rechtsgrundlage | Aufbewahrungsfrist |
|---------|----------------|-------|-----------------|-------------------|
| `personen` | Stammdaten | Mitgliederverwaltung | Art. 6(1)(b) Vertrag | Mitgliedschaft + 10 Jahre |
| `profiles` | Zugangsdaten | Authentifizierung | Art. 6(1)(b) Vertrag | Kontoloeschung + 30 Tage |
| `anmeldungen` | Teilnahmedaten | Veranstaltungsplanung | Art. 6(1)(b) Vertrag | 3 Jahre nach Veranstaltung |
| `stundenkonto` | Arbeitsstunden | Stundenabrechnung | Art. 6(1)(b) Vertrag | 10 Jahre (Vereinsrecht) |
| `audit_logs` | Protokolldaten | Nachweispflicht | Art. 6(1)(c) Rechtspflicht | 1 Jahr |

## Detaillierte Zweckbeschreibungen

### 1. Personenstammdaten (`personen`)

#### Erhobene Daten und Zwecke

| Feld | Zweck | Erforderlichkeit |
|------|-------|------------------|
| `vorname`, `nachname` | Identifikation, Anrede | Erforderlich |
| `email` | Kommunikation, Account-Verknuepfung | Erforderlich fuer App-Zugang |
| `telefon`, `telefon_nummern` | Dringende Kontaktaufnahme | Optional |
| `strasse`, `plz`, `ort` | Postversand (Einladungen, Rechnungen) | Optional |
| `geburtstag` | Gratulationen, Altersverifikation | Optional |
| `skills` | Einsatzplanung, Talentmanagement | Optional, Einwilligung |
| `rolle` | Organisationsstruktur | Erforderlich |
| `notfallkontakt_*` | Notfallmanagement bei Veranstaltungen | Optional |
| `profilbild_url` | Interne Wiedererkennung | Optional, Einwilligung |
| `biografie` | Programmheft, Website | Optional, Einwilligung |
| `social_media` | Vernetzung | Optional, Einwilligung |

#### Datenminimierung

- **Email**: Nur erforderlich bei App-Zugang. Mitglieder ohne App-Zugang benoetigen keine E-Mail.
- **Skills**: Nur bei aktiver Einwilligung zur Einsatzplanung.
- **Biografie/Profilbild**: Nur fuer oeffentliche Darstellung mit expliziter Zustimmung.

### 2. Benutzerprofil (`profiles`)

| Feld | Zweck | Erforderlichkeit |
|------|-------|------------------|
| `email` | Login-Identifikation | Erforderlich |
| `role` | Zugriffssteuerung (RBAC) | Erforderlich |
| `display_name` | Anzeige in der App | Optional |

### 3. Veranstaltungsanmeldungen (`anmeldungen`)

| Feld | Zweck | Erforderlichkeit |
|------|-------|------------------|
| `person_id` | Zuordnung Teilnehmer | Erforderlich |
| `veranstaltung_id` | Zuordnung Veranstaltung | Erforderlich |
| `status` | Planungssicherheit | Erforderlich |
| `notizen` | Organisatorische Hinweise | Optional |

### 4. Stundenkonto (`stundenkonto`)

| Feld | Zweck | Erforderlichkeit |
|------|-------|------------------|
| `person_id` | Zuordnung Mitglied | Erforderlich |
| `stunden` | Stundenerfassung | Erforderlich |
| `typ`, `beschreibung` | Nachvollziehbarkeit | Erforderlich |
| `erfasst_von` | Audit-Trail | Erforderlich |

### 5. Verfuegbarkeiten (`verfuegbarkeiten`)

| Feld | Zweck | Erforderlichkeit |
|------|-------|------------------|
| `mitglied_id` | Zuordnung | Erforderlich |
| `datum_von/bis` | Planungszeitraum | Erforderlich |
| `status` | Verfuegbarkeitsstatus | Erforderlich |
| `grund` | Planungsoptimierung | Optional |

### 6. Externe Helfer (`externe_helfer_profile`)

| Feld | Zweck | Erforderlichkeit |
|------|-------|------------------|
| `email` | Kommunikation | Erforderlich |
| `vorname`, `nachname` | Identifikation | Erforderlich |
| `telefon` | Dringende Kontaktaufnahme | Optional |
| `notizen` | Organisatorische Hinweise | Optional |

## Rechtsgrundlagen

### Art. 6(1)(a) - Einwilligung
- Profilbild-Upload
- Biografie fuer oeffentliche Darstellung
- Social-Media-Links
- Skills fuer erweiterte Einsatzplanung

### Art. 6(1)(b) - Vertragserfuellung
- Stammdaten fuer Mitgliedschaftsverwaltung
- Kontaktdaten fuer Vereinskommunikation
- Stundenkonto fuer Leistungserfassung
- Anmeldungen fuer Veranstaltungsplanung

### Art. 6(1)(c) - Rechtliche Verpflichtung
- Audit-Logs fuer Nachweispflichten
- Aufbewahrung von Finanzdaten (10 Jahre)

### Art. 6(1)(f) - Berechtigtes Interesse
- Notfallkontakte (Sicherheit der Teilnehmer)

## Aufbewahrungsfristen

| Datenkategorie | Frist | Grund |
|----------------|-------|-------|
| Aktive Mitgliederdaten | Waehrend Mitgliedschaft | Vertragserfuellung |
| Archivierte Mitglieder | 10 Jahre nach Austritt | Vereinsrechtliche Aufbewahrung |
| Stundenkonto | 10 Jahre | Vereinsrechtliche Dokumentation |
| Veranstaltungsanmeldungen | 3 Jahre | Nachweispflicht |
| Audit-Logs | 1 Jahr | DSGVO-Nachweispflicht |
| Geloeschte Konten | 30 Tage (Soft-Delete) | Wiederherstellungsoption |

## Technische Massnahmen zur Datenminimierung

### 1. Optionale Felder
Alle nicht zwingend erforderlichen Felder sind als `NULL`-able definiert:
```sql
telefon TEXT,  -- Optional
geburtstag DATE,  -- Optional
profilbild_url TEXT,  -- Optional, nur mit Einwilligung
```

### 2. Selektive Abfragen
Server-Actions sollen nur benoetigte Felder abfragen:
```typescript
// Gut: Nur benoetigte Felder
.select('id, vorname, nachname')

// Vermeiden: Alle Felder wenn nicht noetig
.select('*')
```

### 3. Anonymisierung
Bei Datenexport oder Archivierung werden personenbezogene Daten anonymisiert:
- Email -> `anonym_[hash]@example.com`
- Telefon -> `000-000-0000`
- Adresse -> `[geloescht]`

## Betroffenenrechte

### Art. 15 - Auskunftsrecht
Implementiert ueber: `GET /api/mein-bereich/datenauskunft`

### Art. 16 - Berichtigungsrecht
Implementiert ueber: Profil-Bearbeitung in `/mein-bereich`

### Art. 17 - Recht auf Loeschung
Implementiert ueber: Archivierungsfunktion mit anschliessender Loeschung nach Aufbewahrungsfrist

### Art. 20 - Datenportabilitaet
Implementiert ueber: Export-Funktion (JSON/CSV) in `/mein-bereich`

## Verantwortlichkeiten

| Rolle | Verantwortung |
|-------|---------------|
| ADMIN | Systemkonfiguration, Benutzerkonten |
| VORSTAND | Mitgliederverwaltung, Datenschutzanfragen |
| Datenschutzbeauftragter | DSGVO-Compliance, Dokumentation |

---

*Letzte Aktualisierung: 2026-02-05*
*Version: 1.0*
*Autor: BackstagePass Development Team*
