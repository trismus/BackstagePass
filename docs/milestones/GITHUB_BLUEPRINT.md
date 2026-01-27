# GitHub Blueprint: Milestone "UserExperience"

Dieses Dokument enthält alle Informationen zum Erstellen des Milestones und der Issues auf GitHub.

---

## Milestone erstellen

**URL:** `https://github.com/[owner]/BackstagePass/milestones/new`

| Feld | Wert |
|------|------|
| **Title** | UserExperience |
| **Due date** | _(optional)_ |
| **Description** | Anpassung der Views und Navigation auf die spezifischen Bedürfnisse der verschiedenen Benutzerrollen. Umfasst rollenbasierte Dashboards, Sidebar-Navigation und optimierte Benutzerführung. |

---

## Issues erstellen

Für jedes Issue: `https://github.com/[owner]/BackstagePass/issues/new`

---

### Issue #1: Sidebar-Komponente erstellen

```
Title: [UX] Sidebar-Komponente erstellen

Labels: enhancement, frontend, priority:high
Milestone: UserExperience
```

**Body:**
```markdown
## Beschreibung
Erstelle eine wiederverwendbare, collapsible Sidebar-Komponente für die rollenbasierten Bereiche.

## Anforderungen
- [ ] Collapsible (einklappbar auf Icon-only)
- [ ] Responsive (Mobile: Burger-Menü oder Overlay)
- [ ] Unterstützt Gruppen/Sections mit Überschriften
- [ ] Active-State für aktuellen Menüpunkt
- [ ] Icons für alle Menüpunkte
- [ ] Collapse-State wird im localStorage gespeichert

## Technische Details
- Client Component (`'use client'`)
- Props: `items: NavItem[]`, `collapsed: boolean`, `onToggle: () => void`
- Tailwind CSS für Styling
- Datei: `components/layout/Sidebar.tsx`

## Akzeptanzkriterien
- [ ] Sidebar lässt sich ein-/ausklappen
- [ ] Aktiver Menüpunkt ist hervorgehoben
- [ ] Mobile-Ansicht funktioniert
- [ ] Collapse-State bleibt nach Reload erhalten

## Abhängigkeiten
- Benötigt: Issue #3 (Navigation-Konfiguration)
```

---

### Issue #2: Header-Komponente anpassen

```
Title: [UX] Header-Komponente anpassen

Labels: enhancement, frontend, priority:high
Milestone: UserExperience
```

**Body:**
```markdown
## Beschreibung
Reduziere den Header auf minimale Elemente und füge Breadcrumb-Navigation hinzu.

## Anforderungen
- [ ] Minimaler Header: Logo + Sidebar-Toggle + Profil-Dropdown + Logout
- [ ] Breadcrumb-Navigation (nur bei Tiefe > 1)
- [ ] Profil-Dropdown mit Benutzerrolle anzeigen
- [ ] Mobile-optimiert

## Technische Details
- Dateien:
  - `components/layout/Header.tsx`
  - `components/layout/Breadcrumb.tsx`
- Breadcrumb aus URL-Pfad generieren

## Akzeptanzkriterien
- [ ] Header zeigt nur essenzielle Elemente
- [ ] Breadcrumbs erscheinen bei verschachtelten Routen (z.B. `/veranstaltungen/123`)
- [ ] Benutzerrolle ist im Profil-Dropdown sichtbar
- [ ] Sidebar-Toggle funktioniert

## Abhängigkeiten
- Benötigt: Issue #3 (Navigation-Konfiguration)
```

---

### Issue #3: Navigation-Konfiguration zentralisieren

```
Title: [UX] Navigation-Konfiguration zentralisieren

Labels: enhancement, refactor, priority:high
Milestone: UserExperience
```

**Body:**
```markdown
## Beschreibung
Erstelle eine zentrale Konfigurationsdatei für die rollenbasierte Navigation.

## Anforderungen
- [ ] `lib/navigation.ts` mit Navigation-Config pro Rolle
- [ ] Type-safe NavItem Interface
- [ ] Permission-basierte Filterung
- [ ] Startseiten-Mapping pro Rolle
- [ ] Icon-Mapping für Menüpunkte

## Technische Details

### Interfaces
```typescript
interface NavItem {
  href: string
  label: string
  icon: string
  permission?: Permission
}

interface NavSection {
  title?: string
  items: NavItem[]
}

