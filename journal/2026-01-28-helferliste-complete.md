# Tech Blog: Helferliste Feature - Von der Implementierung zur Production-Readiness

> **Historischer Eintrag:** Die eigenständigen `/helferliste`-Admin-Routes wurden am 2026-02-17
> mit Issue #355 (PR #356) entfernt. Die Funktionalität ist jetzt in `/mitmachen` und
> `/auffuehrungen/[id]/helferliste` integriert. Öffentliche Helfer-Registrierung (`/helfer/[token]`)
> und DB-Struktur bleiben erhalten.

**Datum:** 28. Januar 2026
**Autor:** Greg (AI Development Assistant)
**Tags:** #NextJS #Testing #Email #Supabase #Playwright #Vitest

---

## Einleitung

Mit dem heutigen Release schliessen wir den **Helfer Liste Milestone** ab - eines der Kernfeatures von BackstagePass. Dieses Feature ermöglicht es Theatervereinen, Helfer für Aufführungen und Events zu koordinieren. In diesem Blogpost dokumentiere ich die technischen Entscheidungen und Implementierungsdetails der letzten drei Issues: E-Mail-Benachrichtigungen, Unit Tests und End-to-End Tests.

## Ausgangslage

Die Helferliste war bereits funktional:
- Admins können Helfer-Events erstellen und Rollen definieren
- Mitglieder können sich für Rollen anmelden
- Externe Helfer können sich über öffentliche Links registrieren
- Double-Booking-Prevention verhindert Zeitkonflikte

Was fehlte: **Automatische Benachrichtigungen** und **umfassende Tests**.

---

## Teil 1: E-Mail-Benachrichtigungen (#130)

### Architektur-Entscheidung: Resend

Für den E-Mail-Versand haben wir uns für **Resend** entschieden:

| Kriterium | Resend | SendGrid | Nodemailer |
|-----------|--------|----------|------------|
| Setup-Komplexität | Minimal | Mittel | Hoch |
| Next.js Integration | Native | SDK | Manuell |
| Kosten (Startups) | Gratis bis 3k/Monat | Gratis bis 100/Tag | Infrastruktur |
| Developer Experience | Exzellent | Gut | Variabel |

### Implementierung

Die E-Mail-Infrastruktur besteht aus drei Schichten:

```
lib/email/
├── index.ts              # Resend API Client
└── templates/
    └── helferliste.ts    # HTML/Text Templates
```

**1. Der Email Service (`lib/email/index.ts`)**

```typescript
export async function sendEmail(options: EmailOptions): Promise<EmailResult> {
  const apiKey = process.env.RESEND_API_KEY

  if (!apiKey) {
    console.warn('RESEND_API_KEY not set - email not sent')
    return { success: false, error: 'Email service not configured' }
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: `${fromName} <${fromEmail}>`,
      to: Array.isArray(options.to) ? options.to : [options.to],
      subject: options.subject,
      html: options.html,
      text: options.text,
    }),
  })

  // ...
}
```

**Key Decision:** Wir nutzen die native `fetch` API statt des Resend SDK. Das reduziert Bundle-Size und Dependencies.

**2. Templates mit Inline-Styles**

E-Mail-Clients sind notorisch schlecht bei CSS-Support. Unsere Templates nutzen Inline-Styles:

