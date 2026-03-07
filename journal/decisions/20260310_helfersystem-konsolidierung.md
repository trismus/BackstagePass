# ADR: Helfersystem-Konsolidierung -- System B als fuehrendes System

**Status:** Akzeptiert

**Datum:** 2026-03-10

**Ersetzt:** [20260307_helfer-registrierung-system-a](./20260307_helfer-registrierung-system-a.md)

## Kontext

Im Projekt existierten drei parallele Helfersysteme:

| System | Tabellen | Zweck |
|--------|----------|-------|
| **Legacy** | `helfereinsaetze`, `helferrollen`, `helferschichten` | Urspruengliches Helfersystem |
| **System A** | `helfer_events`, `helfer_rollen_templates`, `helfer_rollen_instanzen`, `helfer_anmeldungen` | Eigenstaendige Helferliste mit Token-Zugang |
| **System B** | `veranstaltungen`, `zeitbloecke`, `auffuehrung_schichten`, `auffuehrung_zuweisungen` | Auffuehrungen mit Schicht-/Helferplanung |

Eine Gap-Analyse gegen die Produktowner-Prozessdefinition (8 Phasen des Helfermanagements) ergab:

- **System B** deckt **6 von 8 Phasen** nativ ab (Planung, Schichterstellung, Zuweisung, Durchfuehrung, Stundenbuchung, Reporting)
- **System A** deckt **4 von 8 Phasen** ab (Registrierung, Slot-Booking, Warteliste, Abmeldung)
- System A hat Staerken bei der oeffentlichen Registrierung, aber Schwaechen bei Management-Workflows
- System B ist tiefer in die bestehende Veranstaltungsstruktur integriert

## Entscheidung

**System B** (`veranstaltungen` -> `zeitbloecke` -> `auffuehrung_schichten` -> `auffuehrung_zuweisungen`) wird das fuehrende Helfersystem. Neue Helfer-Features werden ausschliesslich in System B entwickelt.

**System A** (`helfer_events`) wird **eingefroren**:
- Bestehende Daten bleiben aktiv und zugaenglich
- Keine neuen Features oder Erweiterungen
- Bestehende Registrierungen (Token-Links) funktionieren weiterhin

**Legacy** (`helfereinsaetze`) wurde bereits bereinigt und ist nicht mehr in Verwendung.

## Konsequenzen

### Positiv
- Ein klares fuehrendes System fuer alle Helfer-Features
- Tiefe Integration mit Veranstaltungsmanagement, Templates, Stundenkonto
- Kein Feature-Dualismus mehr bei Neuentwicklungen

### Negativ
- System A Code bleibt im Codebase (eingefroren, nicht entfernt)
- Dashboard muss weiterhin beide Systeme anzeigen (`system: 'a' | 'b'`)
- Oeffentliche Registrierungs-Features von System A muessen langfristig nach System B migriert werden

### Feature-Matrix

| Feature | System A | System B | Anmerkung |
|---------|----------|----------|-----------|
| Oeffentliche Registrierung | Ja (Token) | Geplant | Migration noetig |
| Atomares Slot-Booking | Ja | Nein | System-A-Staerke |
| Warteliste | Ja | Nein | System-A-Staerke |
| Schicht-Templates | Nein | Ja | System-B-Staerke |
| Management-UI | Basis | Vollstaendig | `/auffuehrungen` |
| Stundenbuchung | Nein | Ja | Integration |
| ICS-Export | Ja | Ja | Beide Systeme |
| Dashboard | Ja | Ja | Dual-Anzeige |
| Abmeldung (oeffentlich) | Ja (Token) | Ja (Token) | Beide Systeme |
| `/mitmachen` | System A | Geplant: System B | Migration noetig |

### Auswirkungen auf bestehende Routen

| Route | System | Status |
|-------|--------|--------|
| `/helfer/[token]` | A | Eingefroren, funktioniert |
| `/mitmachen` | A | Eingefroren, zeigt System-A-Daten |
| `/auffuehrungen` | B | Aktiv, fuehrendes System |
| `/helferliste` (protected) | A | Eingefroren |
| `/meine-einsaetze` | A + B | Aktiv, zeigt beide Systeme |

## Verwandte Entscheidungen

- [ADR-001: Offset-Based Template Times](./ADR-001-offset-based-template-times.md)
