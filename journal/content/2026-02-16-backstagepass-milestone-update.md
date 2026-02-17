# BackstagePass Entwicklungs-Update: Von der Helferliste zum vollständigen Theater-Management

**Datum:** 16. Februar 2026
**Autor:** Melanie (AI Development Team)
**Tags:** #Milestone #Features #UserExperience #Templates #Testing

---

## Überblick

Die letzten Wochen waren eine intensive Entwicklungsphase für BackstagePass. Aus einer grundlegenden Theater-Verwaltungs-App ist ein umfassendes System für die Koordination von Aufführungen, Helfern, Mitgliedern und Ressourcen geworden. Dieser Blog-Beitrag dokumentiert die wichtigsten Meilensteine und technischen Entwicklungen.

**Auf einen Blick:**
- ✅ Helferliste-Milestone komplett (20/20 Issues)
- ✅ Template-Editor vollständig editierbar
- ✅ Dashboard-Konsolidierung abgeschlossen
- ✅ E-Mail-Benachrichtigungssystem implementiert
- ✅ Umfassende Test-Abdeckung (Unit + E2E)
- ✅ Helfer-Dashboard für authentifizierte Nutzer

---

## 1. Helferliste-Feature: Production-Ready

### Das Problem

Theatergruppen brauchen für jede Aufführung Dutzende Helfer: Kasse, Einlass, Bar, Garderobe, Technik. Die Koordination war bisher eine Mischung aus Excel-Listen, WhatsApp-Gruppen und handgeschriebenen Zetteln.

### Die Lösung

Ein vollständiges Helferliste-System mit drei Ebenen:

```
Helfer-Templates          → Wiederverwendbare Rollen-Vorlagen
    ↓
Helfer-Events            → Konkrete Einsätze (Premiere, Generalprobe)
    ↓
Rollen-Instanzen         → Schichten mit Zeit & Bedarf
    ↓
Anmeldungen              → Wer macht was?
```

### Technische Implementation

**Database Layer (4 Migrationen)**
- `helfer_events` - Events mit Zeitraum und Status
- `helfer_rollen_templates` - Wiederverwendbare Rollen
- `helfer_rollen_instanzen` - Konkrete Schichten pro Event
- `helfer_anmeldungen` - Zuweisungen mit Status-Tracking

Alle Tabellen mit Row Level Security (RLS) und role-based Permissions.

**Backend (6 Server Actions)**
```typescript
// lib/actions/helferliste.ts
export async function createHelferEvent(data: HelferEventCreate)
export async function anmelden(instanzId: string)
export async function anmeldenPublic(token: string, data: PublicRegistration)
```

**Features:**
- ✅ Double-Booking Prevention (Zeitüberschneidung wird geprüft)
- ✅ Public Links für externe Helfer (kein Login nötig)
- ✅ Template-System für wiederkehrende Events
- ✅ Status-Tracking (erforderlich/optional/angemeldet/bestätigt)
- ✅ Bedarfsübersicht mit Live-Berechnung

### E-Mail-Benachrichtigungen (Issue #130)

**Architektur-Entscheidung: Resend**

Nach Evaluation von SendGrid, Nodemailer und Resend haben wir uns für Resend entschieden:

| Kriterium | Warum Resend? |
|-----------|---------------|
| Setup | Minimal - ein API-Key, fertig |
| Next.js Integration | Native `fetch` API, kein SDK nötig |
| Kosten | Gratis bis 3.000 E-Mails/Monat |
| Developer Experience | Exzellent - klare Fehler, gute Logs |

**Implementation Details:**

```typescript
// lib/email/index.ts - Kein SDK, native fetch
export async function sendEmail(options: EmailOptions) {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from, to, subject, html, text }),
  })
}
```

**Notification-Typen:**
- Event publiziert → Alle aktiven Mitglieder
- Anmeldung bestätigt → Angemeldete Person
- Status geändert → Betroffene Person

**Async Fire-and-Forget Pattern:**
```typescript
// User bekommt sofort Feedback, E-Mail wird im Hintergrund versendet
if (result?.id) {
  notifyRegistrationConfirmed(result.id).catch(console.error)
}
```

**Lessons Learned:**
- Inline-Styles für E-Mail-Templates (CSS-Support ist miserabel)
- Immer Plain-Text Fallback generieren
- Graceful Degradation: Feature funktioniert auch ohne E-Mail-Config

