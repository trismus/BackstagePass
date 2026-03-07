# ADR: System A als primaeres Helfer-Registrierungssystem

**Status:** Accepted
**Date:** 2026-03-07
**Author:** Peter (Developer)
**Issue:** #421

## Context

Das Projekt hat zwei parallele Systeme fuer die Helfer-Registrierung entwickelt:

### System B (Legacy)

- **Tabellen:** `auffuehrung_schichten`, `auffuehrung_zuweisungen`, `zeitbloecke`
- **Actions:** `lib/actions/external-registration.ts`
- **Routes:** `/helfer/anmeldung/[token]`, `/helfer/abmeldung/[token]`
- **Zweck:** Urspruengliches System fuer Aufführungs-basierte Helfer-Registrierung
- **Identifikation:** Ueber `public_helfer_token` auf `veranstaltungen`

### System A (Aktuell)

- **Tabellen:** `helfer_events`, `helfer_rollen_templates`, `helfer_rollen_instanzen`, `helfer_anmeldungen`
- **Actions:** `lib/actions/helferliste.ts`, `lib/actions/public-overview.ts`
- **Routes:** `/mitmachen` (oeffentliche Uebersicht), `/helfer/[token]` (Einzel-Event)
- **Zweck:** Flexibles System mit eigenstaendigen Events, Rollen-Templates und atomaren Buchungen
- **Features:** Multi-Rollen-Buchung, Warteliste, Zeitkonflikt-Erkennung, ICS-Export

System A wurde als Nachfolger entwickelt, weil System B zu stark an die Aufführungsstruktur (`veranstaltungen` + `zeitbloecke`) gekoppelt war und keine flexiblen Helfer-Events unterstuetzte.

## Decision

**System A ist das primaere System fuer alle neuen Helfer-Registrierungen.**

- `/mitmachen` zeigt ausschliesslich System-A-Daten (`helfer_events` + `helfer_rollen_instanzen`)
- Neue Features (z.B. Dashboard, Bestaetigungsmails, ICS-Export) werden nur fuer System A entwickelt
- System-B-Code in `external-registration.ts` ist als `@deprecated` markiert
- System-B-Routes bleiben fuer bestehende Links erhalten (Backwards Compatibility)

## Consequences

### Positive

- Klare Richtung: alle Entwicklung konzentriert sich auf System A
- Weniger Verwirrung bei parallelen Systemen
- System-A-Features (atomare Buchungen, Warteliste) sind robuster

### Negative

- System-B-Code bleibt als technische Schuld im Projekt
- Zwei Abmeldungs-Mechanismen: System B ueber `auffuehrung_zuweisungen.abmeldung_token`, System A ueber `helfer_anmeldungen.abmeldung_token`

### Verbleibende System-B-Referenzen

Die folgenden Dateien enthalten noch System-B-Logik und bleiben fuer Backwards Compatibility:

| Datei | Zweck | Status |
|-------|-------|--------|
| `lib/actions/external-registration.ts` | System-B Registrierung + Token-Validierung | `@deprecated`, bleibt fuer `/helfer/anmeldung/[token]` |
| `app/(public)/helfer/anmeldung/[token]/page.tsx` | Oeffentliche System-B Anmeldungs-Seite | Bleibt fuer bestehende Links |
| `app/(public)/helfer/abmeldung/[token]/page.tsx` | Oeffentliche System-B Abmeldungs-Seite | Bleibt fuer bestehende Links |
| `app/(public)/helfer/abmeldung/[token]/actions.ts` | System-B Stornierungsaktion | Bleibt fuer bestehende Links |
| `app/(public)/helfer/abmeldung/[token]/CancellationForm.tsx` | System-B Stornierungsformular | Bleibt fuer bestehende Links |
| `components/public-registration/` | System-B Registrierungs-Komponenten | Genutzt von `/helfer/anmeldung/[token]` |

### Spaetere Aufraeum-Optionen

- Wenn keine bestehenden System-B-Links mehr aktiv sind (z.B. nach einer Saison), koennen die System-B-Routes und `external-registration.ts` komplett entfernt werden
- DB-Tabellen (`auffuehrung_schichten`, `auffuehrung_zuweisungen`, `zeitbloecke`) werden weiterhin intern fuer die Aufführungsverwaltung genutzt und duerfen NICHT geloescht werden

## Related

- `lib/actions/public-overview.ts` - System-A: oeffentliche Uebersicht + Multi-Registrierung
- `lib/actions/helferliste.ts` - System-A: Kern-Buchungslogik (`anmeldenPublicMulti`)
- `lib/actions/external-registration.ts` - System-B: deprecated Registrierungslogik
- ADR-001: Offset-Based Template Times (verwandtes Template-System)
