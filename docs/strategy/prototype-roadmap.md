# Prototyp-Roadmap - BackstagePass

**Status:** Draft
**Datum:** 2026-01-24
**Erstellt von:** Regisseur

---

## 1. Prototyp-Phasen Übersicht

```
┌─────────────────────────────────────────────────────────────────┐
│                    PROTOTYP ROADMAP                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  PHASE 0 ──────► PHASE 1 ──────► PHASE 2 ──────► PHASE 3       │
│  Foundation      MVP Core        MVP Extended    Beta           │
│                                                                 │
│  ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐      │
│  │ Infra-  │    │ Mitglie-│    │ Proben/ │    │ Polish  │      │
│  │ struktur│    │ der-    │    │ Termine │    │ +       │      │
│  │ Setup   │    │ verwalt.│    │ Mgmt    │    │ Launch  │      │
│  └─────────┘    └─────────┘    └─────────┘    └─────────┘      │
│                                                                 │
│  Mockups        CRUD + Auth     Kalender       User Testing    │
│  + Dummy        + RLS           + Anwesenheit  + Feedback      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Aktueller Stand

### Was bereits existiert:

| Komponente | Status | Beschreibung |
|------------|--------|--------------|
| **Repository** | ✅ Done | GitHub Repo mit Monorepo-Struktur |
| **Dokumentation** | ✅ Done | Architektur, Team-Rollen, Workflows |
| **Mockup-Seiten** | ✅ Done | `/mockup` mit Dummy-Daten |
| **Dummy-Daten-Layer** | ✅ Done | TypeScript Interfaces + Beispieldaten |
| **AI Team** | ✅ Done | 7 Rollen definiert (inkl. REDAKTEUR) |

### Was noch fehlt:

| Komponente | Status | Priorität |
|------------|--------|-----------|
| **package.json** | ❌ Missing | P0 |
| **Vercel Deployment** | ❌ Missing | P0 |
| **Supabase Setup** | ❌ Missing | P0 |
| **Authentifizierung** | ❌ Missing | P1 |
| **Echte Datenbank** | ❌ Missing | P1 |
| **CRUD Operationen** | ❌ Missing | P1 |

---

## 3. Phase 0: Foundation (Aktuelle Phase)

### Ziel
> Lauffähige Next.js App auf Vercel mit Supabase-Anbindung

### Tasks

#### 0.1 Projekt-Setup
- [ ] `package.json` erstellen mit allen Dependencies
- [ ] Next.js 15 App Router konfigurieren
- [ ] TypeScript strict mode aktivieren
- [ ] Tailwind CSS einrichten
- [ ] ESLint + Prettier konfigurieren

#### 0.2 Vercel Deployment
- [ ] Vercel Projekt erstellen
- [ ] GitHub Repo verbinden
- [ ] `develop` Branch als Preview
- [ ] `main` Branch als Production
- [ ] Custom Domain (optional)

#### 0.3 Supabase Setup
- [ ] Supabase Projekt erstellen (backstagepass-dev)
- [ ] Vercel Integration aktivieren
- [ ] Environment Variables automatisch sync
- [ ] Supabase Client in Next.js einrichten

#### 0.4 Basis-Authentifizierung
- [ ] Supabase Auth aktivieren
- [ ] Login/Logout Pages erstellen
- [ ] Protected Routes einrichten
- [ ] Session Management

### Definition of Done (Phase 0)
- [ ] App läuft auf `dev.backstagepass.vercel.app`
- [ ] User kann sich registrieren/einloggen
- [ ] Protected Dashboard sichtbar nach Login
- [ ] Mockup-Seiten weiterhin funktional

---

## 4. Phase 1: MVP Core - Mitgliederverwaltung

### Ziel
> Kernfunktion: Mitglieder anlegen, bearbeiten, anzeigen

### Features

#### 1.1 Datenbank-Schema
```sql
-- personen Tabelle
CREATE TABLE personen (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vorname TEXT NOT NULL,
  nachname TEXT NOT NULL,
  email TEXT UNIQUE,
  telefon TEXT,
  rolle TEXT DEFAULT 'mitglied',
  aktiv BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE personen ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Mitglieder sichtbar für authentifizierte User"
ON personen FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Nur Admins können bearbeiten"
ON personen FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'
  )
);
```

#### 1.2 UI Components
- [ ] Mitglieder-Liste (Tabelle mit Suche/Filter)
- [ ] Mitglied-Detail-Seite
- [ ] Mitglied-Formular (Create/Edit)
- [ ] Mitglied-Lösch-Dialog
- [ ] Rollen-Badge Component

#### 1.3 API Routes (Server Actions)
```typescript
// lib/actions/personen.ts
'use server'

