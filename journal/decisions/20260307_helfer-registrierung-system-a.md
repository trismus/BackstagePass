# ADR: Helfer-Registrierung via System A (Helferliste)

**Status:** Ersetzt durch [20260310_helfersystem-konsolidierung](./20260310_helfersystem-konsolidierung.md)

**Datum:** 2026-03-07

## Kontext

Fuer die oeffentliche Helfer-Registrierung wurde System A (helfer_events, helfer_rollen_templates, helfer_rollen_instanzen, helfer_anmeldungen) als primaeres System gewaehlt. Die Entscheidung basierte auf der Tatsache, dass System A eine vollstaendige oeffentliche Registrierung mit Token-basiertem Zugang, atomarem Slot-Booking und Wartelisten-Logik bot.

## Entscheidung

System A wurde als fuehrendes System fuer die oeffentliche Helfer-Registrierung implementiert:
- `/helfer/[token]` fuer Einzelevent-Registrierung
- `/mitmachen` fuer Multi-Event-Uebersicht
- Atomare Buchung via `book_helfer_slot()` / `book_helfer_slots()`
- Automatische Warteliste bei vollen Slots

## Status-Aenderung

Diese Entscheidung wurde am 2026-03-10 durch die Helfersystem-Konsolidierung ersetzt. System B (Auffuehrungen) ist nun das fuehrende System fuer neue Helfer-Features. System A bleibt aktiv fuer bestehende Daten, wird aber nicht weiterentwickelt.

Siehe: [20260310_helfersystem-konsolidierung.md](./20260310_helfersystem-konsolidierung.md)
