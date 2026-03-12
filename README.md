# Argus

> **BackstagePass** – Die digitale Plattform für die Theatergruppe Widen (TGW)

Dieses Repository enthält den Quellcode für **BackstagePass**, eine Web-Applikation zur Unterstützung des TGW bei Organisation, Kommunikation und Bühnenbetrieb. Der Projektname *Argus* steht für das wachsame Auge hinter den Kulissen.

## Was ist BackstagePass?

BackstagePass ist der digitale Backstage-Bereich für die Theatergruppe Widen – ein zentraler Ort für:
- Benutzerverwaltung und Profile
- Rollenmanagement
- Probenplanung und Terminkoordination
- Kommunikation zwischen Ensemble und Crew
- Dokumentation und Ressourcenverwaltung
- Alles, was hinter der Bühne passiert

## Inhalt
- [Aktueller Status](#aktueller-status)
- [Projekt-Setup](#projekt-setup)
- [Arbeitsweise](#arbeitsweise)
- [Kanban](#kanban)
- [Infrastruktur](#infrastruktur)
- [Module (Detailkonzept)](docs/backstagepass-module-details.md)

## Aktueller Status

| Komponente | Status | Link |
|------------|--------|------|
| GitHub Issues | ✅ Aktiv | [Issues](https://github.com/trismus/BackstagePass/issues) |
| Project Board | ✅ Aktiv | [Kanban](https://github.com/users/trismus/projects/2/views/1) |
| Vercel | ✅ Produktiv | Dashboard |
| Supabase | ✅ Integriert | via Vercel Integration |

**Stand:** 2026-02-16 | **Issues:** 36 Open, 40 Closed

### Aktuelle Features (Feb 2026)

✅ **Dashboard-Konsolidierung** – Einheitliche Startseite für alle Rollen (Admin, Vorstand, Mitglieder, Helfer)
✅ **Template-System** – Vollständig editierbare Aufführungs-Templates mit Zeitblöcken, Schichten, Info-Blöcken, Sachleistungen
✅ **Helferliste** – Strukturierte Planung und Besetzung von Helferrollen mit öffentlichem Anmeldesystem
✅ **Helfer-Dashboard** – Persönliche Einsatzübersicht für externe Helfer
✅ **Email-Integration** – SMTP-Versand für Registrierungs- und Buchungsbestätigungen
✅ **Rollenbasierte Navigation** – Dynamische Sidebar mit Berechtigungsprüfung

**Nächste Schritte:** Partner-Portal, Passive Mitglieder Ansicht, Gäste-Willkommensseite

## Projekt-Setup
- Editor- und Stilregeln: siehe `.editorconfig`
- Git-Konventionen: siehe `.gitattributes` und `.gitignore`
- Zusammenarbeit: siehe `CONTRIBUTING.md` und `CODE_OF_CONDUCT.md`
- Pull Requests: Vorlage in `.github/PULL_REQUEST_TEMPLATE.md`
- Issues: Templates in `.github/ISSUE_TEMPLATE/`
- Dokumentation: siehe `docs/`
- Journal & Blog: siehe `journal/`

## Arbeitsweise
- Plane Arbeit als kleine, überprüfbare Einheiten (Issues/Tasks)
- Nutze Labels für Priorität und Status (z.B. `prio:high`, `status:in-progress`)
- Jede Änderung erfolgt via Pull Request und Review

## Kanban
Das Kanban-Board findest du hier: [`docs/kanban.md`](docs/kanban.md)

**Live-Board:** https://github.com/users/trismus/projects/2/views/1

## Infrastruktur

| Service | Zweck | Status |
|---------|-------|--------|
| **Vercel** | Hosting & Deployments | Aktiv |
| **Supabase** | Datenbank & Auth | Integriert |
| **GitHub** | Code & Issues | Aktiv |

Env Vars werden automatisch via Supabase-Vercel Integration gesynct.