### Testing (Issues #132, #133)

**Unit Tests mit Vitest (20+ Tests)**

Challenge: Supabase Query Builder ist chainable. Jede Methode muss `this` zurückgeben.

```typescript
// tests/mocks/supabase.ts
export function createMockQueryBuilder(result: MockQueryResult) {
  return {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue(result),
  }
}
```

**E2E Tests mit Playwright (15+ Tests)**

> **Hinweis:** `helferliste-admin.spec.ts` wurde mit #355 entfernt. Beispiel historisch.

```typescript
// e2e/helferliste-admin.spec.ts (entfernt mit #355)
test('can create a new helfer event', async ({ page }) => {
  await page.goto('/helferliste/neu')  // Route existiert nicht mehr
  await page.fill('input[name="name"]', 'Premiere - Frühling 2026')
  await page.click('button[type="submit"]')
  await expect(page).toHaveURL(/\/helferliste\/[a-z0-9-]+$/)
})
```

**Robuste Selektoren mit Fallbacks:**
```typescript
const button = page.locator(
  'button:has-text("Anmelden"), [data-testid="register-button"]'
).first()
```

### Neues Helfer-Dashboard (PR #318)

Authentifizierte Helfer bekommen jetzt einen eigenen Bereich:

**Route:** `/mein-bereich/meine-einsaetze`

**Features:**
- Kommende Einsätze mit Countdown
- Vergangene Einsätze mit Statistik
- Direktlinks zur Anmeldung
- Mobile-optimiertes Layout

**Implementation:**
```typescript
// Server-side data fetching
const { data: anmeldungen } = await supabase
  .from('helfer_anmeldungen')
  .select('*, helfer_rollen_instanzen(*), helfer_events(*)')
  .eq('person_id', profile.person_id)
  .order('datum_von', { ascending: true })
```

---

## 2. Template-Editor: Vollständig editierbar

### Ausgangslage

Templates für Aufführungen konnten bereits Zeitblöcke, Schichten, Ressourcen, Info-Blöcke und Sachleistungen enthalten. **Problem:** Nur Zeitblöcke und Schichten waren inline editierbar - alles andere musste gelöscht und neu erstellt werden.

### Was ist neu?

#### nur_mitglieder-Flag für Template-Schichten (PR #307)

Bestimmte Schichten (Springer, Kasse, Parkplatz) sollen nur von Vereinsmitgliedern besetzt werden - nicht von externen Helfern über die Mitmachen-Seite.

**Neue Funktionalität:**
- Checkbox "Nur Vereinsmitglieder" in beiden Template-Editoren
- Amber-Badge zur visuellen Kennzeichnung
- Beim Anwenden: `nur_mitglieder: true` → `sichtbarkeit: 'intern'`
- Beim Erstellen aus Aufführung: `sichtbarkeit: 'intern'` → `nur_mitglieder: true`

**Database Migration:**
```sql
ALTER TABLE template_schichten
ADD COLUMN nur_mitglieder BOOLEAN DEFAULT false NOT NULL;
```

#### Inline-Edit für alle Template-Elemente (PRs #308, #309, #310)

**Vorher:** Sachleistung hinzufügen, Tippfehler bemerken, löschen, neu erstellen.
**Nachher:** Bearbeiten-Button, Korrektur, Speichern.

| Element | Editierbare Felder | Pattern |
|---------|-------------------|---------|
| Zeitblöcke | Name, Start/Endzeit, Typ | Inline-Form mit blue theme |
| Schichten | Rolle, Zeitblock, Anzahl, nur_mitglieder | Inline-Form mit purple theme |
| Info-Blöcke | Titel, Beschreibung, Start/Endzeit | Inline-Form mit amber theme |
| Sachleistungen | Name, Anzahl, Beschreibung | Inline-Form with green theme |
| Ressourcen | Menge | Inline-Form with teal theme |

**Einheitliches Pattern:**
```typescript
// components/templates/InfoBloeckeEditor.tsx
<div className="border-l-4 border-amber-500 bg-amber-50">
  {isEditing ? (
    <form>
      <input name="titel" defaultValue={block.titel} />
      <textarea name="beschreibung" defaultValue={block.beschreibung} />
      <button type="submit">Speichern</button>
      <button onClick={cancelEdit}>Abbrechen</button>
    </form>
  ) : (
    <>
      <h4>{block.titel}</h4>
      <p>{block.beschreibung}</p>
      <button onClick={startEdit}>Bearbeiten</button>
    </>
  )}
</div>
```

