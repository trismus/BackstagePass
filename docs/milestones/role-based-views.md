# Milestone: Rollenbasierte Views & Navigation

**Ziel:** Anpassung der Views und Navigation auf die spezifischen Bedürfnisse der verschiedenen Benutzerrollen.

**Priorität:** Hoch
**Ziel-Version:** v1.0

---

## Übersicht

| Rolle | Startseite | Bereich |
|-------|------------|---------|
| ADMIN | /dashboard | Management |
| VORSTAND | /dashboard | Management |
| MITGLIED_AKTIV | /mein-bereich | Mitglieder |
| MITGLIED_PASSIV | /mein-bereich | Mitglieder (reduziert) |
| HELFER | /helfer | Helfer |
| PARTNER | /partner-portal | Partner |
| FREUNDE | /willkommen | Gäste |

---

## Issues

### Epic 1: Infrastruktur & Layout

#### Issue #1: Sidebar-Komponente erstellen
**Labels:** `enhancement`, `frontend`, `priority:high`

**Beschreibung:**
Erstelle eine wiederverwendbare, collapsible Sidebar-Komponente für die rollenbasierten Bereiche.

**Anforderungen:**
- [ ] Collapsible (einklappbar auf Icon-only)
- [ ] Responsive (Mobile: Burger-Menü oder Overlay)
- [ ] Unterstützt Gruppen/Sections mit Überschriften
- [ ] Active-State für aktuellen Menüpunkt
- [ ] Icons für alle Menüpunkte
- [ ] Collapse-State wird im localStorage gespeichert

**Technische Details:**
- Client Component (`'use client'`)
- Props: `items: NavItem[]`, `collapsed: boolean`, `onToggle: () => void`
- Tailwind CSS für Styling

**Akzeptanzkriterien:**
- Sidebar lässt sich ein-/ausklappen
- Aktiver Menüpunkt ist hervorgehoben
- Mobile-Ansicht funktioniert

---

#### Issue #2: Header-Komponente anpassen
**Labels:** `enhancement`, `frontend`, `priority:high`

**Beschreibung:**
Reduziere den Header auf minimale Elemente und füge Breadcrumb-Navigation hinzu.

**Anforderungen:**
- [ ] Minimaler Header: Logo + Toggle-Button + Profil-Dropdown + Logout
- [ ] Breadcrumb-Navigation (nur bei Tiefe > 1)
- [ ] Profil-Dropdown mit Rolle anzeigen
- [ ] Mobile-optimiert

**Akzeptanzkriterien:**
- Header zeigt nur essenzielle Elemente
- Breadcrumbs erscheinen bei verschachtelten Routen
- Benutzerrolle ist sichtbar

---

#### Issue #3: Navigation-Konfiguration zentralisieren
**Labels:** `enhancement`, `refactor`, `priority:high`

**Beschreibung:**
Erstelle eine zentrale Konfigurationsdatei für die rollenbasierte Navigation.

**Anforderungen:**
- [ ] `lib/navigation.ts` mit Navigation-Config pro Rolle
- [ ] Type-safe NavItem Interface
- [ ] Permission-basierte Filterung
- [ ] Startseiten-Mapping pro Rolle

**Beispiel-Struktur:**
```typescript
interface NavItem {
  href: string
  label: string
  icon: string
  permission?: Permission
  children?: NavItem[]
}

interface NavConfig {
  startPage: string
  sidebar: NavSection[]
}

const NAVIGATION: Record<UserRole, NavConfig> = { ... }
```

**Akzeptanzkriterien:**
- Alle Navigation zentral konfiguriert
- Änderungen an einer Stelle möglich
- Type-safe

---

#### Issue #4: Layout-Struktur für Bereiche
**Labels:** `enhancement`, `frontend`, `priority:high`

**Beschreibung:**
Erstelle die neue Layout-Struktur mit Sidebar für die verschiedenen Bereiche.

**Anforderungen:**
- [ ] Neues Basis-Layout mit Header + Sidebar + Main
- [ ] Bereichsspezifische Layouts die das Basis-Layout nutzen
- [ ] Redirect-Logik für Startseiten

**Dateien:**
- `app/(protected)/layout.tsx` - Anpassen
- `components/layout/AppLayout.tsx` - Neu
- `components/layout/Sidebar.tsx` - Neu
- `components/layout/Header.tsx` - Neu
- `components/layout/Breadcrumb.tsx` - Neu

