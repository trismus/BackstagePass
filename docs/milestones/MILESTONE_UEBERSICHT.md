# BackstagePass - Milestone Übersicht

Stand: 27.01.2026

---

## Aktive Milestones

| # | Milestone | Fortschritt | Status | Fällig |
|---|-----------|-------------|--------|--------|
| 1 | Modul 0 | ██████████ 11/11 (100%) | ✅ Fertig | 06.02.2026 |
| 2 | Modul 1 | ██████████ 19/19 (100%) | ✅ Fertig | - |
| 3 | Modul 2 | ██████████ 4/4 (100%) | ✅ Fertig | - |
| 4 | Modul 3 | █████████░ 9/10 (90%) | 🔄 In Arbeit | - |
| 5 | Helfer Liste | ████████░░ 17/20 (85%) | 🔄 In Arbeit | 28.02.2026 |
| 6 | UserExperience | ██████████ 11/11 (100%) | ✅ Fertig | - |
| 7 | Mitglieder | ░░░░░░░░░░ 0/7 (0%) | 📋 Offen | - |
| 8 | Produktionen | ░░░░░░░░░░ 0/7 (0%) | 📋 Offen | - |
| 9 | Künstlerische Produktion | ░░░░░░░░░░ 0/7 (0%) | 📋 Offen | - |

---

## Milestone Details

### Modul 0 - Foundation & Setup
**Status:** ✅ Abgeschlossen (11/11 Issues)

Grundlegende Projektstruktur, Authentifizierung und Basis-Setup.

---

### Modul 1 - Core Features
**Status:** ✅ Abgeschlossen (19/19 Issues)

Kernfunktionen: Mitglieder, Veranstaltungen, grundlegende CRUD-Operationen.

---

### Modul 2 - Extended Features
**Status:** ✅ Abgeschlossen (4/4 Issues)

Erweiterte Features: Aufführungen, Räume, Ressourcen, Templates.

---

### Modul 3 - Künstlerische Planung
**Status:** 🔄 In Arbeit (9/10 Issues - 90%)

Stücke, Szenen, Rollen, Besetzungen und Probenplanung.

---

### Helfer Liste
**Status:** 🔄 In Arbeit (17/20 Issues - 85%)
**Fällig:** 28.02.2026

> Implementierung des Features Helferliste zur strukturierten Planung, Ausschreibung und Besetzung von Helferrollen für Events. Umfasst Datenbankdesign, Backend-APIs, Frontend-UI und Integration in Supabase/Next.js.

---

### UserExperience
**Status:** ✅ Abgeschlossen (11/11 Issues)

> Anpassung der Views und Navigation auf die spezifischen Bedürfnisse der verschiedenen Benutzerrollen. Umfasst rollenbasierte Dashboards, Sidebar-Navigation und optimierte Benutzerführung.

---

### Mitglieder (NEU)
**Status:** 📋 Offen (0/7 Issues)

> Vollständige Mitgliederverwaltung mit Profilen, Rollen, Kontaktdaten und Verfügbarkeiten. Basis für alle personenbezogenen Funktionen.

**Issues:**
1. Mitgliederprofil erweitern
2. Rollen- und Zuständigkeitssystem
3. Kontaktverwaltung verbessern
4. Verfügbarkeiten-System
5. Mitglieder-Archivierung
6. Erweiterte Suche und Filter
7. Export-Funktion

---

### Produktionen (NEU)
**Status:** 📋 Offen (0/7 Issues)

> Theaterproduktionen strukturiert planen, besetzen und betreuen. Verwaltung von Stücken, Besetzungen, Dokumenten und Produktionsstatus.

**Issues:**
1. Produktions-Entität erstellen
2. Produktions-Dashboard
3. Besetzungs-Management
4. Team-Zuweisung (Stab)
5. Dokumentenverwaltung
6. Status-Workflow mit Checklisten
7. Dashboard-Widgets

---

### Künstlerische Produktion (NEU)
**Status:** 📋 Offen (0/7 Issues)

> Terminplanung für Proben, Aufführungen und Meetings. Kalenderansichten, Einladungen, Teilnahme-Tracking und Erinnerungen.

**Issues:**
1. Probenplan-Generator
2. Kalender-Gesamtansicht
3. Einladungs- und Teilnahme-System
4. Anwesenheits-Tracking
5. Erinnerungs-System
6. Proben-Protokoll
7. Meeting-Verwaltung
8. Persönlicher Terminkalender

---

## Zusammenfassung

| Metrik | Wert |
|--------|------|
| **Gesamt Milestones** | 9 |
| **Abgeschlossen** | 4 (Modul 0, 1, 2, UserExperience) |
| **In Arbeit** | 2 (Modul 3, Helfer Liste) |
| **Offen** | 3 (Mitglieder, Produktionen, Künstlerische Produktion) |
| **Gesamt Issues** | 96 |
| **Erledigt** | 75 (78%) |
| **Offen** | 21 (22%) |

---

## Abhängigkeiten

```
┌─────────────────┐
│   Mitglieder    │
│ (Verfügbarkeit) │
└────────┬────────┘
         │
         ▼
┌─────────────────┐     ┌─────────────────────────┐
│  Produktionen   │────▶│ Künstlerische Produktion│
│  (Besetzung)    │     │    (Terminplanung)      │
└─────────────────┘     └─────────────────────────┘
```

Die drei neuen Milestones bauen aufeinander auf:
1. **Mitglieder** liefert die Personenbasis und Verfügbarkeiten
2. **Produktionen** strukturiert die Projekte und Besetzungen
3. **Künstlerische Produktion** koordiniert die Termine basierend auf 1 & 2

---

## Links

- [GitHub Milestones](https://github.com/trismus/BackstagePass/milestones)
- [GitHub Issues](https://github.com/trismus/BackstagePass/issues)
