# 🎨 Issue 0.0: UI/UX Design-Vorgaben & Component Style Guide (Modul 0)

**Status:** 🟡 In Progress
**GitHub:** https://github.com/trismus/BackstagePass/issues/104
**Milestone:** Modul 0
**Priority:** 🔴 CRITICAL (Blocking)
**Zugewiesen:** Kim (Maler/UI/UX Designer)

---

## 🎯 Ziel

Sicherstellen, dass **alle UI/UX Design-Vorgaben komplett in die Implementierung von Modul 0 eingenommen werden**. Klare, wiederverwendbare Design-Leitlinien für Konsistenz über alle Components.

**KIM's ANMERKUNGEN (26.01.2026):**
> Issue ist gut strukturiert, aber zu ambitioniert für Modul 0 Auth-Only.
> **Empfehlung:** Fokussieren auf Auth-Module (Login/Register), later expandieren.
> Phase 1 (DIESE SPRINT): Essentiell (Farben, Typografie, Spacing, Responsive)
> Phase 2 (NÄCHSTER SPRINT): Polish (Breakpoints, Storybook, Dark Mode Foundation)

---

## 📋 Aufgaben - PRIORISIERT

### Phase 1️⃣ (MODUL 0 AUTH - DIESE SPRINT)

#### 1A. Design System Essentiell
- [ ] **Farb-Palette** definieren (MINIMAL)
  - ✅ Primary: #111111 (existiert already - siehe tailwind.config.ts)
  - ✅ Secondary: #2EBD85 (existiert - Accent)
  - ✅ Neutral (Gray Scale) - 5-7 Grau-Stufen
  - ✅ Status Colors: Success (Green), Error (Red), Warning (Orange), Info (Blue)
  - 📝 Hex-Codes dokumentieren + Tailwind Class Names
  
- [ ] **Typografie** dokumentieren (STARTER-SET)
  - ✅ Font-Familie: Inter (existiert)
  - ✅ Font-Größen: 14px (Body), 16px (Input), 18px (Heading), 24px (Page Title), 32px (Hero)
  - ✅ Font-Gewichte: Regular (400), Medium (500), Bold (700)
  - ✅ Line-Height: 1.5 (Body), 1.3 (Heading)
  
- [ ] **Spacing/Grid** definieren (4px Base)
  - ✅ Base Unit: 4px (Tailwind Default)
  - ✅ Scale: 4, 8, 12, 16, 24, 32, 48px
  - ✅ Gap Standards: `gap-2` (8px), `gap-4` (16px), `gap-6` (24px)
  
- [ ] **Breakpoints** für Auth (MOBILE-FIRST)
  - ✅ Mobile: 320px (default)
  - ✅ Desktop: 1024px (md breakpoint)
  - ⏳ Tablet: later (768px)
  - ⏳ Extra-Large: later (1920px)
  
- [ ] **Border-Radius** Standards (SIMPLE)
  - ✅ Small: 4px (inputs)
  - ✅ Medium: 8px (cards)
  - ✅ Large: 16px (buttons)
  - ✅ Full: 9999px (pills/circles)
  
- [ ] **Shadow** System (2 STUFEN)
  - ✅ Small: Für Cards (0 2px 4px rgba...)
  - ✅ Medium: Für Modals (0 10px 25px rgba...)

#### 1B. Auth-Components (KERNEL)
- [ ] **Button** Komponenten (4 Varianten)
  - Primary, Secondary, Danger, Disabled
  - ✅ States: Normal, Hover, Focused, Loading
  - ❌ Nicht mehr: Multiple variants
  
- [ ] **Input-Felder** (ESSENTIELL)
  - Text, Email, Password
  - ✅ States: Default, Focused, Error, Disabled
  - ❌ Nicht: Multiple size variants für Phase 1
  
- [ ] **Form Layouts** (SIMPLE)
  - Label placement
  - Error Messages (clear + red)
  - Success States
  
- [ ] **Cards** (FÜR PROFILE)
  - Minimal styling
  - Hover state
  
- [ ] **Modal/Dialog** (LOGIN CONFIRMATION)
  - Header, Body, Footer
  - Close Button
  - Dark Overlay
  
- [ ] **Toast/Alerts** (SUCCESS + ERROR)
  - Success (Green), Error (Red), Info (Blue)
  - Auto-Close nach 5s
  - ❌ Nicht: Warning variant für Phase 1

#### 1C. Design Dokumentation (ESSENTIELL)
- [ ] **Tailwind CSS Config aktualisieren**
  - `tailwind.config.ts` mit Design-Tokens
  - ✅ Colors (Primary, Secondary, Neutral, Status)
  - ✅ Typography Scales
  - ✅ Spacing Utilities
  