**Akzeptanzkriterien:**
- Einheitliche Layout-Struktur
- Sidebar wird korrekt angezeigt
- Redirects funktionieren

---

### Epic 2: Management-Bereich (ADMIN, VORSTAND)

#### Issue #5: Management-Dashboard erweitern
**Labels:** `enhancement`, `frontend`, `priority:medium`

**Beschreibung:**
Erweitere das Dashboard für Management-Rollen mit relevanten Statistiken und Übersichten.

**Anforderungen:**
- [ ] Schnellstatistiken (Mitglieder, offene Anmeldungen, nächste Events)
- [ ] Anstehende Veranstaltungen (7 Tage)
- [ ] Offene Aufgaben / Warnungen
- [ ] Letzte Aktivitäten
- [ ] Quick-Actions (Neue Veranstaltung, Neues Mitglied)

**Sidebar-Struktur:**
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

**Akzeptanzkriterien:**
- Dashboard zeigt relevante Management-Infos
- Alle Menüpunkte erreichbar
- "Ansichten"-Links ermöglichen Einblick in andere Bereiche

---

### Epic 3: Mitglieder-Bereich

#### Issue #6: Mein-Bereich Dashboard für MITGLIED_AKTIV
**Labels:** `enhancement`, `frontend`, `priority:high`

**Beschreibung:**
Gestalte `/mein-bereich` als Haupt-Dashboard für aktive Mitglieder.

**Anforderungen:**
- [ ] Meine nächsten Termine (Proben, Aufführungen, Helfereinsätze)
- [ ] Stundenkonto-Übersicht (Saldo, letzte Buchungen)
- [ ] Offene Anmeldungen / Einladungen
- [ ] Schnellaktion: "Für Einsatz anmelden"

**Sidebar-Struktur:**
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

**Akzeptanzkriterien:**
- Dashboard zeigt persönliche Übersicht
- Schneller Zugriff auf eigene Termine
- Stundenkonto prominent sichtbar

---

#### Issue #7: Mein-Bereich für MITGLIED_PASSIV
**Labels:** `enhancement`, `frontend`, `priority:medium`

**Beschreibung:**
Reduzierte Ansicht für passive Mitglieder.

**Anforderungen:**
- [ ] Nächste öffentliche Veranstaltungen
- [ ] Link zum Profil bearbeiten
- [ ] Reduzierte Sidebar

**Sidebar-Struktur:**
```
🏠 Mein Bereich
───────────────
THEATER
  📅 Veranstaltungen
  🎭 Aufführungen
  📖 Stücke
```

**Akzeptanzkriterien:**
- Nur relevante Inhalte sichtbar
- Kein Zugriff auf Mitglieder-spezifische Funktionen

---

### Epic 4: Helfer-Bereich

#### Issue #8: Helfer-Dashboard erstellen
**Labels:** `enhancement`, `frontend`, `priority:high`

**Beschreibung:**
Erstelle einen neuen Bereich `/helfer` für die Helfer-Rolle.

**Anforderungen:**
- [ ] Neue Route `/helfer` mit eigenem Layout
- [ ] Dashboard: Meine zugewiesenen Schichten
- [ ] Nächster Einsatz prominent
- [ ] Verfügbare Helfereinsätze zum Anmelden
- [ ] Kontaktinfo für Rückfragen

**Sidebar-Struktur:**
```
🏠 Übersicht
───────────────
MEINE EINSÄTZE
  📋 Meine Schichten
  🛠 Verfügbare Einsätze
───────────────
  👤 Mein Profil
```

**Neue Dateien:**
- `app/(protected)/helfer/page.tsx`
- `app/(protected)/helfer/layout.tsx`
- `app/(protected)/helfer/schichten/page.tsx`
- `app/(protected)/helfer/einsaetze/page.tsx`

**Akzeptanzkriterien:**
- Helfer sehen nur ihre relevanten Schichten
- Anmeldung für Einsätze möglich
- Übersichtliches Dashboard

---

### Epic 5: Partner-Bereich

#### Issue #9: Partner-Portal erstellen
**Labels:** `enhancement`, `frontend`, `priority:medium`

**Beschreibung:**
Erstelle einen neuen Bereich `/partner-portal` für Partner.

**Anforderungen:**
- [ ] Neue Route `/partner-portal` mit eigenem Layout
- [ ] Eigene Partnerdaten anzeigen/bearbeiten
- [ ] Relevante Veranstaltungen (wo Partner involviert)
- [ ] Ansprechpartner im Verein