interface NavConfig {
  startPage: string
  sidebar: NavSection[]
}
```

### Rollen-Startseiten
| Rolle | Startseite |
|-------|------------|
| ADMIN | /dashboard |
| VORSTAND | /dashboard |
| MITGLIED_AKTIV | /mein-bereich |
| MITGLIED_PASSIV | /mein-bereich |
| HELFER | /helfer |
| PARTNER | /partner-portal |
| FREUNDE | /willkommen |

## Akzeptanzkriterien
- [ ] Alle Navigation zentral in einer Datei konfiguriert
- [ ] TypeScript-Typen für alle Strukturen
- [ ] Helper-Funktion `getNavigationForRole(role)` vorhanden
- [ ] Helper-Funktion `getStartPageForRole(role)` vorhanden

## Abhängigkeiten
- Keine (Grundlage für andere Issues)
```

---

### Issue #4: Layout-Struktur für Bereiche

```
Title: [UX] Layout-Struktur für Bereiche implementieren

Labels: enhancement, frontend, priority:high
Milestone: UserExperience
```

**Body:**
```markdown
## Beschreibung
Erstelle die neue Layout-Struktur mit Sidebar für die verschiedenen Bereiche.

## Anforderungen
- [ ] Neues Basis-Layout mit Header + Sidebar + Main
- [ ] Bereichsspezifische Layouts die das Basis-Layout nutzen
- [ ] Rollenbasierte Sidebar-Inhalte

## Layout-Struktur
```
┌──────────────────────────────────────────────────────────────┐
│ Header: [☰] Logo            Breadcrumb       Profil [Logout] │
├────────────┬─────────────────────────────────────────────────┤
│  Sidebar   │   Main Content                                  │
│  (collap-  │                                                 │
│   sible)   │                                                 │
└────────────┴─────────────────────────────────────────────────┘
```

## Dateien
- [ ] `components/layout/AppLayout.tsx` - Hauptlayout
- [ ] `components/layout/Sidebar.tsx` - Sidebar (Issue #1)
- [ ] `components/layout/Header.tsx` - Header (Issue #2)
- [ ] `app/(protected)/layout.tsx` - Anpassen

## Akzeptanzkriterien
- [ ] Einheitliche Layout-Struktur für alle Bereiche
- [ ] Sidebar zeigt rollenspezifische Navigation
- [ ] Responsive Design funktioniert
- [ ] Alte Header-Navigation entfernt

## Abhängigkeiten
- Benötigt: Issue #1 (Sidebar)
- Benötigt: Issue #2 (Header)
- Benötigt: Issue #3 (Navigation-Config)
```

---

### Issue #5: Management-Dashboard erweitern

```
Title: [UX] Management-Dashboard erweitern

Labels: enhancement, frontend, priority:medium
Milestone: UserExperience
```

**Body:**
```markdown
## Beschreibung
Erweitere das Dashboard für Management-Rollen (ADMIN, VORSTAND) mit relevanten Statistiken und Übersichten.

## Anforderungen
- [ ] Schnellstatistiken-Karten (Mitglieder, offene Anmeldungen, nächste Events)
- [ ] Anstehende Veranstaltungen (7 Tage)
- [ ] Offene Aufgaben / Warnungen
- [ ] Letzte Aktivitäten
- [ ] Quick-Actions (Neue Veranstaltung, Neues Mitglied)

## Sidebar-Struktur
```
📊 Dashboard
───────────────
PERSONEN
  👥 Mitglieder
  🤝 Partner

VERANSTALTUNGEN
  📅 Übersicht
  🎭 Aufführungen
  📖 Stücke
  🎬 Proben
  🛠 Helfereinsätze

RESSOURCEN
  🚪 Räume
  📦 Ausstattung
  📋 Templates
───────────────
ANSICHTEN
  👷 Helfer-Ansicht
  🏢 Partner-Ansicht
───────────────
ADMIN (nur ADMIN)
  👤 Benutzer
  📜 Audit Log
```

## Akzeptanzkriterien
- [ ] Dashboard zeigt relevante Management-Statistiken
- [ ] Alle Menüpunkte in Sidebar erreichbar
- [ ] "Ansichten"-Links ermöglichen Einblick in andere Bereiche
- [ ] Quick-Actions funktionieren

## Abhängigkeiten
- Benötigt: Issue #4 (Layout-Struktur)
```

---

### Issue #6: Mein-Bereich Dashboard für MITGLIED_AKTIV

```
Title: [UX] Mein-Bereich Dashboard für aktive Mitglieder

Labels: enhancement, frontend, priority:high
Milestone: UserExperience
```

