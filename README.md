# Argus

> **BackstagePass** -- Die digitale Plattform fuer die Theatergruppe Widen (TGW)

Dieses Repository enthaelt den Quellcode fuer **BackstagePass**, eine Web-Applikation zur Unterstuetzung des TGW bei Organisation, Kommunikation und Buehnenbetrieb. Der Projektname *Argus* steht fuer das wachsame Auge hinter den Kulissen.

## Was ist BackstagePass?

BackstagePass ist der digitale Backstage-Bereich fuer die Theatergruppe Widen -- ein zentraler Ort fuer:
- **Mitgliederverwaltung** -- Profile, Rollen, Einladungen, Onboarding
- **Veranstaltungen & Auffuehrungen** -- Events planen, Zeitbloecke, Schichten, Check-in
- **Kuenstlerische Planung** -- Stuecke, Szenen, Rollen, Besetzungen, Proben
- **Helfersystem** -- Helfer-Events, Rollen-Templates, oeffentliche Anmeldung, Mitmachen-Seite
- **Produktionen** -- Besetzungs-Management, Stab, Dokumente, Checklisten
- **Kalender & Termine** -- Persoenlicher Kalender, iCal-Export, Verfuegbarkeiten
- **Templates** -- Wiederverwendbare Auffuehrungs-Templates mit Zeitbloecken und Schichten
- **Raeume & Ressourcen** -- Raumverwaltung und Geraete-Reservierungen
- **Partner-Portal** -- Externe Partnerorganisationen verwalten
- **Admin-Bereich** -- Benutzerverwaltung, Audit-Logs, Email-Templates, Gruppen

## Inhalt
- [Aktueller Status](#aktueller-status)
- [Tech Stack](#tech-stack)
- [Projekt-Setup](#projekt-setup)
- [Arbeitsweise](#arbeitsweise)
- [Kanban](#kanban)
- [Infrastruktur](#infrastruktur)
- [Module (Detailkonzept)](docs/backstagepass-module-details.md)

## Aktueller Status

| Komponente | Status | Link |
|------------|--------|------|
| GitHub Issues | Aktiv | [Issues](https://github.com/trismus/BackstagePass/issues) |
| Project Board | Aktiv | [Kanban](https://github.com/users/trismus/projects/2/views/1) |
| Vercel | Produktiv | Dashboard |
| Supabase | Integriert | via Vercel Integration |

**Stand:** 2026-02-23 | **Commits:** 77 | **Migrationen:** 78

### Aktuelle Features (Feb 2026)

**Kern-Module:**
- Dashboard-Konsolidierung -- Einheitliche Startseite fuer alle Rollen
- Mitgliederverwaltung -- Profile, Einladungen (einzeln + bulk), Tracking, Resend
- Veranstaltungen -- Events mit Anmeldungen, Kalender-Ansicht
- Auffuehrungen -- Zeitbloecke, Schichten, Check-in, Live-Board, Helfer-Koordination
- Kuenstlerische Planung -- Stuecke, Szenen, Rollen, Besetzungen, Probenplanung
- Produktionen -- Besetzungs-Management, Stab, Dokumente

**Helfer-System:**
- Mitmachen-Seite -- Oeffentliches Helfer-Portal (ersetzt /helferliste)
- Oeffentliche Helfer-Registrierung -- Token-basiert mit An-/Abmeldung, Feedback, Warteliste
- Helfer-Dashboard -- Persoenliche Einsatzuebersicht fuer externe Helfer

**Intelligente Features:**
- Cross-System Konflikterkennung -- Verfuegbarkeiten, Schichten, Proben, Helfereinsaetze
- Auto-Generierung -- Besetzung zu Auffuehrungs-Zuweisungen, Proben-Teilnehmer aus Besetzung
- Skills-basierte Schicht-Vorschlaege
- Verfuegbarkeiten-Layer im Kalender

**Infrastruktur:**
- Template-System -- Vollstaendig editierbare Auffuehrungs-Templates
- Email-Integration -- Branded SMTP-Versand fuer Einladungen und Bestaetigungen
- Onboarding-Flow -- 2-Schritt Wizard nach erstem Login
- Rollenbasierte Navigation -- Dynamische Sidebar mit Berechtigungspruefung
- 7-Rollen-System -- ADMIN, VORSTAND, MITGLIED_AKTIV, MITGLIED_PASSIV, HELFER, PARTNER, FREUNDE
- iCal-Export -- Persoenliche Termine als Kalender-Feed

**Naechste Schritte:** Personen-Detailseite mit Einsatzhistorie, Verfuegbarkeiten bei Produktionsplanung, Partner-Portal, Passive Mitglieder Ansicht

## Tech Stack

| Schicht | Technologie |
|---------|------------|
| **Frontend** | Next.js 15 (App Router), React 19, TypeScript 5.7 |
| **Backend** | Supabase (PostgreSQL + Auth mit SSR Adapter) |
| **Styling** | Tailwind CSS mit Custom Theater-Farbpalette |
| **Validierung** | Zod (Runtime Schema Validation) |
| **Hosting** | Vercel |
| **Email** | SMTP (Nodemailer) mit Supabase-Fallback |

## Projekt-Setup

```bash
# Repository klonen
git clone https://github.com/trismus/BackstagePass.git
cd BackstagePass/apps/web

# Dependencies installieren
npm install

# Environment-Variablen konfigurieren
cp .env .env.local
# NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY eintragen

# Development Server starten
npm run dev
```

Weitere Konfiguration:
- Editor- und Stilregeln: siehe `.editorconfig`
- Git-Konventionen: siehe `.gitattributes` und `.gitignore`
- Zusammenarbeit: siehe `CONTRIBUTING.md` und `CODE_OF_CONDUCT.md`
- Pull Requests: Vorlage in `.github/PULL_REQUEST_TEMPLATE.md`
- Issues: Templates in `.github/ISSUE_TEMPLATE/`
- AI-Richtlinien: siehe `CLAUDE.md`

## Arbeitsweise
- Plane Arbeit als kleine, ueberpruefbare Einheiten (Issues/Tasks)
- Nutze Labels fuer Prioritaet und Status (z.B. `prio:high`, `status:in-progress`)
- Jede Aenderung erfolgt via Pull Request und Review
- Commit-Konvention: `feat:`, `fix:`, `docs:`, `chore:`

## Kanban
Das Kanban-Board findest du hier: [`docs/kanban.md`](docs/kanban.md)

**Live-Board:** https://github.com/users/trismus/projects/2/views/1

## Infrastruktur

| Service | Zweck | Status |
|---------|-------|--------|
| **Vercel** | Hosting & Deployments | Aktiv |
| **Supabase** | Datenbank & Auth | Integriert |
| **GitHub** | Code & Issues | Aktiv |
| **SMTP** | Email-Versand | Konfiguriert |

Env Vars werden automatisch via Supabase-Vercel Integration gesynct.

## Dokumentation

| Dokument | Beschreibung |
|----------|-------------|
| [`CLAUDE.md`](CLAUDE.md) | AI-Richtlinien und Codebase-Guide |
| [`CHANGELOG.md`](CHANGELOG.md) | Aenderungsprotokoll |
| [`docs/architecture/`](docs/architecture/) | System-Architektur |
| [`docs/team.md`](docs/team.md) | AI-Team Workflow |
| [`docs/milestones/`](docs/milestones/) | Milestone-Planung |
| [`docs/user-guide/`](docs/user-guide/) | Benutzerhandbuch |
| [`journal/`](journal/) | Entwicklungs-Journal und Entscheidungen |
