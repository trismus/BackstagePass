# BackstagePass - Milestone Uebersicht

Stand: 23.02.2026

---

## Aktive Milestones

| # | Milestone | Fortschritt | Status | Faellig |
|---|-----------|-------------|--------|---------|
| 1 | Modul 0 - Foundation & Setup | 11/11 (100%) | Fertig | 06.02.2026 |
| 2 | Modul 1 - Core Features | 19/19 (100%) | Fertig | - |
| 3 | Modul 2 - Auffu.-Logistik | 4/4 (100%) | Fertig | - |
| 4 | Modul 3 - Kuenstl. Planung | 4/10 (40%) | Wartung | - |
| 5 | Helfer Liste | 17/20 (85%) | Fertig | 28.02.2026 |
| 6 | UserExperience | 8/12 (67%) | In Arbeit | - |
| 7 | Vorhang auf | 4/8 (50%) | In Arbeit | - |

---

## Milestone Details

### Modul 0 - Foundation & Setup
**Status:** Abgeschlossen (11/11 Issues)

Grundlegende Projektstruktur, Authentifizierung und Basis-Setup.
- Benutzer-Authentifizierung & Login-System
- Mitgliederprofil & Benutzerverwaltung
- Rollenmanagement & Permissions (7-Rollen-System)
- Audit Log & Activity Tracking
- Auth-System Supabase SSR + Next.js App Router
- Basis-Layout fuer Admin-Dashboard

---

### Modul 1 - Core Features
**Status:** Abgeschlossen (19/19 Issues)

Kernfunktionen: Vereinsevents, Helfereinsaetze, Kalenderuebersicht.
- Vereinsevents verwalten (Erstellen/Planen/Anmelden)
- Externe Helfereinsaetze abbilden
- Persoenliche Einsatz- und Kalenderuebersicht

---

### Modul 2 - Operative Auffuehrungslogistik
**Status:** Abgeschlossen (4/4 Issues)

Auffuehrungen, Ressourcen, Templates.
- Auffuehrungen mit Zeitbloecken planen
- Ressourcen & Raeume verwalten
- Einsatz-Templates fuer wiederkehrende Ablaeufe

---

### Modul 3 - Kuenstlerische Planung
**Status:** Kern implementiert, 6 Wartungs-Issues offen (4/10)

Stuecke, Szenen, Rollen, Besetzungen und Probenplanung.
- Stueck, Szenen und Rollen strukturieren
- Besetzung verwalten
- Probenplanung mit kuenstlerischen Funktionen

**Offene Wartungs-Issues:**
- #109: RLS Policy fuer Teilnehmer-Status (bug, prio:high)
- #110: TypeScript 'any' Casts ersetzen
- #111: confirm() durch Modal ersetzen
- #112: Index auf proben_teilnehmer.status
- #113: Tests fuer Kuenstlerische Planung
- #114: Server-side Authorization Check

---

### Helfer Liste
**Status:** Implementiert (17/20 Issues), 3 deferred

Strukturierte Planung und Besetzung von Helferrollen fuer Events.
- 4 DB-Tabellen mit RLS Policies
- Server Actions fuer Events, Rollen, Anmeldungen, Templates
- Admin-Seiten: Events-Liste, Event-Details, Rollen-Management
- Oeffentliche Helfer-Ansicht mit Token-basiertem Zugang
- `/helferliste` Admin-Modul entfernt, ersetzt durch `/mitmachen`

**Deferred:**
- #130: Email Notifications (teilweise via SMTP umgesetzt)
- #132: Unit/Integration Tests
- #133: End-to-End Tests

---

### UserExperience
**Status:** In Arbeit (8/12 Issues)

Rollenbasierte UI/UX Verbesserungen.
- Navigation-Konfiguration zentralisiert
- Rollenbasierte Redirects
- Sidebar- und Header-Komponenten
- Layout-Struktur fuer Bereiche
- Mein-Bereich Dashboard (via #317)
- Helfer-Dashboard (via #318)
- Onboarding-Flow nach erstem Login (#328)

**Offen:**
- #142: Management-Dashboard erweitern
- #144: Mein-Bereich fuer passive Mitglieder
- #146: Partner-Portal erstellen
- #147: Willkommen-Seite fuer Gaeste/Freunde

---

### Vorhang auf -- Mitglieder-Integration
**Status:** In Arbeit (4/8 Issues)

Integration von Mitgliederprofilen mit Schichtplanung, Veranstaltungen und kuenstlerischen Produktionen.

**Abgeschlossen:**
- #343: Verfuegbarkeitskonflikt-Erkennung bei Schichtzuweisung (PR #351)
- #344: Besetzung zu Auffuehrungs-Zuweisungen automatisch erstellen (PR #352)
- #345: Proben-Teilnehmer aus Besetzung auto-befuellen (PR #354)
- #346: Zentrale Personen-Einsatzuebersicht (PR #353)

**In Arbeit / Offen:**
- #347: Skills-basierte Schicht-Vorschlaege (teilweise implementiert)
- #348: Produktions-Dashboard: Besetzungs- und Schicht-Fortschritt (teilweise implementiert)
- #349: Personen-Detailseite: Rollen- und Einsatzhistorie
- #350: Verfuegbarkeiten bei Produktionsplanung beruecksichtigen

---

## Zusammenfassung

| Metrik | Wert |
|--------|------|
| **Gesamt Milestones** | 7 |
| **Abgeschlossen** | 3 (Modul 0, 1, 2) |
| **Kern fertig** | 2 (Modul 3, Helfer Liste) |
| **In Arbeit** | 2 (UserExperience, Vorhang auf) |
| **Gesamt Issues** | ~84 |
| **Erledigt** | ~67 (80%) |

---

## Abhaengigkeiten

```
Modul 0 (Auth)     Modul 1 (Events)     Modul 2 (Logistik)
     │                    │                    │
     └────────────────────┴────────────────────┘
                          │
                    Modul 3 (Kunst)
                          │
                   Helfer Liste
                          │
                   UserExperience
                          │
                    Vorhang auf
                  (Cross-System
                   Integration)
```

Die Milestones bauen aufeinander auf. "Vorhang auf" ist der aktuelle Fokus und integriert alle vorherigen Module zu einem kohaerenten End-to-End-Erlebnis.

---

## Links

- [GitHub Milestones](https://github.com/trismus/BackstagePass/milestones)
- [GitHub Issues](https://github.com/trismus/BackstagePass/issues)
- [Kanban Board](https://github.com/users/trismus/projects/2/views/1)
