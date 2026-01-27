# Frontend Audit Report by Kim (Maler / UI/UX Designer)

**Date:** 2026-01-27
**Status:** Initial Draft
**Concept Document:** `journal/implementation-briefs/BRIEF-kim-frontend-audit.md`

---

## 📋 Summary of Findings

The `apps/web` frontend exhibits a generally modular structure with good adherence to React best practices for component composition and props. Tailwind CSS is correctly integrated and leveraged for utility-first styling. Key UI components in `apps/web/components/ui` are well-structured and designed for reusability. The `tailwind.config.ts` file provides a robust foundation for color definitions, including thematic and semantic palettes, as well as a defined spacing and border-radius scale.

However, a **critical inconsistency** has been identified in the styling approach that significantly impacts maintainability and consistency. The `apps/web/app/globals.css` file contains `@layer components` definitions that duplicate and conflict with the styling already established within the React UI components. This creates two competing sources of truth for core component styles, leading to potential visual discrepancies and increased maintenance overhead.

---

## 🔍 Identified Inconsistencies & Areas for Cleanup

### 1. 🔴 Critical: Conflicting Styling Sources in `globals.css`

**Observation:**
The `apps/web/app/globals.css` file defines custom classes (`.btn-primary`, `.btn-secondary`, `.card`, `.input`) using `@apply` directives within an `@layer components` block. These classes directly replicate or conflict with the styling logic already present in `apps/web/components/ui/Button.tsx`, `apps/web/components/ui/Input.tsx`, and `apps/web/components/ui/Card.tsx`.

**Examples of Conflict:**
*   **Buttons:** `globals.css`'s `.btn-primary` uses `focus:ring-stage-500`, while `Button.tsx`'s primary variant uses `focus:ring-black`.
*   **Inputs:** `globals.css`'s `.input` uses `focus:border-stage-500 focus:outline-none focus:ring-1 focus:ring-stage-500`, which differs from `Input.tsx`'s `focus:border-black focus:ring-black`.

**Impact:**
*   **Two Sources of Truth:** Developers must check two places for component styling, leading to confusion.
*   **Visual Inconsistencies:** Components might look different depending on whether the `.btn-*` class is used directly or the `<Button>` component is rendered.
*   **Maintenance Burden:** Changes to core component styles require updates in multiple locations.
*   **Reduced Scalability:** Makes it harder to introduce new components or modify existing ones consistently.

**Recommendation:**
*   **High Priority:** Eliminate all custom `@layer components` definitions from `apps/web/app/globals.css`.
*   **Single Source of Truth:** Ensure that `apps/web/components/ui` components (e.g., `Button`, `Input`, `Card`) are the *sole* source of styling for these foundational UI elements, leveraging their props and internal Tailwind classes.
*   **Migration:** Any existing usage of `.btn-primary`, etc., in JSX should be refactored to use the corresponding React component (`<Button variant="primary" />`).

---

### 2. 🟡 Moderate: Tailwind Color Palette - Default `neutral` vs. Defined Semantic

**Observation:**
The `tailwind.config.ts` defines comprehensive thematic, semantic, and status colors. Components like `Button.tsx`, `Input.tsx`, and `Card.tsx` effectively utilize these defined colors (e.g., `primary`, `error`, `success`). However, the `neutral` color palette, which is heavily used (e.g., `text-neutral-700`, `border-neutral-300`, `bg-neutral-100`), relies entirely on Tailwind's default `neutral` scale and is not explicitly extended or overridden in `tailwind.config.ts`.

**Impact:**
*   **Implicit Dependency:** The design implicitly depends on Tailwind's default `neutral` values. A future change in Tailwind's defaults could subtly alter the application's appearance.
*   **Lack of Explicit Brand Neutrality:** If there are specific brand guidelines for neutral tones, they are not explicitly captured in the configuration.

**Recommendation:**
*   **Explicitly Define Neutral Palette (if needed):** If the project has specific "neutral" brand colors, explicitly extend the `neutral` palette in `tailwind.config.ts` to ensure these are locked in. If Tailwind's defaults are the intended neutral colors, consider adding a comment to `tailwind.config.ts` to signify this intentional choice.

---

### 3. 🟢 Low: Spinner Icon Management

**Observation:**
The loading spinner SVG is directly embedded within `apps/web/components/ui/Button.tsx`.

**Impact:**
*   **Duplication Risk:** If other components require a spinner, the SVG code might be duplicated, leading to inconsistencies in appearance or animation if not carefully managed.
*   **Maintenance:** Changing the spinner's design or animation requires updating every instance.

**Recommendation:**
*   **Dedicated Spinner Component:** Create a dedicated `Spinner.tsx` component in `apps/web/components/ui` that encapsulates the SVG and its animation logic. Components like `Button.tsx` can then import and use this `Spinner` component.

---

### 4. 🟢 Low: Hardcoded German Text in Components

**Observation:**
The loading text "Laden..." is hardcoded in German within `apps/web/components/ui/Button.tsx`.

**Impact:**
*   **Internationalization Challenge:** For a future multi-language application, this text would need to be externalized.
*   **Consistency:** If other loading indicators use different phrasing, it could lead to minor inconsistencies.

**Recommendation:**
*   **Internationalization (Future):** For now, note this as an i18n candidate. If/when i18n is implemented, this should be refactored to use a translation key.

---

## 🎨 Suggestions for Improvement (Overall)

1.  **Enforce Component-Based Styling:** Clearly communicate and enforce the rule that styling for core UI elements should exclusively reside within their respective React components in `apps/web/components/ui`, utilizing Tailwind CSS classes directly or via `@apply` within component files (if preferred, but ideally direct utility classes for flexibility).
2.  **Design System Documentation:** While the code implies a design system, formal documentation (even a simple Markdown file) outlining color palettes (thematic, semantic, neutral), typography scales, spacing units, and component usage guidelines would greatly benefit future development and onboarding.
3.  **Code Consistency Tooling:** Ensure ESLint and Prettier are configured to enforce consistent code formatting and potentially detect certain styling pattern violations (though direct styling logic is harder to lint).

---

## ✅ Next Steps

This report will be shared with Greg (Springer), Peter (Kulissenbauer), and Martin (Bühnenmeister) to discuss findings and define actionable work packages for cleanup and improvement.