**Sidebar-Struktur:**
```
🏠 Partner-Portal
───────────────
  🤝 Meine Daten
  📅 Veranstaltungen
  📧 Kontakt
───────────────
  👤 Mein Profil
```

**Neue Dateien:**
- `app/(protected)/partner-portal/page.tsx`
- `app/(protected)/partner-portal/layout.tsx`

**Akzeptanzkriterien:**
- Partner sehen ihre eigenen Daten
- Zugriff auf relevante Veranstaltungen
- Kontaktmöglichkeit vorhanden

---

### Epic 6: Gäste-Bereich

#### Issue #10: Willkommen-Seite für FREUNDE
**Labels:** `enhancement`, `frontend`, `priority:low`

**Beschreibung:**
Erstelle eine minimale Willkommensseite für Freunde/Gäste.

**Anforderungen:**
- [ ] Neue Route `/willkommen`
- [ ] Öffentliche Veranstaltungen anzeigen
- [ ] Info über den Verein
- [ ] "Mitglied werden?" CTA

**Sidebar-Struktur:**
```
🏠 Willkommen
───────────────
  📅 Veranstaltungen
  👤 Mein Profil
```

**Neue Dateien:**
- `app/(protected)/willkommen/page.tsx`
- `app/(protected)/willkommen/layout.tsx`

**Akzeptanzkriterien:**
- Minimalistische Ansicht
- Nur öffentliche Infos

---

### Epic 7: Routing & Redirects

#### Issue #11: Rollenbasierte Redirects implementieren
**Labels:** `enhancement`, `backend`, `priority:high`

**Beschreibung:**
Implementiere automatische Redirects zur rollenspezifischen Startseite.

**Anforderungen:**
- [ ] Nach Login: Redirect zur Rollen-Startseite
- [ ] `/dashboard` für Nicht-Management: Redirect zur eigenen Startseite
- [ ] Middleware-Anpassung für Berechtigungsprüfung

**Mapping:**
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

**Akzeptanzkriterien:**
- Login leitet zur korrekten Startseite
- Unberechtigte Zugriffe werden umgeleitet
- Keine Endlos-Redirect-Loops

---

## Abhängigkeiten

```
Issue #3 (Navigation-Config)
    │
    ├──► Issue #1 (Sidebar)
    │        │
    │        └──► Issue #4 (Layout)
    │                 │
    │                 ├──► Issue #5 (Management-Dashboard)
    │                 ├──► Issue #6 (Mitglieder AKTIV)
    │                 ├──► Issue #7 (Mitglieder PASSIV)
    │                 ├──► Issue #8 (Helfer)
    │                 ├──► Issue #9 (Partner)
    │                 └──► Issue #10 (Willkommen)
    │
    └──► Issue #2 (Header)

Issue #11 (Redirects) - kann parallel zu Layout-Arbeit erfolgen
```

---

## Priorisierung

### Phase 1 - Infrastruktur (Muss zuerst)
1. Issue #3: Navigation-Konfiguration
2. Issue #1: Sidebar-Komponente
3. Issue #2: Header-Komponente
4. Issue #4: Layout-Struktur

### Phase 2 - Kernbereiche (Höchste Nutzung)
5. Issue #5: Management-Dashboard
6. Issue #6: Mitglieder AKTIV
7. Issue #8: Helfer-Dashboard
8. Issue #11: Redirects

### Phase 3 - Weitere Bereiche
9. Issue #7: Mitglieder PASSIV
10. Issue #9: Partner-Portal
11. Issue #10: Willkommen-Seite

---

## Schätzung

| Issue | Komplexität | Story Points |
|-------|-------------|--------------|
| #1 Sidebar | Mittel | 5 |
| #2 Header | Klein | 3 |
| #3 Navigation-Config | Klein | 2 |
| #4 Layout-Struktur | Mittel | 5 |
| #5 Management-Dashboard | Mittel | 5 |
| #6 Mitglieder AKTIV | Mittel | 5 |
| #7 Mitglieder PASSIV | Klein | 2 |
| #8 Helfer-Dashboard | Mittel | 5 |
| #9 Partner-Portal | Mittel | 3 |
| #10 Willkommen | Klein | 2 |
| #11 Redirects | Klein | 3 |
| **Total** | | **40 SP** |
