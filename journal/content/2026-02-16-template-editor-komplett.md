# BackstagePass Update: Template-Editor vollständig editierbar + Zod v4 Bug-Fix

**Was bisher geschah:** Templates für Aufführungen konnten bereits Zeitblöcke, Schichten, Ressourcen, Info-Blöcke und Sachleistungen enthalten. Zeitblöcke und Schichten waren inline editierbar — alle anderen Elemente konnte man nur hinzufügen oder entfernen. Ausserdem fehlte die Möglichkeit, Schichten im Template als "nur für Vereinsmitglieder" zu markieren.

## Was ist neu?

### nur_mitglieder-Flag für Template-Schichten (#307)

Bestimmte Schichten (Springer, Kasse, Parkplatz, Bar) sollen nur von Vereinsmitgliedern besetzt werden — nicht von externen Helfern über die Mitmachen-Seite. Bisher musste man nach dem Anwenden eines Templates die Sichtbarkeit jeder Schicht manuell umstellen. Jetzt gibt es ein `nur_mitglieder`-Flag direkt im Template:

- Checkbox "Nur Vereinsmitglieder" in beiden Template-Editoren
- Amber-Badge zur visuellen Kennzeichnung
- Beim Anwenden: `nur_mitglieder: true` wird zu `sichtbarkeit: 'intern'`
- Beim Erstellen aus einer Aufführung: `sichtbarkeit: 'intern'` wird zu `nur_mitglieder: true`
- Neue DB-Migration: `nur_mitglieder BOOLEAN DEFAULT false NOT NULL`

### Inline-Edit für alle Template-Elemente (#308, #309, #310)

Alle fünf Template-Bestandteile sind jetzt inline editierbar — im Template-Detail-Editor und in den Admin-Editoren:

| Element | Editierbare Felder | Editor |
|---------|-------------------|--------|
| Zeitblöcke | Name, Start/Endzeit, Typ | Detail + Admin |
| Schichten | Rolle, Zeitblock, Anzahl, nur_mitglieder | Detail + Admin |
| Info-Blöcke | Titel, Beschreibung, Start/Endzeit | Detail + Admin |
| Sachleistungen | Name, Anzahl, Beschreibung | Detail + Admin |
| Ressourcen | Menge | Detail |

Jedes Element folgt dem gleichen Pattern: Bearbeiten-Button, Inline-Formular mit farblich passendem Theme, Speichern/Abbrechen, Fehleranzeige.

## Bug-Fix: Zod v4 UUID-Validierung (#311–#315)

Nach dem Deployment konnten keine Sachleistungen erstellt oder gespeichert werden. Die Fehlersuche führte über mehrere Stationen zum eigentlichen Problem:

### Symptom
"Ungültige Template-ID" beim Hinzufügen von Sachleistungen — die Fehlermeldung war zuvor unsichtbar, weil `handleAddSachleistung` das Ergebnis der Server Action nicht prüfte.

### Debugging-Verlauf
1. **#311** — Error-Handling eingebaut + `revalidatePath` für Admin-Pfad ergänzt → Fehler wurde sichtbar
2. **#312** — `template.id` war `undefined` im Client → templateId als separaten Prop übergeben (RSC-Serialisierung verliert `id`)
3. **#313** — Gleicher Fix für Admin-Seite und beide TemplateForm-Komponenten
4. **#314** — Debug-Info in Fehlermeldung eingebaut → zeigt empfangenen template_id-Wert

### Root Cause (#315)
**Zod v4 Breaking Change**: `.uuid()` validiert strikt nach RFC 4122 — der Version-Digit (3. Gruppe, 1. Zeichen) muss `1-8` sein, der Variant-Digit muss `8/9/a/b` sein. Unsere Seed-Daten verwenden UUIDs mit Version `0` (z.B. `a0000000-0000-0000-0000-000000000001`), die Zod v4 ablehnt.

### Lösung
Alle 28+ `z.string().uuid()` Aufrufe in 7 Validierungsdateien durch einen eigenen `uuid()` Helper mit relaxed Regex ersetzt:

```typescript
const UUID_REGEX =
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/
const uuid = (message = 'Ungültige UUID') =>
  z.string().regex(UUID_REGEX, message)
```

### Lessons Learned
- Bei Major-Version-Upgrades (Zod v3 → v4) Validierungsverhalten prüfen
- Server Actions in Next.js 15: Fehler immer prüfen und anzeigen, nie stillschweigend schlucken
- `revalidatePath` muss ALLE Pfade abdecken, die die gleichen Daten anzeigen
- Seed-UUIDs sollten idealerweise RFC 4122 v4 Format verwenden

## Unter der Haube

- 1 neue Datenbank-Migration
- 4 neue Server Actions (`updateTemplateInfoBlock`, `updateTemplateSachleistung`, `updateTemplateRessource`, `updateTemplateRessource`)
- 4 neue Zod-Validierungsschemas
- Type-Erweiterung: `TemplateSchicht.nur_mitglieder`
- Anpassungen in `applyTemplate()`, `generateSchichtenFromTemplate()`, `createTemplateFromVeranstaltung()`
- `revalidateTemplate()` Helper für duale Pfad-Revalidierung
- `uuid()` Helper in allen 7 Validierungsdateien
- `templateId` als expliziter Prop in TemplateDetailEditor und Admin-Editoren

## Abgeschlossene PRs

- #307 feat: add nur_mitglieder flag to template shifts
- #308 feat: add inline edit for template Info-Blöcke
- #309 feat: add inline edit for template Sachleistungen
- #310 feat: add inline edit for template Ressourcen
- #311 fix: revalidate admin template path and add error handling
- #312 fix: pass templateId explicitly to TemplateDetailEditor
- #313 fix: pass templateId explicitly to all admin template editors
- #314 debug: show template_id in validation error (temporär)
- #315 fix: replace Zod v4 .uuid() with relaxed regex for seed UUIDs

## Betroffene Dateien

- `supabase/migrations/20260216100000_template_schichten_nur_mitglieder.sql`
- `apps/web/lib/supabase/types.ts`
- `apps/web/lib/validations/modul2.ts` (+ 6 weitere Validierungsdateien)
- `apps/web/lib/actions/templates.ts`
- `apps/web/lib/actions/schicht-generator.ts`
- `apps/web/app/(protected)/templates/[id]/page.tsx`
- `apps/web/app/(protected)/admin/schicht-templates/[id]/page.tsx`
- `apps/web/components/templates/TemplateDetailEditor.tsx`
- `apps/web/components/templates/TemplateForm.tsx`
- `apps/web/components/admin/templates/TemplateForm.tsx`
- `apps/web/components/admin/templates/SchichtenEditor.tsx`
- `apps/web/components/admin/templates/InfoBloeckeEditor.tsx`
- `apps/web/components/admin/templates/SachleistungenEditor.tsx`

---

*BackstagePass – Damit hinter den Kulissen alles klappt.*
