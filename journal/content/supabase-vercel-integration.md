# Supabase + Vercel: Die Lazy-Dev Integration

**Autor:** TechGeekNote
**Datum:** 2026-01-24
**Tags:** `supabase` `vercel` `next.js` `devops`

---

## TL;DR

Supabase hat eine native Vercel-Integration. Ein Klick, fertig. Keine manuellen Environment Variables, kein Copy-Paste von Keys. Die Integration synct automatisch alle Credentials in dein Vercel-Projekt.

---

## Das Problem

Jeder kennt es: Neues Projekt, Supabase aufgesetzt, jetzt noch schnell die Keys in Vercel eintragen...

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Drei Keys. Drei Environments (Production, Preview, Development). Das sind 9 manuelle Einträge. Und wehe, du rotierst mal einen Key...

## Die Lösung: Native Integration

Supabase und Vercel haben das Problem erkannt und eine **offizielle Integration** gebaut.

### Setup in 60 Sekunden

1. **Supabase Dashboard öffnen**
   ```
   https://supabase.com/dashboard/project/[DEIN-PROJEKT]/settings/integrations
   ```

2. **Vercel Integration aktivieren**
   - Klick auf "Vercel" unter Integrations
   - "Add Integration" wählen
   - Mit Vercel Account verbinden (OAuth)

3. **Projekt auswählen**
   - Wähle dein Vercel-Projekt
   - Bestätige die Berechtigungen

4. **Fertig.**

### Was passiert im Hintergrund?

Die Integration setzt automatisch folgende Environment Variables in Vercel:

| Variable | Beschreibung | Environments |
|----------|--------------|--------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Projekt-URL | all |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public Key (RLS!) | all |
| `SUPABASE_SERVICE_ROLE_KEY` | Admin Key (nur Server!) | production |
| `POSTGRES_URL` | Direct DB Connection | all |
| `POSTGRES_PRISMA_URL` | Prisma-optimierte URL | all |
| `POSTGRES_URL_NON_POOLING` | Für Migrationen | all |

**Bonus:** Bei Key-Rotation werden die Vercel Variables automatisch aktualisiert.

---

## Code: Sofort loslegen

Nach der Integration kannst du direkt coden:

```typescript
// lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
```

Oder mit dem neuen `@supabase/ssr` Package für Next.js App Router:

```typescript
// lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )
}
```

---

## Preview Deployments: Der Hidden Gem

Die Integration erstellt automatisch **Branch-spezifische Supabase-Instanzen** für Preview Deployments (optional).

Das bedeutet:
- `main` → Production Supabase
- `feature/xyz` → Eigene Preview-DB

Keine Angst mehr, dass ein PR die Prod-Daten zerschießt.

---

## Wann NICHT nutzen?

- **Multi-Tenant Setup:** Wenn du mehrere Supabase-Projekte pro Vercel-Projekt brauchst
- **Custom Key Handling:** Wenn du Keys aus einem Vault (HashiCorp, AWS Secrets Manager) ziehst
- **Monorepo mit unterschiedlichen DBs:** Hier wird's frickelig

---

## Fazit

Die Supabase-Vercel-Integration ist ein No-Brainer für jeden, der beide Services nutzt. Setup in unter einer Minute, automatische Key-Rotation, Preview-DB-Support.

**Zeit gespart:** ~15 Minuten pro Projekt
**Fehlerquellen eliminiert:** Copy-Paste-Fails, vergessene Environments
**Developer Experience:** 10/10

---

## Links

- [Supabase Vercel Integration Docs](https://supabase.com/docs/guides/integrations/vercel)
- [Vercel Integration Marketplace](https://vercel.com/integrations/supabase)
- [Next.js + Supabase Quickstart](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)

---

*Happy shipping!* 🚀
