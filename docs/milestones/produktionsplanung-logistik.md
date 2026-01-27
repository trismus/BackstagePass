# 🧩 Milestone: Produktionsplanung – Logistischer Prozess (Aufführungen & Helfereinsätze)

**Ziel:** Die Planung von Aufführungsserien, Ressourcen, Helferschichten und Helferprofilen in klar getrennten Ebenen abbilden (Serie → Aufführung → Organisation → Personen).

## Scope (Ergebnisbild)
- Aufführungsserien als Master‑Planungsebene mit Status‑Flow (Draft → Planung → Publiziert → Abgeschlossen)
- Automatische Generierung von Aufführungen (Datumsliste/Wiederholungslogik + Ausnahmen + Sondervorstellungen)
- Ressourcenbedarf (Räume, Technik, Material) je Aufführung mit Default‑Vorlagen
- Schichttemplates → konkrete, buchbare Schichten mit Slot‑Logik und Status
- Ausschreibung intern/extern inkl. Link/QR und Sichtbarkeitssteuerung
- Einheitliche Helferprofile mit Typen (Mitglied/Extern/Freund) + Zugehörigkeiten
- Partnervereine mit Kontingenten und Erfüllungsgrad
- Anmeldeflow inkl. Konfliktprüfung, Slot‑Verwaltung und Kurzregistrierung
- Backoffice‑Steuerung, Export, Nachbearbeitung & Historie

## Issues / Feature Requests
1. **Aufführungsserie anlegen & verwalten**  
   **Feature:** Serie mit Titel, Produktion, Standard‑Ort/Zeiten, Standard‑Ressourcen, Standard‑Schichttemplates und Status‑Flow.  
   **Akzeptanzkriterien:** Serie speichert Defaults; Statuswechsel auditierbar.

2. **Aufführungen aus Serie generieren**  
   **Feature:** Generierung per Datumsliste oder Wiederholungslogik (z. B. Fr–So), inkl. Ausnahmen & Sondervorstellungen.  
   **Akzeptanzkriterien:** Jede Aufführung ist eigenständig, bleibt aber mit der Serie verknüpft.

3. **Ressourcenbedarf pro Aufführung**  
   **Feature:** Ressourcen (Räume/Technik/Material) als nicht‑personale Planungsebene mit fix/variabel‑Logik.  
   **Akzeptanzkriterien:** Ressourcen‑Defaults können pro Aufführung überschrieben werden.

4. **Schichttemplates definieren**  
   **Feature:** Wiederverwendbare Templates mit Rolle, Zeitfenster, Slot‑Anzahl und optionalen Qualifikationen.  
   **Akzeptanzkriterien:** Templates serienweit definierbar, mehreren Aufführungen zuweisbar.

5. **Schichten aus Templates erzeugen**  
   **Feature:** Konkrete Schichten pro Aufführung mit Start/Endzeit, Slots und initialem Status „offen“.  
   **Akzeptanzkriterien:** Schichten sind buchbar und zeigen Belegungsgrad.

6. **Ausschreibung & Sichtbarkeit steuern**  
   **Feature:** Schichten intern/extern veröffentlichen über App/Web/E‑Mail/Link/QR.  
   **Akzeptanzkriterien:** Status (offen/teilweise/voll/geschlossen) ist sichtbar und filterbar.

7. **Helferprofile & Typenmodell**  
   **Feature:** Einheitliches Helferprofil (Mitglied/Extern/Freund) mit minimalem Onboarding für Externe/Freunde.  
   **Akzeptanzkriterien:** Jede Person existiert genau einmal; Profile sind wiederverwendbar.

8. **Zugehörigkeiten & Partnervereine**  
   **Feature:** Trennung von Helferprofil und Zugehörigkeit (Partnerverein, Freund, mehrere Organisationen).  
   **Akzeptanzkriterien:** Zugehörigkeiten sind auswertbar und für Kontakt/Abrechnung nutzbar.

9. **Partnerverein‑Kontingente & Erfüllungsgrad**  
   **Feature:** Kontingente pro Serie/Aufführung (z. B. „8 Service‑Helfer“) und Monitoring.  
   **Akzeptanzkriterien:** Anzeige „erwartet vs. registriert“ pro Partnerverein.

10. **Anmeldeflow mit Konfliktprüfung**  
   **Feature:** Helfer wählen Aufführung + Schichten, System prüft Überschneidung, Mehrfachbelegung, Slot‑Verfügbarkeit.  
   **Akzeptanzkriterien:** Blockierte Anmeldungen werden begründet; erfolgreiche Anmeldung erzeugt Einsatzdatensatz.

11. **Backoffice‑Übersichten & Aktionen**  
   **Feature:** Übersichten zu Serien/Aufführungen, Besetzungsgrad, kritischen Rollen und Helferlisten.  
   **Akzeptanzkriterien:** Manuelle Zuweisung, Schicht‑Sperre/Erweiterung, Export (PDF/Excel).

12. **Nachbearbeitung & Historie**  
   **Feature:** Aufführungen abschließen, No‑Shows erfassen, Einsatzhistorie & Dankes‑Mails.  
   **Akzeptanzkriterien:** Historie je Helfer aktualisiert; Statistik zu Engpassrollen verfügbar.
