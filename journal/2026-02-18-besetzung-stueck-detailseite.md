# BesetzungsMatrix auf Stück-Detailseite

**Datum:** 2026-02-18
**PR:** #397

## Kontext

Die Besetzung (Person → Rolle Zuweisung) konnte bisher nur auf der Produktions-Detailseite verwaltet werden. Da die `auto_invite_probe_teilnehmer` Funktion auf Stück-Level `besetzungen` basiert, war es wichtig, diese auch direkt auf der Stück-Detailseite pflegen zu können.

Es gibt zwei getrennte Systeme:
- **Stück-Level** (`besetzungen` Tabelle) — einfach: Person + Rolle + Typ (haupt/zweit/ersatz)
- **Produktion-Level** (`produktions_besetzungen` Tabelle) — erweitert: + Status (offen/vorgemerkt/besetzt/abgesagt)

Die bestehende `BesetzungsMatrix` in `components/produktionen/` ist an das Produktions-System gebunden. Es brauchte eine neue, einfachere Komponente für Stück-Level Besetzungen.

## Implementierung

### Neue Komponente `StueckBesetzungen`
- Client-Komponente in `components/stuecke/StueckBesetzungen.tsx`
- Rollen gruppiert nach Typ (Hauptrolle, Nebenrolle, Ensemble, Statisterie)
- Fortschrittsbalken zeigt Anteil besetzter Rollen (mit Hauptbesetzung)
- Pro Rolle: Haupt-/Zweit-/Ersatzbesetzung mit Avatar-Initialen
- Inline-Editor: Klick auf Rolle öffnet Person-Select + Besetzungstyp-Dropdown
- Entfernen-Button (×) pro Zuweisung
- Warnung-Highlight für unbesetzte Rollen (`bg-warning-50/30`)
- Nutzt bestehende Server Actions `createBesetzung()` und `deleteBesetzung()`

### Integration in Stück-Detailseite
- `getRollenMitBesetzungen(id)` zum bestehenden `Promise.all` hinzugefügt
- Sektion zwischen SzenenRollenMatrix und Szenen/Rollen-Listen eingefügt

## Geänderte Dateien

| Datei | Änderung |
|-------|----------|
| `components/stuecke/StueckBesetzungen.tsx` | Neue Komponente (Client) |
| `components/stuecke/index.ts` | Barrel export ergänzt |
| `app/(protected)/stuecke/[id]/page.tsx` | `getRollenMitBesetzungen` + `StueckBesetzungen` integriert |

## Design-Entscheidungen

| Entscheidung | Begründung |
|-------------|------------|
| Eigene Komponente statt Produktions-BesetzungsMatrix wiederverwenden | Stück-Level hat keine Status-Filter, keinen Import, keinen Zuweisungen-Generator |
| Inline-Editor statt Dialog | Schnellere Bedienung, visuell konsistent mit RollenList-Pattern |
| Fortschrittsbalken nur auf Hauptbesetzung basiert | Zweit-/Ersatzbesetzungen sind optional, Hauptbesetzung ist das Kriterium für «besetzt» |
| Personen-Dropdown filtert bereits zugewiesene | Verhindert Duplikate auf DB-Ebene |