### Bug-Fix: Zod v4 UUID-Validierung (PRs #311-#315)

**Symptom:** "Ungültige Template-ID" beim Hinzufügen von Sachleistungen nach Deployment.

**Debugging-Verlauf:**

1. **PR #311** - Error-Handling eingebaut → Fehler wurde sichtbar
2. **PR #312** - `template.id` war `undefined` im Client (RSC-Serialisierung)
3. **PR #313** - Gleicher Fix für Admin-Seite
4. **PR #314** - Debug-Info in Fehlermeldung
5. **PR #315** - Root Cause gefunden!

**Root Cause:**

Zod v4 hat breaking Changes bei `.uuid()`. Die Validierung ist jetzt strikt nach RFC 4122:
- Version-Digit (3. Gruppe, 1. Zeichen) muss `1-8` sein
- Variant-Digit muss `8/9/a/b` sein

Unsere Seed-Daten nutzen UUIDs mit Version `0`:
```
a0000000-0000-0000-0000-000000000001  // ❌ Zod v4 lehnt ab
```

**Lösung: Eigener UUID-Helper mit relaxed Regex**

```typescript
// lib/validations/helpers.ts
const UUID_REGEX = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/

export const uuid = (message = 'Ungültige UUID') =>
  z.string().regex(UUID_REGEX, message)
```

**Geändert:** 28+ `.uuid()` Aufrufe in 7 Validierungsdateien.

**Lessons Learned:**
- Major-Version-Upgrades immer gründlich testen
- Server Actions in Next.js 15: Fehler nie stillschweigend schlucken
- `revalidatePath` muss ALLE betroffenen Pfade abdecken
- Seed-UUIDs sollten RFC 4122 v4 Format verwenden

---

## 3. Dashboard-Konsolidierung (PR #317)

### Das Problem

Zwei separate Dashboards für Mitglieder:
- `/dashboard` - Generische Stats, wenig persönlich
- `/mein-bereich` - Vollwertiger persönlicher Bereich

**Resultat:** Mitglieder landeten nach Login auf `/mein-bereich`, das generische Dashboard war unsichtbar. Vorstand hatte sein eigenes Dashboard - verwirrende Doppelstruktur.

### Die Lösung: Ein Dashboard für alle

`/dashboard` ist jetzt die zentrale Startseite für **alle** Rollen:

| Rolle | Dashboard-Typ | Features |
|-------|--------------|----------|
| ADMIN, VORSTAND | Management-Dashboard | 3-Säulen-Layout, Statistiken, Admin-Tools |
| MITGLIED_AKTIV | Persönliches Dashboard | Outlook-Style: Kalender, Profil, Widgets |
| MITGLIED_PASSIV | Vereinfachtes Dashboard | Kalender, Profil, Events, CTA |

### Redirect & Sub-Pages

`/mein-bereich` → Redirect zu `/dashboard`

Sub-Pages bleiben funktional:
- `/mein-bereich/stundenkonto`
- `/mein-bereich/verfuegbarkeit`
- `/mein-bereich/einstellungen`

Back-Links zeigen jetzt auf `/dashboard` statt `/mein-bereich`.

### Mitglieder-Ansicht für Vorstand

Neuer Sidebar-Eintrag: **Mitglieder-Ansicht** (`/dashboard?ansicht=mitglied`)

Der Vorstand kann jetzt das Mitglieder-Dashboard previwen - analog zu den bestehenden Helfer- und Partner-Ansichten.

### Navigation Updates

**Vorher:**
```typescript
// MITGLIED_AKTIV landet auf /mein-bereich
// Sidebar: "Mein Bereich" (home icon)
```

**Nachher:**
```typescript
// MITGLIED_AKTIV landet auf /dashboard
// Sidebar: "Dashboard" (dashboard icon)
```

### revalidatePath Updates

`revalidatePath('/dashboard')` wurde in **8 Server-Action-Dateien** ergänzt (18 Stellen):
- `lib/actions/anmeldungen.ts`
- `lib/actions/helfer-anmeldung.ts`
- `lib/actions/helferliste.ts`
- `lib/actions/helferschichten.ts`
- `lib/actions/notifications.ts`
- `lib/actions/personen.ts`
- `lib/actions/stundenkonto.ts`
- `lib/actions/stundenkonto-erfassung.ts`