- [ ] **Komponenten-Specs dokumentieren**
  - `docs/design-system.md` (oder direkt in Codebase)
  - Farb-Codes (Hex + Tailwind Class)
  - Typografie-Skala (Größen, Gewichte)
  - Spacing Rules
  - Component Sizes & Padding
  
- [ ] **Accessibility Checklist (WCAG 2.1 AA)**
  - Color Contrast ≥ 4.5:1 für Text
  - Focus States sichtbar (Ring/Outline)
  - Keyboard Navigation (Tab, Enter, Escape)
  - Form Labels mit Input verbunden
  - Error Messages deutlich & beschreibend

#### 1D. Reference Assets (VISUAL)
- [ ] **Logo/Branding**
  - Logo in 32px, 48px, 64px
  - Favicon
  
- [ ] **Icon Set**
  - Tabler Icons oder Heroicons
  - Für Auth: 16px, 20px, 24px
  - Icons: user, mail, lock, eye, check, x, alert
  
- [ ] **Screenshots (Mobile + Desktop)**
  - Login Page
  - Signup Page
  - Error States
  - Mobile Responsive Check (375px)

---

### Phase 2️⃣ (LATER - NÄCHSTER SPRINT)

**Nicht für Modul 0, aber planen:**
- [ ] Storybook Setup (Component Gallery)
- [ ] Breakpoints verfeinern (Tablet)
- [ ] Dark Mode Foundation (CSS Vars)
- [ ] Navigation Components (Sidebar, Header)
- [ ] Table Component für Admin
- [ ] More Icon Variants

---

## ✅ Akzeptanzkriterien (FÜR PHASE 1)
  - Keine
  - Small Shadow (für Cards)
  - Medium Shadow (für Modals)
  - Large Shadow (für Dropdowns)

### 2️⃣ Component Styles (Auth Module)

#### Buttons
- [ ] **Primary Button** (CTA)
  - Default, Hover, Active, Disabled, Loading States
  - Sizes: Small, Medium, Large
  
- [ ] **Secondary Button** (Alternative Action)
- [ ] **Danger Button** (Delete, Logout)
- [ ] **Text Button** (Link-Style)

#### Form Components
- [ ] **Text Input**
  - Default, Focused, Error, Disabled States
  - Placeholder Styling
  - Label Styling
  
- [ ] **Email Input**
- [ ] **Password Input** (mit Show/Hide Toggle)
- [ ] **Checkbox** und **Radio** Components
- [ ] **Error Messages** Styling
- [ ] **Success Messages** (Password Reset Confirmation)
- [ ] **Helper Text** unter Inputs

#### Layout Components
- [ ] **Cards** für Profile/Benutzerlisten
  - Hover States
  - Border vs. Shadow Varianten
  
- [ ] **Modal/Dialog**
  - Header, Body, Footer
  - Close Button
  - Backdrop Styling
  
- [ ] **Alerts/Toast**
  - Success (Green)
  - Error (Red)
  - Warning (Orange)
  - Info (Blue)
  - Duration/Auto-Close Verhalten
  
- [ ] **Navigation Components**
  - Header/Navbar
  - Sidebar (optional für Admin)
  - Breadcrumbs
  - Active/Inactive States

#### Tables
- [ ] **User Table** für Admin Panel
  - Header Styling
  - Row Hover States
  - Alternating Row Colors (optional)
  - Pagination Style

### 3️⃣ Design-Dokumentation

- [ ] **Tailwind CSS Config**
  - theme.extend mit Custom Farben, Spacing, etc.
  - `tailwind.config.ts` aktualisiert
  
- [ ] **CSS Variables** (Optional)
  - `--color-primary`, `--color-secondary`, etc.
  - `--spacing-base`, `--spacing-unit`, etc.
  
- [ ] **Accessibility (a11y)**
  - WCAG 2.1 AA Compliance
  - Color Contrast Ratios dokumentiert
  - Focus States visible
  - Keyboard Navigation Support
  
- [ ] **Dark Mode** (Optional für Phase 1)
  - Tailwind Dark Mode Config
  - Color Palette für Dark Mode
  
- [ ] **Responsive Design Guidelines**
  - Mobile-First Approach
  - Breakpoint-spezifische Styles
  - Fluid Sizing Patterns

### 4️⃣ Design Assets

- [ ] **Logo/Branding**
  - Logo in verschiedenen Größen (32px, 48px, 64px, etc.)
  - Favicon
  
- [ ] **Icon Set**
  - Empfehlung: Tabler Icons, Heroicons, Feather Icons
  - Größen: 16px, 20px, 24px, 32px
  
- [ ] **Beispiel-Screenshots**
  - Login Page
  - Signup Page
  - Dashboard Page
  - Profile Page
  - Admin User Management
  - Admin Roles Page
  