**Body:**
```markdown
## Beschreibung
Gestalte `/mein-bereich` als Haupt-Dashboard für aktive Mitglieder (MITGLIED_AKTIV).

## Anforderungen
- [ ] Meine nächsten Termine (Proben, Aufführungen, Helfereinsätze)
- [ ] Stundenkonto-Übersicht (Saldo, letzte Buchungen)
- [ ] Offene Anmeldungen / Einladungen
- [ ] Schnellaktion: "Für Einsatz anmelden"

## Sidebar-Struktur
```
🏠 Mein Bereich
───────────────
MEINE AKTIVITÄTEN
  📅 Meine Termine
  ⏱️ Stundenkonto
  ✅ Anmeldungen

THEATER
  📅 Veranstaltungen
  🎭 Aufführungen
  🎬 Proben

HELFEN
  🛠 Helfereinsätze

RESSOURCEN
  🚪 Räume
```

## Akzeptanzkriterien
- [ ] Dashboard zeigt persönliche Übersicht
- [ ] Schneller Zugriff auf eigene Termine
- [ ] Stundenkonto prominent sichtbar
- [ ] Anmeldung für Einsätze direkt möglich

## Abhängigkeiten
- Benötigt: Issue #4 (Layout-Struktur)
```

---

### Issue #7: Mein-Bereich für MITGLIED_PASSIV

```
Title: [UX] Mein-Bereich für passive Mitglieder

Labels: enhancement, frontend, priority:medium
Milestone: UserExperience
```

**Body:**
```markdown
## Beschreibung
Reduzierte Ansicht von `/mein-bereich` für passive Mitglieder (MITGLIED_PASSIV).

## Anforderungen
- [ ] Nächste öffentliche Veranstaltungen
- [ ] Link zum Profil bearbeiten
- [ ] Reduzierte Sidebar (nur relevante Punkte)

## Sidebar-Struktur
```
🏠 Mein Bereich
───────────────
THEATER
  📅 Veranstaltungen
  🎭 Aufführungen
  📖 Stücke
```

## Akzeptanzkriterien
- [ ] Nur relevante Inhalte sichtbar
- [ ] Kein Zugriff auf Mitglieder-spezifische Funktionen (Stundenkonto etc.)
- [ ] Unterschied zu MITGLIED_AKTIV klar erkennbar

## Abhängigkeiten
- Benötigt: Issue #6 (Mein-Bereich AKTIV als Basis)
```

---

### Issue #8: Helfer-Dashboard erstellen

```
Title: [UX] Helfer-Dashboard erstellen

Labels: enhancement, frontend, priority:high
Milestone: UserExperience
```

**Body:**
```markdown
## Beschreibung
Erstelle einen neuen Bereich `/helfer` für die Helfer-Rolle.

## Anforderungen
- [ ] Neue Route `/helfer` mit eigenem Layout
- [ ] Dashboard: Meine zugewiesenen Schichten (Kalender/Liste)
- [ ] Nächster Einsatz prominent anzeigen
- [ ] Verfügbare Helfereinsätze zum Anmelden
- [ ] Kontaktinfo für Rückfragen

## Sidebar-Struktur
```
🏠 Übersicht
───────────────
MEINE EINSÄTZE
  📋 Meine Schichten
  🛠 Verfügbare Einsätze
───────────────
  👤 Mein Profil
```

## Neue Dateien
- [ ] `app/(protected)/helfer/page.tsx`
- [ ] `app/(protected)/helfer/layout.tsx`
- [ ] `app/(protected)/helfer/schichten/page.tsx`
- [ ] `app/(protected)/helfer/einsaetze/page.tsx`

## Akzeptanzkriterien
- [ ] Helfer sehen nur ihre relevanten Schichten
- [ ] Anmeldung für verfügbare Einsätze möglich
- [ ] Übersichtliches Dashboard mit nächstem Einsatz
- [ ] ADMIN/VORSTAND können Bereich auch einsehen

## Abhängigkeiten
- Benötigt: Issue #4 (Layout-Struktur)
```

---

### Issue #9: Partner-Portal erstellen

```
Title: [UX] Partner-Portal erstellen

Labels: enhancement, frontend, priority:medium
Milestone: UserExperience
```

**Body:**
```markdown
## Beschreibung
Erstelle einen neuen Bereich `/partner-portal` für Partner-Organisationen.

## Anforderungen
- [ ] Neue Route `/partner-portal` mit eigenem Layout
- [ ] Eigene Partnerdaten anzeigen/bearbeiten
- [ ] Relevante Veranstaltungen (wo Partner involviert)
- [ ] Ansprechpartner im Verein anzeigen

## Sidebar-Struktur
```
🏠 Partner-Portal
───────────────
  🤝 Meine Daten
  📅 Veranstaltungen
  📧 Kontakt
───────────────
  👤 Mein Profil
