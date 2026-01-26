# BackstagePass Design System

Dieses Dokument definiert die UI/UX Standards für BackstagePass.

## Farbpalette

### Primary (Theater-Rot)
Hauptfarbe für Buttons, Links und Fokus-States.

| Name | Hex | Tailwind |
|------|-----|----------|
| primary-50 | `#fef3f2` | `bg-primary-50` |
| primary-100 | `#fee4e2` | `bg-primary-100` |
| primary-500 | `#ef4444` | `bg-primary-500` |
| **primary-600** | `#dc2626` | `bg-primary` |
| primary-700 | `#b91c1c` | `bg-primary-700` |

### Secondary (Vorhang-Lila)
Sekundäre Aktionen und Akzente.

| Name | Hex | Tailwind |
|------|-----|----------|
| secondary-50 | `#fdf4ff` | `bg-secondary-50` |
| secondary-500 | `#d946ef` | `bg-secondary-500` |
| **secondary-600** | `#c026d3` | `bg-secondary` |
| secondary-700 | `#a21caf` | `bg-secondary-700` |

### Status-Farben

| Status | Hex | Tailwind | Verwendung |
|--------|-----|----------|------------|
| Success | `#16a34a` | `text-success` | Erfolgsmeldungen |
| Error | `#dc2626` | `text-error` | Fehlermeldungen |
| Warning | `#f59e0b` | `text-warning` | Warnungen |
| Info | `#3b82f6` | `text-info` | Informationen |

### Neutral (Graustufen)
Standard Tailwind `neutral-*` Palette für Text, Borders und Backgrounds.

---

## Typografie

**Font-Familie:** Inter (via `font-sans`)

### Schriftgrößen

| Größe | Tailwind | Verwendung |
|-------|----------|------------|
| 12px | `text-xs` | Badges, Meta-Text |
| 14px | `text-sm` | Labels, Buttons, Body |
| 16px | `text-base` | Body Text |
| 18px | `text-lg` | Section Headings |
| 24px | `text-2xl` | Page Titles |

### Schriftgewichte

| Gewicht | Tailwind | Verwendung |
|---------|----------|------------|
| 400 | `font-normal` | Body Text |
| 500 | `font-medium` | Labels, Buttons |
| 600 | `font-semibold` | Headings |

---

## Spacing

**Base Unit:** 4px (Tailwind Standard)

| Wert | Tailwind | Verwendung |
|------|----------|------------|
| 4px | `gap-1`, `p-1` | Tight |
| 8px | `gap-2`, `p-2` | Compact |
| 16px | `gap-4`, `p-4` | Standard |
| 24px | `gap-6`, `p-6` | Relaxed |
| 32px | `gap-8`, `p-8` | Spacious |

---

## Border Radius

| Größe | Wert | Tailwind | Verwendung |
|-------|------|----------|------------|
| Small | 4px | `rounded-sm` | Inputs |
| Default | 8px | `rounded` | Buttons, Cards |
| Large | 12px | `rounded-lg` | Modals |
| XL | 16px | `rounded-xl` | Hero Cards |
| 2XL | 24px | `rounded-2xl` | Large Cards |
| Full | 9999px | `rounded-full` | Badges, Pills |

---

## Komponenten

### Button

Import: `import { Button } from '@/components/ui'`

```tsx
<Button variant="primary">Speichern</Button>
<Button variant="secondary">Abbrechen</Button>
<Button variant="danger">Löschen</Button>
<Button variant="ghost">Mehr</Button>
<Button loading>Laden...</Button>
<Button size="sm">Klein</Button>
<Button size="lg">Groß</Button>
```

**Varianten:**
- `primary` - Hauptaktion (Theater-Rot)
- `secondary` - Sekundäre Aktion (Weiß mit Border)
- `danger` - Destruktive Aktion (Rot)
- `ghost` - Transparenter Button

**Größen:** `sm`, `md` (default), `lg`

### Input

Import: `import { Input } from '@/components/ui'`

```tsx
<Input label="E-Mail" type="email" placeholder="name@beispiel.de" />
<Input label="Passwort" type="password" error="Pflichtfeld" />
<Input label="Name" helperText="Wie sollen wir dich nennen?" />
```

**Props:**
- `label` - Label über dem Input
- `error` - Fehlermeldung (rot)
- `helperText` - Hilfstext (grau)

### Card

Import: `import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui'`

```tsx
<Card>
  <CardHeader>
    <CardTitle>Titel</CardTitle>
    <CardDescription>Beschreibung</CardDescription>
  </CardHeader>
  <CardContent>Inhalt</CardContent>
  <CardFooter>
    <Button>Aktion</Button>
  </CardFooter>
</Card>
```

**Props:**
- `padding` - `none`, `sm`, `md` (default), `lg`
- `hover` - Hover-Effekt aktivieren

### Alert

Import: `import { Alert } from '@/components/ui'`

```tsx
<Alert variant="success">Erfolgreich gespeichert!</Alert>
<Alert variant="error">Ein Fehler ist aufgetreten.</Alert>
<Alert variant="warning">Achtung: Ungespeicherte Änderungen.</Alert>
<Alert variant="info">Tipp: Nutze Tastenkürzel für schnelleres Arbeiten.</Alert>
```

**Varianten:** `success`, `error`, `warning`, `info`

---

## Accessibility (WCAG 2.1 AA)

### Farbkontrast
- Text auf Hintergrund: mindestens 4.5:1
- Große Text (18px+): mindestens 3:1
- UI-Komponenten: mindestens 3:1

### Focus States
Alle interaktiven Elemente haben sichtbare Focus-Ringe:
```css
focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
```

### Keyboard Navigation
- `Tab` - Navigation zwischen Elementen
- `Enter` / `Space` - Aktivierung
- `Escape` - Schließen von Modals/Dropdowns

### Form Labels
Alle Inputs müssen mit Labels verbunden sein:
```tsx
<label htmlFor="email">E-Mail</label>
<input id="email" type="email" />
```

Die `<Input>` Komponente macht das automatisch.

---

## Responsive Breakpoints

| Name | Breite | Tailwind |
|------|--------|----------|
| Mobile | < 640px | Default |
| Tablet | ≥ 640px | `sm:` |
| Desktop | ≥ 1024px | `lg:` |
| Wide | ≥ 1280px | `xl:` |

**Ansatz:** Mobile-First. Styles ohne Prefix gelten für Mobile.

---

## Best Practices

1. **Konsistenz:** Nutze immer die definierten Komponenten
2. **Semantic Colors:** Nutze `primary`, `error`, etc. statt `stage-600`, `red-600`
3. **Spacing Scale:** Halte dich an die 4px-Einheiten (gap-2, gap-4, gap-6)
4. **Focus States:** Nie `outline-none` ohne `focus:ring-*`
5. **Mobile First:** Schreibe Mobile-Styles zuerst, dann `sm:`, `lg:`