- [ ] **Mobile Mockups**
  - Responsive Validierung auf iPhone/Tablet Größen

---

## ✅ Akzeptanzkriterien (FÜR PHASE 1)

**ALLE PUNKTE MÜSSEN ERFÜLLT SEIN:**

- [ ] **Design System dokumentiert**
  - Farb-Codes (Hex + Tailwind Classes)
  - Typografie-Skala (mit Beispielen)
  - Spacing Rules
  - Component Sizes & Padding

- [ ] **Tailwind Config aktualisiert**
  - `tailwind.config.ts` hat Design-Tokens
  - Neue Colors defined (Primary, Secondary, Status)
  - Typography Scales ready
  
- [ ] **Auth-Components standardisiert**
  - Button (4 Varianten): Primary, Secondary, Danger, Disabled
  - Input (3 Typen): Text, Email, Password
  - Form Layouts (Label, Error, Success)
  - Modal (Login Modal)
  - Toast (Success, Error nur)
  - ✅ All follow same design palette

- [ ] **Spacing & Typografie konsistent**
  - Alle Buttons nutzen same Padding
  - Alle Inputs nutzen same Font-Size
  - Gap Standards eingehalten (4, 8, 16, 24px)

- [ ] **Responsive Design getestet**
  - ✅ Mobile (320px - Login/Signup lesbar)
  - ✅ Desktop (1024px - Scales up sauber)
  - ⏳ Tablet (768px) → Phase 2

- [ ] **Accessibility erfüllt (WCAG 2.1 AA)**
  - Color Contrast ≥ 4.5:1 (getestet mit WebAIM)
  - Focus States sichtbar (Outline Ring mindestens 2px)
  - Keyboard Navigation (Tab, Enter, Escape funktioniert)
  - Form Labels korrekt mit Inputs verbunden
  - Error Messages klar & rot + beschreibend
  - ✅ Getestet im Browser Devtools (Lighthouse a11y)

- [ ] **Design-Referenz für Peter bereit**
  - Screenshots (Login, Signup, Error States)
  - Figma Link oder Storybook Link
  - Component Specs dokumentiert
  - Color Codes zum copy-pasten

- [ ] **Ioannis kann Design-Compliance checken**
  - PR Review Template mit Design-Checks
  - "Does this match the design system?" Frage beantwortbar

---

## 📊 Timeline & Abhängigkeiten

**Dauer:** 3-5 Tage (mit parallel Peter Input)

**Workflow:**
```
Tag 1: Design System def. + Tailwind Config
  ↓
Tag 2: Auth-Components + Screenshots
  ↓
Tag 3: Accessibility Audit + Peter Feedback
  ↓
Tag 4: Refinements
  ↓
Tag 5: Final Doku + PR Ready
```

**BLOCKING für:**
- Peter (Kulissenbauer) - braucht Design-Referenz für Implementation
- Ioannis (Kritiker) - braucht Compliance Checklist für Reviews

**Sollte VOR oder PARALLEL erfolgen:**
- Christian's User Stories (Modul 0 Auth Flow)
- Martin's Tech Plan (Database + Auth API)

**Optional:** 
- Kim + Peter Daily Sync (30min) für Early Feedback

---

## 🤝 Zusammenarbeit

**Kim ↔ Peter (CRITICAL):**
- Peter braucht visuelle Referenz, nicht nur Text
- Early Screenshot-Review (50% done)
- Component Implementation Feedback Loop

**Kim ↔ Ioannis (IMPORTANT):**
- Design Compliance Checklist für PR Reviews
- a11y Audit von Ioannis
- Color Contrast Validation

**Kim ↔ Christian & Greg:**
- Modul 0 Scope Klarheit (nur Auth? oder Dashboard?)
- Design Budget (wie viel Zeit pro Component?)

---

## 📚 Bestehende Design-Dokumentation

✅ **Bereits vorhanden:**

1. **tailwind.config.ts** - Farb-Palette already defined
   - `stage` (Rot/Orange für Theater)
   - `curtain` (Lila)
   - `spotlight` (Gelb)
   - Neutral colors
   
2. **globals.css** - Component Classes
   - `.btn-primary`, `.btn-secondary`
   - `.card` class
   - Base Styling

3. **page.tsx (Home)** - Design Tokens Preview
   ```
   Design-Token: Primary #111111 · Accent #2EBD85 · Radius 24px
   ```

4. **RolleBadge.tsx** - Color-coded Components
   - Beispiel für Status-Farben
   - Tailwind Class Pattern

**KIM's PLAN:**
1. Consolidate all bestehende Styling
2. Document it properly
3. Extend für Auth-Components
4. Create Single Source of Truth (`docs/design-system.md`)

