# BackstagePass Design System

Inspiriert von [Uber's Base Design System](https://base.uber.com/) – minimalistisch, kontrastreich und accessibility-first.

## Prinzipien

1. **Schwarz & Weiß zuerst** – Hoher Kontrast, klare Hierarchie
2. **Eine Akzentfarbe** – Theater-Rot für CTAs und wichtige Aktionen
3. **4px Grid** – Konsistentes Spacing überall
4. **Dead Simple** – Weniger ist mehr
5. **Accessibility First** – WCAG 2.1 AA minimum

---

## Farben

### Core Colors

| Rolle | Wert | Tailwind | Verwendung |
|-------|------|----------|------------|
| **Black** | `#000000` | `text-black`, `bg-black` | Primary Text, Buttons |
| **White** | `#FFFFFF` | `text-white`, `bg-white` | Backgrounds |
| **Accent** | `#dc2626` | `text-primary`, `bg-primary` | CTAs, Links, Focus |

### Neutral Scale

| Name | Hex | Tailwind |
|------|-----|----------|
| 50 | `#fafafa` | `bg-neutral-50` |
| 100 | `#f5f5f5` | `bg-neutral-100` |
| 200 | `#e5e5e5` | `border-neutral-200` |
| 300 | `#d4d4d4` | `border-neutral-300` |
| 500 | `#737373` | `text-neutral-500` |
| 600 | `#525252` | `text-neutral-600` |
| 900 | `#171717` | `text-neutral-900` |

### Status Colors (sparsam verwenden)

| Status | Hex | Tailwind |
|--------|-----|----------|
| Success | `#16a34a` | `text-success` |
| Error | `#dc2626` | `text-error` |
| Warning | `#f59e0b` | `text-warning` |
| Info | `#3b82f6` | `text-info` |

---

## Typografie

**Font:** Inter (System-fallback: -apple-system, sans-serif)

### Type Scale (4px Grid)

| Größe | px | Tailwind | Verwendung |
|-------|-----|----------|------------|
| Display | 48px | `text-5xl` | Hero Headlines |
| Heading 1 | 32px | `text-3xl` | Page Titles |
| Heading 2 | 24px | `text-2xl` | Section Headers |
| Heading 3 | 20px | `text-xl` | Card Titles |
| Body | 16px | `text-base` | Paragraphs |
| Label | 14px | `text-sm` | Labels, Buttons |
| Caption | 12px | `text-xs` | Meta, Badges |

### Gewichte

| Gewicht | Tailwind | Verwendung |
|---------|----------|------------|
| Regular (400) | `font-normal` | Body Text |
| Medium (500) | `font-medium` | Labels, UI |
| Semibold (600) | `font-semibold` | Headings |
| Bold (700) | `font-bold` | Emphasis |

### Line Height

- **Headings:** 1.2 (`leading-tight`)
- **Body:** 1.5 (`leading-normal`)

---

## Spacing (4px Grid)

Alle Abstände basieren auf 4px:

| Token | px | Tailwind |
|-------|-----|----------|
| 1 | 4px | `p-1`, `gap-1` |
| 2 | 8px | `p-2`, `gap-2` |
| 3 | 12px | `p-3`, `gap-3` |
| 4 | 16px | `p-4`, `gap-4` |
| 6 | 24px | `p-6`, `gap-6` |
| 8 | 32px | `p-8`, `gap-8` |
| 12 | 48px | `p-12`, `gap-12` |
| 16 | 64px | `p-16`, `gap-16` |

**Empfohlene Abstände:**
- Zwischen Formfeldern: `gap-4` (16px)
- Zwischen Sections: `gap-8` oder `gap-12`
- Card Padding: `p-6` (24px)
- Button Padding: `px-4 py-2`

---

## Border Radius

Uber-Style: Eher subtil, nicht zu rund.

| Token | Wert | Tailwind | Verwendung |
|-------|------|----------|------------|
| None | 0 | `rounded-none` | Sharp edges |
| Small | 4px | `rounded` | Inputs, small buttons |
| Medium | 8px | `rounded-lg` | Cards, buttons |
| Large | 12px | `rounded-xl` | Modals, large cards |
| Full | 9999px | `rounded-full` | Pills, avatars |

---

## Shadows

Subtil und funktional:

| Level | Tailwind | Verwendung |
|-------|----------|------------|
| None | `shadow-none` | Flat UI |
| Small | `shadow-sm` | Cards, elevated content |
| Medium | `shadow-md` | Dropdowns, popovers |
| Large | `shadow-lg` | Modals |

---

## Komponenten

### Button

```tsx
import { Button } from '@/components/ui'

// Primary (Schwarz) – Hauptaktion
<Button>Speichern</Button>

// Secondary (Weiß mit Border) – Alternative
<Button variant="secondary">Abbrechen</Button>

// Danger (Rot) – Destruktiv
<Button variant="danger">Löschen</Button>

// Ghost (Transparent) – Tertiär
<Button variant="ghost">Mehr</Button>

// Loading State
<Button loading>Laden...</Button>

// Sizes
<Button size="sm">Klein</Button>
<Button size="lg">Groß</Button>
```

### Input

```tsx
import { Input } from '@/components/ui'

<Input
  label="E-Mail"
  type="email"
  placeholder="name@beispiel.de"
/>

<Input
  label="Passwort"
  type="password"
  error="Pflichtfeld"
/>

<Input
  label="Name"
  helperText="Wird öffentlich angezeigt"
/>
```

### Card

```tsx
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui'

<Card>
  <CardHeader>
    <CardTitle>Titel</CardTitle>
    <CardDescription>Kurze Beschreibung</CardDescription>
  </CardHeader>
  <CardContent>
    Inhalt hier...
  </CardContent>
</Card>
```

### Alert

```tsx
import { Alert } from '@/components/ui'

<Alert variant="success">Gespeichert!</Alert>
<Alert variant="error">Fehler aufgetreten</Alert>
<Alert variant="warning">Achtung!</Alert>
<Alert variant="info">Hinweis</Alert>
```

---

## Layout

### Container

```tsx
<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
  {/* Content */}
</div>
```

### Grid

```tsx
// 2 Spalten auf Desktop
<div className="grid gap-6 lg:grid-cols-2">

// 3 Spalten auf Desktop
<div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
```

---

## Responsive Breakpoints

Mobile-First Approach:

| Breakpoint | Breite | Tailwind |
|------------|--------|----------|
| Mobile | < 640px | Default |
| Tablet | ≥ 640px | `sm:` |
| Desktop | ≥ 1024px | `lg:` |
| Wide | ≥ 1280px | `xl:` |

---

## Accessibility

### Kontrast
- Text: mindestens **4.5:1** auf Hintergrund
- Große Text (24px+): mindestens **3:1**
- Schwarz auf Weiß: **21:1** ✓

### Focus States
Immer sichtbar, nie entfernen:
```css
focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2
```

### Keyboard
- `Tab` – Navigation
- `Enter` / `Space` – Aktivierung
- `Escape` – Schließen

### ARIA
- Labels für alle Inputs
- Rollen für interaktive Elemente
- Live Regions für dynamische Inhalte

---

## Do's & Don'ts

### ✅ Do

- Schwarz für primäre Aktionen
- Viel Weißraum lassen
- 4px Grid einhalten
- Kontrast prüfen
- Focus States sichtbar

### ❌ Don't

- Zu viele Farben mischen
- Kleine Schrift (< 12px)
- Schatten übertreiben
- Focus States entfernen
- Inkonsistente Abstände

---

## Referenzen

- [Uber Base Design System](https://base.uber.com/)
- [Base Web Components](https://baseweb.design/)
- [Tailwind CSS](https://tailwindcss.com/)
