# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Skills-basierte Schicht-Vorschlaege und Produktions-Dashboard (#347, #348)
- Fallback-Email auf theatergruppewiden@gmail.com aktualisiert

### Removed
- `/helferliste` Admin-Modul entfernt, ersetzt durch `/mitmachen` (#355)

## [0.9.0] - 2026-02-17

### Added
- **Proben-Teilnehmer aus Besetzung auto-befuellen** (#345): Vorschau-Dialog mit Select/Deselect-All, Rollen-Anzeige, Konflikt-Pruefung und Duplikat-Erkennung
- **Zentrale Personen-Einsatzuebersicht** (#346): 5 Quellen (Anmeldungen, Schichtzuweisungen, Proben, Helfer-Anmeldungen, Helferschichten), Verfuegbarkeiten als FullCalendar-Hintergrund-Layer, Management-Ansicht
- **Besetzung zu Auffuehrungs-Zuweisungen** (#344): Automatische Generierung mit Vorschau, neuer Status `vorgeschlagen`, Batch-Insert mit Duplikat-Sicherheit
- **Verfuegbarkeitskonflikt-Erkennung** (#343): DB-Funktion `check_person_conflicts()`, Cross-System-Konflikterkennung in Schichtzuweisung, Proben und Helfereinsaetzen
- **Onboarding-Flow** (#328): 2-Schritt Wizard nach erstem Login, `onboarding_completed` auf profiles, Middleware-Redirect zu `/willkommen`
- **Profilvervollstaendigungs-Checkliste** auf Dashboard
- **Einsaetze-Widget** auf Dashboard aktiviert
- Auth Callback und Confirm Routes fuer Magic Link Login (#340)

### Changed
- Person Auto-Link Lookup verwendet jetzt Admin Client um RLS zu umgehen (#339)
- Spaltenname `geburtsdatum` zu `geburtstag` korrigiert in Dashboard-Query (#341)

### Fixed
- Invite Trigger Chain Failure behoben durch Verschiebung von Profile-Linking in App-Code (#336)
- `getDefaultAppRole` in Utility-Datei verschoben fuer Build-Fix (#335)
- Duplikat-Timestamp Migrationen idempotent gemacht

## [0.8.0] - 2026-02-16

### Added
- **Branded Einladungs-Email** via SMTP mit Supabase-Fallback (#333)
- **Bulk-Einladung** von der Mitglieder-Liste (#327)
- **Einladungs-Tracking** mit Resend-Funktion (#325)
- **Einladungs-Aktion** fuer bestehende Mitglieder ohne App-Zugang (#324)
- **Vorstand "Mein Bereich"** (#323): `/vorstand/termine`, `/vorstand/stundenkonto`, `/vorstand/einsaetze`
- **Authentifiziertes Helfer-Dashboard** (#318): `/meine-einsaetze` fuer HELFER-Rolle
- **Dashboard-Konsolidierung** (#317): Einheitliche Startseite fuer alle Rollen (ADMIN/VORSTAND/MITGLIED_AKTIV/MITGLIED_PASSIV)
- **Delete-Funktion** in Alle-Helfer-Liste
- Go-Live-Strategie Dokumentation (#322)

### Changed
- Stundenkonto aus MITGLIED_AKTIV Dashboard entfernt, nur noch fuer ADMIN/VORSTAND (#323)
- `/mein-bereich` leitet jetzt auf `/dashboard` weiter
- Vorstand-Dashboard mit "Mitglieder-Ansicht" Toggle
- 43 veraltete Remote-Branches geloescht

### Fixed
- Unbenutzte HelferEinsaetzeWidget Import aus Dashboard entfernt

## [0.7.0] - 2026-02-05

### Added
- **Template-Editor vollstaendig editierbar**:
  - Inline-Edit fuer Info-Bloecke (#308): Titel, Beschreibung, Start/Endzeit
  - Inline-Edit fuer Sachleistungen (#309): Name, Anzahl, Beschreibung
  - Inline-Edit fuer Ressourcen (#310): Menge editierbar
  - `nur_mitglieder`-Flag fuer Template-Schichten (#307)
- Feste `startzeit/endzeit` statt Offset-basierter Zeiten (#306)

### Fixed
- **Zod v4 UUID-Validierung** (#311-#315): Relaxte Regex fuer Seed-UUIDs statt strikter RFC 4122
- Sachleistungen Template-ID explizit uebergeben
- Admin Template Path Revalidation und Error Handling

## [0.6.0] - 2026-01-28

### Added
- **Helferliste Feature** vollstaendig implementiert:
  - 4 DB-Tabellen mit RLS Policies (`helfer_events`, `helfer_rollen_templates`, `helfer_rollen_instanzen`, `helfer_anmeldungen`)
  - Server Actions fuer Events, Rollen, Anmeldungen und Templates
  - Admin-Seiten: Events-Liste, Event-Details, Rollen-Management, Templates
  - Oeffentliche Helfer-Ansicht mit Token-basiertem Zugang
  - Double-Booking/Overlap Prevention
  - Public Link Generation
  - 12 UI-Komponenten in `components/helferliste/`
- **Template-System Erweiterung** (#171):
  - Neue DB-Tabellen: `template_info_bloecke`, `info_bloecke`, `template_sachleistungen`, `sachleistungen`
  - Offset-basiertes Zeitsystem (spaeter ersetzt durch feste Zeiten)
  - Seed-Daten: "Abendvorstellung" Template
- SMTP-Konfiguration und Email-Versand fuer Helfer-Registrierung
- Email-Buchungsbestaetigungen fuer Auffuehrungen

## [0.5.0] - 2026-01-24

### Added
- **Modul 3 - Kuenstlerische Planung**:
  - Stuecke, Szenen und Rollen strukturieren (#101)
  - Besetzung verwalten (#102)
  - Probenplanung mit kuenstlerischen Funktionen (#103)
- **Modul 2 - Operative Auffuehrungslogistik**:
  - Auffuehrungen mit Zeitbloecken planen (#97)
  - Ressourcen und Raeume verwalten (#98)
  - Einsatz-Templates fuer wiederkehrende Ablaeufe (#99)

## [0.4.0] - 2026-01-20

### Added
- **Modul 1 - Vereinsleben & Helfereinsaetze**:
  - Vereinsevents verwalten (#93)
  - Externe Helfereinsaetze abbilden (#94)
  - Persoenliche Einsatz- und Kalenderuebersicht (#95)

## [0.3.0] - 2026-01-18

### Added
- **UserExperience Milestone**:
  - Navigation-Konfiguration zentralisiert (#137)
  - Rollenbasierte Redirects (#138)
  - Sidebar-Komponente (#139)
  - Header-Komponente (#140)
  - Layout-Struktur fuer Bereiche (#141)

## [0.2.0] - 2026-01-16

### Added
- Rollenmanagement und Permissions implementiert (#90)
- 7-Rollen-System: ADMIN, VORSTAND, MITGLIED_AKTIV, MITGLIED_PASSIV, HELFER, PARTNER, FREUNDE
- Permission-Matrix mit `hasPermission()`, `isManagement()`, `isAdmin()`
- Server-side Authorization mit `requirePermission()`

## [0.1.0] - 2026-01-15

### Added
- Benutzerverwaltung, Profilseiten und Health-Check (#1)
- Projekt-Grundstruktur: Next.js 15 App Router, Supabase, Tailwind CSS
- Monorepo-Setup mit `apps/web/`
- Supabase Auth mit SSR Adapter
- Basis-Layout und Navigation
- Middleware fuer Route Protection