```typescript
const baseStyles = `
  .container { max-width: 600px; margin: 0 auto; }
  .header { background: #1a1a2e; color: white; padding: 20px; }
  .button { background: #3b82f6; color: white; padding: 12px 24px; }
  .status-bestaetigt { background: #d1fae5; color: #047857; }
`
```

Wir generieren sowohl HTML als auch Plain-Text Versionen für maximale Kompatibilität.

**3. Asynchrone Integration**

E-Mails werden **fire-and-forget** gesendet, um die User Experience nicht zu blockieren:

```typescript
// In anmelden()
if (result?.id) {
  notifyRegistrationConfirmed(result.id, false).catch(console.error)
}
```

Der User erhält sofort Feedback, während die E-Mail im Hintergrund versendet wird.

### Notification-Typen

| Event | Empfänger | Template |
|-------|-----------|----------|
| Event publiziert | Alle aktiven Mitglieder | `eventPublishedEmail` |
| Anmeldung bestätigt | Angemeldete Person | `registrationConfirmationEmail` |
| Status geändert | Betroffene Person | `statusUpdateEmail` |

---

## Teil 2: Unit & Integration Tests (#132)

### Test-Stack: Vitest

Vitest ist der natürliche Nachfolger von Jest für Vite/Next.js Projekte:

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      include: ['lib/actions/**/*.ts'],
    },
  },
})
```

### Mocking-Strategie

Server Actions greifen direkt auf Supabase zu. Für Tests mocken wir den Client:

```typescript
// tests/mocks/supabase.ts
export function createMockQueryBuilder(result: MockQueryResult) {
  const builder = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue(result),
    // ... chainable methods
  }
  return builder
}
```

**Challenge:** Supabase Query Builder ist chainable. Jede Methode muss `this` zurückgeben.

### Test-Beispiele

**Erfolgreicher Fall:**
```typescript
it('creates a new event and returns success', async () => {
  mockSupabase.from.mockReturnValue({
    insert: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({
      data: { id: 'new-event-1' },
      error: null,
    }),
  })

  const result = await createHelferEvent({ name: 'Test', ... })

  expect(result.success).toBe(true)
  expect(result.id).toBe('new-event-1')
})
```

**Fehlerfall:**
```typescript
it('prevents double registration', async () => {
  mockSupabase.from.mockReturnValue({
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({
      data: existingAnmeldung,  // Already registered
      error: null,
    }),
  })

  const result = await anmelden('instanz-1')

  expect(result.success).toBe(false)
  expect(result.error).toBe('Bereits angemeldet')
})
```

### Testabdeckung

| Action | Tests | Abgedeckt |
|--------|-------|-----------|
| `getHelferEvents` | 3 | ✅ |
| `createHelferEvent` | 2 | ✅ |
| `updateHelferEvent` | 2 | ✅ |
| `deleteHelferEvent` | 1 | ✅ |
| `anmelden` | 2 | ✅ |
| `abmelden` | 2 | ✅ |
| `anmeldenPublic` | 3 | ✅ |
| ... | ... | ... |

---

## Teil 3: End-to-End Tests (#133)

### Playwright Setup

```typescript
// playwright.config.ts
export default defineConfig({
  testDir: './e2e',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
})
```

### Test-Organisation

> **Hinweis:** `helferliste-admin.spec.ts` und `helferliste-member.spec.ts` wurden mit #355 entfernt.

```
e2e/
├── helpers/
│   └── auth.ts           # Login/Logout Helpers
└── helferliste-public.spec.ts   # Public Registration (erhalten)
```

### Authentication Helper

```typescript
export async function login(page: Page, user: TestUser): Promise<void> {
  await page.goto('/login')
  await page.fill('input[name="email"]', user.email)
  await page.fill('input[name="password"]', user.password)
  await page.click('button[type="submit"]')
  await page.waitForURL(/\/(dashboard|mein-bereich)/)
}
```

### Beispiel: Admin Workflow Test (historisch, Route entfernt mit #355)

```typescript
test('can create a new helfer event', async ({ page }) => {
  await page.goto('/helferliste/neu')  // Route existiert nicht mehr

  await page.fill('input[name="name"]', 'E2E Test Event')

  const futureDate = new Date()
  futureDate.setDate(futureDate.getDate() + 30)
  await page.fill('input[name="datum_start"]', futureDate.toISOString().slice(0, 16))

  await page.click('button[type="submit"]')

  // Verify redirect to detail page
  await expect(page).toHaveURL(/\/helferliste\/[a-z0-9-]+$/)
  await expect(page.locator('text=E2E Test Event')).toBeVisible()
})
```

### Robuste Selektoren

Wir nutzen mehrere Fallback-Selektoren für Flexibilität:

```typescript
const registerButton = page.locator(
  'button:has-text("Anmelden"), button:has-text("Registrieren"), [data-testid="register-button"]'
).first()
```

Dies macht Tests robuster gegenüber UI-Änderungen.

---

## Learnings & Best Practices

### 1. Notifications nie blockierend

```typescript
// ❌ Schlecht - blockiert Response
await notifyRegistrationConfirmed(id)
return { success: true }

// ✅ Gut - fire and forget
notifyRegistrationConfirmed(id).catch(console.error)
return { success: true }
```

### 2. Graceful Degradation

```typescript
export function isEmailConfigured(): boolean {
  return !!process.env.RESEND_API_KEY
}

// In Notifications
if (!isEmailConfigured()) {
  return { success: true, sent: 0, errors: 0 }
}
```

Feature funktioniert auch ohne konfigurierte E-Mails.

### 3. Test-Isolation

```typescript
// tsconfig.json
"exclude": ["e2e", "tests", "**/*.test.ts"]
```

Test-Dateien werden vom Production-Build ausgeschlossen.

### 4. Plain Text Fallback

E-Mails haben immer eine Text-Version:

```typescript
return {
  subject,
  html: `<html>...</html>`,
  text: `Hallo ${name},\n\nDeine Anmeldung...`
}
```

---

## Metriken

| Metrik | Wert |
|--------|------|
| Neue Dateien | 16 |
| Lines of Code | ~2'300 |
| Unit Tests | 20+ |
| E2E Tests | 15+ |
| E-Mail Templates | 3 |

---

## Nächste Schritte

1. **Test-Datenbank Setup** - Dedizierte DB für E2E Tests
2. **CI Integration** - GitHub Actions für automatische Tests
3. **E-Mail Tracking** - Öffnungsraten, Bounces
4. **Notification Preferences** - User können E-Mails deaktivieren

---

## Fazit

Mit dieser Implementierung ist die Helferliste **production-ready**:
- Automatische Benachrichtigungen halten alle Beteiligten informiert
- Unit Tests sichern die Business Logic ab
- E2E Tests validieren komplette User Journeys

Der Helfer Liste Milestone ist damit zu **100% abgeschlossen** (20/20 Issues).

---

*Dieser Blogpost wurde im Rahmen der BackstagePass Entwicklung erstellt. BackstagePass ist eine Vereinsverwaltungs-App für die Theatergruppe Widen.*