---

## 💭 KIM's Notes & Bedenken

### Was gut läuft:
✅ Tailwind schon configured  
✅ Color Palette already existiert  
✅ Components partially styled  

### Was braucht Attention:
⚠️ Keine zentrale Design-Dokumentation (alles verteilt in Code)  
⚠️ Keine Component Gallery / Storybook (Peter muss Code lesen)  
⚠️ Responsive nicht konsistent getestet  
⚠️ a11y Checklist fehlt (Ioannis braucht das!)  

### KIM's Ask:
1. **Modul 0 Scope**: Klare Definition (nur Auth oder Auth + Dashboard?)
2. **Peter's Time**: Für Code Review Mid-Sprint (nicht erst am Ende)
3. **Ioannis' Support**: Für a11y Audit (nicht optional!)

---

## 🎨 VISION (Post-Modul 0)

Langfristig (Modul 1+):
- Storybook für Component Gallery
- Design Tokens als JSON
- Dark Mode Support
- Multiple Themes?
- Brand Guidelines Document

---

## 📝 Status Tracking

**Erstellt:** 2026-01-25 (Initial)  
**Updated:** 2026-01-26 (Kim's Review & Prioritization)  
**Next Review:** Nach Phase 1 Completion

**Aktuelle Owner:** Kim (UI/UX Designer)  
**Collaborators:** Peter (Kulissenbauer), Ioannis (Kritiker), Christian (Regisseur)

---

*Last updated by Kim (Maler)*  
*Next: Peter starts Implementation basierend auf these Specs*
  - [ ] Keyboard Navigation funktioniert
  - [ ] Form Labels verbunden mit Inputs
  - [ ] Error Messages deutlich
- [ ] **Kulissenbauer** hat klare Design-Referenz für Implementation
- [ ] **Kritiker** kann Design-Compliance in Code Review checken
- [ ] **Keine technischen Schulden** durch inconsistentes Styling

---

## 📚 Design-Referenzen

**Bitte vom Maler bereitstellen:**

1. **Design File** (Figma, Adobe XD, oder ähnlich)
   - Link: [TBD]
   - Read-Only Access für Team

2. **Design System Document**
   - Farb-Palette mit Codes
   - Typografie Scale
   - Component Specifications
   - Spacing Rules
   
3. **Component Showcase**
   - Screenshots/Mockups für jeden Component State
   - Vor/Nach Vergleiche (falls Redesign)

4. **Design Guidelines**
   - Brand Guidelines (Tonalität, Stil)
   - Interaction Patterns
   - Microinteractions (Hover, Feedback, etc.)

---

## 🔗 Abhängigkeiten

**BLOCKING für:**
- ✅ Issue #88 – 0.1 Authentifizierung
- ✅ Issue #89 – 0.2 Profil & Benutzerverwaltung
- ✅ Issue #90 – 0.3 Rollen & Permissions
- ✅ Issue #91 – 0.4 Audit Log

**Workflow:**
```
Design Issue (0.0) → In Progress
        ↓
   Maler erstellt Design
        ↓
   Kulissenbauer implementiert (parallel möglich)
        ↓
   Kritiker überprüft Design-Compliance
```

---

## 🚨 Priority & Timeline

| Aspekt | Wert |
|--------|------|
| **Priority** | 🔴 CRITICAL |
| **Type** | 🎨 Design |
| **Zugewiesen** | Maler (UI/UX Designer) |
| **Target Date** | ASAP (parallel zu Tech Plan Review) |
| **Blocking** | JA (für alle anderen Modul 0 Issues) |

---

## 💬 Kommunikation

**Empfohlen:**
- Tägliche Sync zwischen Maler & Kulissenbauer während Implementation
- Kritiker sollte Design-Specs in Code Review prüfen
- Chronist dokumentiert Design Decisions in ADR (Architecture Decision Record)

---

## 📝 Notes

- ⚠️ **Design sollte in diesem Issue vollständig dokumentiert sein** – keine Ad-Hoc Decisions während Implementation
- 🎨 **Accessibility ist nicht optional** – WCAG 2.1 AA minimum
- 📱 **Responsive Design ist nicht optional** – Mobile-First Approach
- 🎯 **Konsistenz ist Ziel** – einmal definiert, überall angewendet
- 🔄 **Iteration ist erlaubt** – aber erst NACH Feature-Complete, nicht während Implementation

---

**Status:** ✅ Ready for Maler
**Erstellt durch:** Springer
**Datum:** 2026-01-26
**Nächster Step:** Maler beginnt Design-Dokumentation

*Diese Issue ist CRITICAL für die Qualität von Modul 0. Bitte prioritär behandeln! 🚀*