```

## Neue Dateien
- [ ] `app/(protected)/partner-portal/page.tsx`
- [ ] `app/(protected)/partner-portal/layout.tsx`
- [ ] `app/(protected)/partner-portal/daten/page.tsx`

## Akzeptanzkriterien
- [ ] Partner sehen ihre eigenen Organisationsdaten
- [ ] Zugriff auf relevante Veranstaltungen
- [ ] Kontaktmöglichkeit zum Verein vorhanden
- [ ] ADMIN/VORSTAND können Bereich auch einsehen

## Abhängigkeiten
- Benötigt: Issue #4 (Layout-Struktur)
```

---

### Issue #10: Willkommen-Seite für FREUNDE

```
Title: [UX] Willkommen-Seite für Gäste/Freunde

Labels: enhancement, frontend, priority:low
Milestone: UserExperience
```

**Body:**
```markdown
## Beschreibung
Erstelle eine minimale Willkommensseite für Freunde/Gäste (FREUNDE-Rolle).

## Anforderungen
- [ ] Neue Route `/willkommen`
- [ ] Öffentliche Veranstaltungen anzeigen
- [ ] Info über den Verein
- [ ] "Mitglied werden?" Call-to-Action

## Sidebar-Struktur
```
🏠 Willkommen
───────────────
  📅 Veranstaltungen
  👤 Mein Profil
```

## Neue Dateien
- [ ] `app/(protected)/willkommen/page.tsx`
- [ ] `app/(protected)/willkommen/layout.tsx`

## Akzeptanzkriterien
- [ ] Minimalistische, einladende Ansicht
- [ ] Nur öffentliche Informationen sichtbar
- [ ] CTA für Mitgliedschaft vorhanden

## Abhängigkeiten
- Benötigt: Issue #4 (Layout-Struktur)
```

---

### Issue #11: Rollenbasierte Redirects implementieren

```
Title: [UX] Rollenbasierte Redirects implementieren

Labels: enhancement, backend, priority:high
Milestone: UserExperience
```

**Body:**
```markdown
## Beschreibung
Implementiere automatische Redirects zur rollenspezifischen Startseite nach Login und bei unberechtigtem Zugriff.

## Anforderungen
- [ ] Nach Login: Redirect zur Rollen-Startseite
- [ ] `/dashboard` für Nicht-Management: Redirect zur eigenen Startseite
- [ ] Middleware-Anpassung für Berechtigungsprüfung pro Bereich
- [ ] Keine Endlos-Redirect-Loops

## Rollen-Mapping
```typescript
const ROLE_START_PAGES: Record<UserRole, string> = {
  ADMIN: '/dashboard',
  VORSTAND: '/dashboard',
  MITGLIED_AKTIV: '/mein-bereich',
  MITGLIED_PASSIV: '/mein-bereich',
  HELFER: '/helfer',
  PARTNER: '/partner-portal',
  FREUNDE: '/willkommen',
}
```

## Betroffene Dateien
- [ ] `middleware.ts` - Redirect-Logik
- [ ] `app/actions/auth.ts` - Login-Redirect anpassen
- [ ] `lib/navigation.ts` - Startseiten-Helper

## Akzeptanzkriterien
- [ ] Login leitet zur korrekten Startseite
- [ ] Unberechtigte Zugriffe werden umgeleitet (nicht 403)
- [ ] ADMIN/VORSTAND können alle Bereiche besuchen
- [ ] Keine Redirect-Loops

## Abhängigkeiten
- Benötigt: Issue #3 (Navigation-Konfiguration)
```

---

## Checkliste für GitHub

### Milestone
- [ ] Milestone "UserExperience" erstellen

### Issues (in dieser Reihenfolge erstellen)
- [ ] Issue #3: Navigation-Konfiguration (keine Abhängigkeiten)
- [ ] Issue #11: Rollenbasierte Redirects
- [ ] Issue #1: Sidebar-Komponente
- [ ] Issue #2: Header-Komponente
- [ ] Issue #4: Layout-Struktur
- [ ] Issue #5: Management-Dashboard
- [ ] Issue #6: Mein-Bereich AKTIV
- [ ] Issue #7: Mein-Bereich PASSIV
- [ ] Issue #8: Helfer-Dashboard
- [ ] Issue #9: Partner-Portal
- [ ] Issue #10: Willkommen-Seite

### Labels erstellen (falls nicht vorhanden)
- [ ] `priority:high`
- [ ] `priority:medium`
- [ ] `priority:low`
- [ ] `frontend`
- [ ] `backend`
- [ ] `enhancement`
- [ ] `refactor`

---

## Zusammenfassung

| Metrik | Wert |
|--------|------|
| **Milestone** | UserExperience |
| **Anzahl Issues** | 11 |
| **Geschätzte Story Points** | 40 |
| **Phasen** | 3 |