export async function getPersonen(): Promise<Person[]> { }
export async function getPerson(id: string): Promise<Person> { }
export async function createPerson(data: PersonInput): Promise<Person> { }
export async function updatePerson(id: string, data: PersonInput): Promise<Person> { }
export async function deletePerson(id: string): Promise<void> { }
```

### Definition of Done (Phase 1)
- [ ] Mitglieder-Liste mit Suche funktioniert
- [ ] Neues Mitglied kann angelegt werden
- [ ] Mitglied kann bearbeitet werden
- [ ] Mitglied kann (soft) gelöscht werden
- [ ] RLS verhindert unauthorisierten Zugriff

---

## 5. Phase 2: MVP Extended - Proben & Termine

### Ziel
> Probenplanung und Anwesenheitstracking

### Features

#### 2.1 Produktionen-Management
- [ ] Produktionen erstellen/bearbeiten
- [ ] Produktions-Status (Planung, Proben, Aufführungen, Abgeschlossen)
- [ ] Besetzung zuordnen (M:N mit personen)

#### 2.2 Termin-Kalender
- [ ] Kalender-Ansicht (Monats/Wochen-View)
- [ ] Termine erstellen (Probe, Aufführung, Meeting)
- [ ] Termin-Details mit Teilnehmerliste
- [ ] Wiederkehrende Termine

#### 2.3 Anwesenheit
- [ ] Check-in für Termine
- [ ] Anwesenheits-Übersicht
- [ ] Entschuldigungen erfassen
- [ ] Statistiken (Anwesenheitsquote)

### Definition of Done (Phase 2)
- [ ] Produktionen mit Besetzung verwaltbar
- [ ] Kalender zeigt alle Termine
- [ ] Anwesenheit kann erfasst werden
- [ ] Statistiken sichtbar für Admins

---

## 6. Phase 3: Beta - Polish & Launch

### Ziel
> Produktionsreifes System mit echten Nutzern

### Tasks

#### 3.1 User Experience
- [ ] Onboarding Flow für neue User
- [ ] Responsive Design (Mobile-First)
- [ ] Loading States + Skeleton UIs
- [ ] Error Handling + User Feedback
- [ ] Tastatur-Navigation

#### 3.2 Testing
- [ ] Unit Tests für kritische Funktionen
- [ ] E2E Tests mit Playwright
- [ ] Manual QA durch KRITIKER
- [ ] User Testing mit echtem Theaterverein

#### 3.3 Performance
- [ ] Lighthouse Score > 90
- [ ] Core Web Vitals optimiert
- [ ] Lazy Loading für Listen
- [ ] Caching-Strategie

#### 3.4 Launch Vorbereitung
- [ ] Production Supabase Projekt
- [ ] Backup-Strategie verifiziert
- [ ] Monitoring eingerichtet
- [ ] Support-Prozess definiert

### Definition of Done (Phase 3)
- [ ] Lighthouse Performance > 90
- [ ] Alle kritischen Bugs gefixt
- [ ] 1 Pilot-Theaterverein nutzt System
- [ ] Feedback-Loop etabliert

---

## 7. Feature-Backlog (Post-MVP)

### Nice-to-have Features

| Feature | Priorität | Beschreibung |
|---------|-----------|--------------|
| **Benachrichtigungen** | P2 | Email/Push bei Terminänderungen |
| **Dokumenten-Ablage** | P2 | Scripts, Noten, etc. hochladen |
| **Kommunikation** | P3 | In-App Messaging/Kommentare |
| **Finanz-Tracking** | P3 | Budget, Ausgaben, Einnahmen |
| **Ticketverkauf** | P4 | Integration mit Ticketing-Systemen |
| **Mobile App** | P4 | Native iOS/Android oder PWA |

---

## 8. Technische Meilensteine

### Milestone 0: Foundation Complete
```
Kriterien:
✅ Next.js App deployed auf Vercel
✅ Supabase verbunden
✅ Auth funktioniert
✅ CI/CD Pipeline aktiv
```

### Milestone 1: MVP Core Complete
```
Kriterien:
✅ Mitgliederverwaltung vollständig
✅ RLS Policies aktiv
✅ Code Review bestanden
✅ Dokumentation aktuell
```

### Milestone 2: MVP Extended Complete
```
Kriterien:
✅ Produktionen + Termine funktional
✅ Anwesenheit trackbar
✅ Kalender-Integration
✅ Performance Tests bestanden
```

### Milestone 3: Beta Ready
```
Kriterien:
✅ Production Environment live
✅ Pilot-User onboarded
✅ Support-Prozess definiert
✅ Monitoring aktiv
```

---

## 9. Risiken & Mitigationen

| Risiko | Wahrscheinlichkeit | Impact | Mitigation |
|--------|-------------------|--------|------------|
| Scope Creep | Hoch | Hoch | Strikte MVP-Definition, REGISSEUR als Gatekeeper |
| Performance-Probleme | Mittel | Hoch | Frühzeitig Performance-Tests, Caching |
| Security-Lücken | Mittel | Kritisch | KRITIKER Review, RLS by default |
| User-Akzeptanz | Mittel | Hoch | Frühe User-Einbindung, Feedback-Loops |

---

## 10. Nächste konkrete Schritte

### Sofort zu erledigen:

1. **package.json erstellen**
   ```bash
   cd apps/web
   npm init -y
   npm install next@15 react@19 react-dom@19
   npm install -D typescript @types/react @types/node
   npm install @supabase/supabase-js @supabase/ssr
   npm install tailwindcss postcss autoprefixer
   ```

2. **Vercel Projekt verbinden**
   ```bash
   vercel link
   vercel env pull
   ```

3. **Supabase initialisieren**
   - Projekt erstellen unter supabase.com
   - Vercel Integration aktivieren
   - `lib/supabase.ts` erstellen

4. **Erste Route testen**
   - Login-Page erstellen
   - Auth testen
   - Deploy auf Preview

---

## 11. Entscheidungspunkte

### Vor Phase 1 Start
- [ ] Ist Foundation stabil? (Smoke Tests)
- [ ] Sind alle Environment Variables gesetzt?
- [ ] Ist der Develop-Branch protected?

### Vor Phase 2 Start
- [ ] Sind alle Phase 1 Features production-ready?
- [ ] Gibt es kritische Bugs?
- [ ] Ist die Performance akzeptabel?

### Vor Phase 3 Start
- [ ] Ist ein Pilot-User identifiziert?
- [ ] Sind alle Security-Reviews abgeschlossen?
- [ ] Ist die Dokumentation vollständig?

---

*Dieses Dokument ist Teil der BackstagePass Dokumentation und sollte bei jedem Milestone-Abschluss aktualisiert werden.*