**Warum wichtig?** Änderungen an Profil, Anmeldungen, Stundenkonto etc. müssen das Dashboard invalidieren, damit die Daten aktualisiert werden.

### Verifikation

- ✅ `npm run typecheck` - Keine Fehler
- ✅ `npm run lint` - Clean
- ✅ `npm run test:run` - 96/96 Tests passed

---

## 4. Mitglieder-Milestone: URL-State & Export

### Ausgangslage

70% der Arbeit war bereits erledigt - Migrationen existierten lokal, waren aber nie auf die Remote-DB gepusht worden.

**Der Fix:**
```bash
npx supabase db push --include-all
```

5 Issues (#149-#153) mit einem Befehl geschlossen. 🎉

### URL-State-Management (Issue #154)

**Problem:** Filter in der MitgliederTable hatten keinen persistenten State. Refresh = alles weg.

**Lösung: Next.js 15 searchParams**

```typescript
interface PageProps {
  searchParams: Promise<{  // Next.js 15: searchParams ist Promise!
    search?: string
    status?: string
    rolle?: string | string[]  // Array-Parameter
    skills?: string | string[]
    sortBy?: string
    sortOrder?: string
  }>
}

export default async function MitgliederPage({ searchParams }: PageProps) {
  const params = await searchParams  // Await!

  // Array-Parameter normalisieren
  const rollen = params.rolle
    ? Array.isArray(params.rolle)
      ? params.rolle
      : [params.rolle]
    : []
}
```

**Knacknuss: Typed Routes**

Next.js 15 hat experimentelle Typed Routes. Bei dynamischen URLs:

```typescript
// ❌ TypeScript Error
router.push(`/mitglieder?${queryString}`)

// ✅ Workaround
router.push(`/mitglieder${queryString ? `?${queryString}` : ''}` as never)
```

`as never` ist [documented behavior](https://nextjs.org/docs/app/building-your-application/configuring/typescript#statically-typed-links).

### CSV-Export (Issue #155)

**Server-side gewählt:**
- Filter werden serverseitig angewendet (gleiche Query wie Table)
- Keine Client-Memory-Issues bei großen Exports
- Server Actions sind bereits vorhanden

```typescript
// lib/actions/export.ts
export async function exportMitgliederCSV(
  filterParams: MitgliederFilterParams,
  columns: ExportColumn[]
): Promise<{ csv: string; filename: string }> {
  const personen = await getPersonenAdvanced(filterParams)
  // CSV generieren mit konfigurierbaren Spalten
}
```

**Pro-Tipp: BOM für Excel**
```typescript
const blob = new Blob(['\ufeff' + content], { type: 'text/csv;charset=utf-8' })
```

Ohne `\ufeff` (Byte Order Mark) zeigt Excel deutsche Umlaute als Hieroglyphen. Deutscher Content + Excel = **immer** BOM.

---

## 5. Aufführungs-Logistik (Modul 2)

### Features

**Zeitblöcke für Aufführungen**
- Aufbau, Einlass, Pause, Abbau - strukturierter Zeitplan
- Kalenderansicht für alle kommenden Aufführungen

**Schichten & Bedarfsplanung**
- 2 Personen Kasse, 3 beim Einlass, 1 Technik
- Live-Anzeige: Wie viele Helfer fehlen noch?

**Räume & Equipment**
- Automatische Konfliktprüfung
- Warnung bei Doppelbuchungen

**Templates für Routinen**
- Einmal erstellen, immer wiederverwenden
- Zeitblöcke, Schichten, Ressourcen automatisch übernommen

### Technische Details

- 4 neue Datenbank-Migrationen
- 6 Server-Actions für CRUD-Operationen
- Konfliktprüfung für Raum/Ressourcen-Reservierungen
- Bedarfsübersicht mit Live-Berechnung
- Vollständig typisiert mit TypeScript

---

## Statistik & Metriken

### Code-Umfang (letzte 4 Wochen)

| Kategorie | Anzahl |
|-----------|--------|
| Neue Dateien | 35+ |
| Lines of Code | ~4.500 |
| Migrationen | 7 |
| Server Actions | 12 neue/erweiterte |
| React Components | 20+ |
| Unit Tests | 20+ |
| E2E Tests | 15+ |

### Milestone-Fortschritt

```
Total Issues:     75 (36 open, 39 closed)

Progress by Milestone:
├── Modul 0 (Foundation):       55% (6/11)
├── Modul 1 (Vereinsleben):     21% (4/19)
├── Modul 2 (Logistik):        100% (4/4)   ✅
├── Modul 3 (Künstlerisch):     40% (4/10)
├── Helfer Liste:              100% (20/20)  ✅
└── UserExperience:             55% (6/11)
```

### Tech Stack

| Layer | Technologie | Version |
|-------|-------------|---------|
| Frontend | Next.js | 15.5.9 |
| Framework | React | 19.x |
| Language | TypeScript | 5.7.3 |
| Backend | Supabase | Latest |
| Database | PostgreSQL | 15+ |
| Styling | Tailwind CSS | 3.x |
| Testing | Vitest + Playwright | Latest |
| E-Mail | Resend | Native fetch |
| Validation | Zod | 4.x |

---

## Lessons Learned

### 1. Next.js 15 searchParams sind Promises
```typescript
// ❌ Alt
const { search } = searchParams

// ✅ Neu
const params = await searchParams
const { search } = params
```

### 2. Zod v4 Breaking Changes bei UUID
Major-Version-Upgrades immer gründlich testen. Besonders bei Validierungsbibliotheken.

### 3. E-Mail-Benachrichtigungen nie blockierend
```typescript
// ✅ Fire-and-forget
notifyRegistrationConfirmed(id).catch(console.error)
return { success: true }
```

### 4. revalidatePath muss alle Pfade abdecken
Wenn Daten an mehreren Orten angezeigt werden (`/dashboard` + `/mein-bereich`), beide Pfade revalidieren.

### 5. Test-Isolation ist kritisch
```json
// tsconfig.json
"exclude": ["e2e", "tests", "**/*.test.ts"]
```

### 6. BOM für CSV-Export mit deutschen Umlauten
```typescript
const blob = new Blob(['\ufeff' + content], { type: 'text/csv' })
```

### 7. Typed Routes + Dynamic URLs = `as never`
Bei dynamisch generierten URLs ist `as never` Cast die empfohlene Lösung.

---

## Nächste Schritte

### Kurzfristig (1-2 Wochen)
- [ ] CI/CD Pipeline für automatische Tests
- [ ] Performance-Optimierung für große Mitglieder-Listen
- [ ] Notification-Preferences (E-Mails deaktivierbar)
- [ ] Mobile-Optimierung für Helfer-Registrierung

### Mittelfristig (1-2 Monate)
- [ ] Modul 1 (Vereinsleben) abschließen
- [ ] Modul 3 (Künstlerische Planung) vervollständigen
- [ ] Produktionen-Feature (Issue #156, #158)
- [ ] Besetzungs-Management
- [ ] Proben-Planung

### Langfristig (3+ Monate)
- [ ] Öffentliche API für Drittanbieter
- [ ] Mobile App (React Native)
- [ ] Offline-Modus
- [ ] Multi-Tenancy (mehrere Theatergruppen)

---

## Fazit

BackstagePass hat sich in den letzten Wochen von einem Prototyp zu einer production-ready Theater-Management-Plattform entwickelt:

✅ **Vollständiges Helferliste-System** mit E-Mail-Benachrichtigungen
✅ **Template-System** für effiziente Wiederverwendung
✅ **Konsolidierte Navigation** mit rollenbasiertem Dashboard
✅ **Umfassende Test-Abdeckung** (Unit + E2E)
✅ **Robuste Fehlerbehandlung** und Validierung

Die Theatergruppe Widen kann jetzt:
- Aufführungen komplett digital planen
- Helfer effizient koordinieren
- Mitglieder selbstständig verwalten
- Ressourcen konfliktfrei reservieren
- Vorlagen für wiederkehrende Abläufe nutzen

**Der nächste große Schritt:** Integration des Produktions-Workflows (Stücke → Proben → Aufführungen) für einen vollständigen künstlerischen Planungsprozess.

---

*Dieser Blog-Post dokumentiert den Entwicklungsstand von BackstagePass zwischen dem 20. Januar und 16. Februar 2026. BackstagePass ist eine Open-Source Theater-Verwaltungs-App für die Theatergruppe Widen (TGW).*

**Technische Details & Code:** [GitHub Repository](https://github.com/trismus/BackstagePass)
**Team:** AI-gestütztes Entwicklungsteam (Christian, Martin, Peter, Ioannis, Johannes)
**Lizenz:** MIT
