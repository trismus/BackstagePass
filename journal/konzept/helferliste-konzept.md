### Feature: Implementierung der 'Helferliste' für Event-Rollenbesetzung

**Grundidee & Zweck:**
Die "Helferliste" soll eine strukturierte Planung und Besetzung von Helferrollen für Aufführungen und externe Einsätze ermöglichen. Sie bietet:
*   Transparente Ausschreibung von Helferjobs.
*   Einfache Anmeldung für Mitglieder und Externe.
*   Zentrale Übersicht für Produktions- & Logistikleitung.

---

#### 🔁 End-to-End-Prozess (High Level)

**Phase 1 – Vorbereitung (Backend / Orga)**
*   **Verantwortlich:** Produktions- oder Logistikleitung
*   **Funktionalitäten:**
    *   **Event erstellen:**
        *   Typ: Aufführung oder Helferevent
        *   Datum, Ort, Zeitfenster
        *   Verknüpfung zum Stück (optional)
    *   **Helfer-Template auswählen (optional, empfohlen):** Ermöglicht das schnelle Anlegen wiederkehrender Rollen (z.B. Kasse, Service, Buffet, Parkplatz mit vordefinierter Personenanzahl).
    *   **Helferrollen instanziieren:**
        *   Rolle (Bezeichnung)
        *   Zeitblock (z.B. 18:00–22:00)
        *   Anzahl benötigter Personen
        *   Sichtbarkeit: `🔒 intern` (nur Mitglieder) oder `🌍 öffentlich` (externe Helfer)

**Phase 2 – Veröffentlichung**
*   **Verantwortlich:** System / Orga
*   **Funktionalitäten:**
    *   Helferliste wird freigeschaltet und erscheint im Mitgliederbereich der App und/oder über einen öffentlichen Link (optional, ohne Login).
    *   Benachrichtigung an Mitglieder (Push / Mail) und optional Social-Media-Hinweis für externe Helfer.

**Phase 3 – Anmeldung**
*   **Verantwortlich:** Helfer (Mitglied oder extern)
*   **Funktionalitäten:**
    *   Helfer sieht verfügbare Rollen mit Status (🟢 frei, 🟡 teilweise besetzt, 🔴 voll).
    *   **Anmeldung:**
        *   **Mitglied:** 1-Klick-Anmeldung (User ist bekannt).
        *   **Extern:** Erfassung von Name, E-Mail (optional Telefon).
    *   **Systemprüfung:** Verhinderung von Doppelbuchungen oder Überschneidungen mit anderen Einsätzen.

**Phase 4 – Bestätigung & Verwaltung**
*   **Verantwortlich:** System + Orga
*   **Funktionalitäten:**
    *   Automatische oder manuelle Bestätigung je nach Event-Typ.
    *   **Status der Anmeldung:** "angemeldet", "bestätigt", "abgelehnt / Warteliste".
    *   **Live-Übersicht für Orga:** Besetzungsgrad pro Rolle, fehlende Helfer (Ampel-Logik).
    *   Export / Druck (PDF-Helferliste).

**Phase 5 – Durchführung**
*   **Verantwortlich:** Helfer + Einsatzleitung
*   **Funktionalitäten:**
    *   Helfer erscheinen gemäss Rolle & Zeitblock.
    *   Ggf. Abhaken / Check-in vor Ort (optional, späterer Ausbau).

**Phase 6 – Nachbearbeitung (Optional, späterer Ausbau)**
*   **Verantwortlich:** System / Vorstand
*   **Funktionalitäten:**
    *   Nachverfolgung der Einsatzhistorie pro Mitglied.
    *   Helferpunkte / Guthaben.
    *   Dankes-Mail / Bestätigung.

---

#### 🧠 Wichtige Design-Prinzipien

*   **Template-basiert:** Für repetitive Abläufe im Theater.
*   **Trennung:** Klare Trennung von Event, Helferrolle und Anmeldung.
*   **Zwei Zielgruppen:** Intern (mit Login) und extern (ohne Login) mit unterschiedlichen Anmeldeabläufen.

---

#### 🛠️ Technische Überlegungen (aus Peter's Sicht)

*   **Datenbank-Schema:**
    *   Neue Tabellen für `HelferEvents`, `HelferRollenTemplates`, `HelferRollenInstanzen` (oder `EventHelferRollen`), und `HelferAnmeldungen`.
    *   Verknüpfung zu bestehenden `veranstaltungen` und `profiles` (für Mitglieder).
    *   Berücksichtigung der Sichtbarkeit (`intern`/`öffentlich`) und des Anmeldestatus.
*   **API Endpunkte:**
    *   CRUD-Operationen für `HelferEvents` und `HelferRollen`.
    *   Endpunkte zur Veröffentlichung/Freischaltung von Helferlisten.
    *   Anmelde-Endpunkte für Mitglieder (authentifiziert) und Externe (ggf. mit Captcha/Basic-Validation).
    *   Endpunkte für die Orga-Übersicht und Bestätigung/Ablehnung von Anmeldungen.
*   **UI / Frontend Komponenten:**
    *   Formulare zur Erstellung von HelferEvents und -Rollen (ggf. mit Template-Auswahl).
    *   Übersichtsseite für Helfer (verfügbare Rollen, Status).
    *   Anmeldeformulare (1-Klick für Mitglieder, detailliert für Externe).
    *   Management-Dashboard für die Orga (Live-Übersicht, Bestätigungen, Export).
*   **Authentifizierung & Berechtigungen (RLS):**
    *   Sicherstellen, dass nur berechtigte Rollen (Produktions-/Logistikleitung) Events und Rollen erstellen/verwalten können.
    *   RLS für den Zugriff auf interne Listen.
*   **Benachrichtigungen:**
    *   Integration mit Mail-Dienst und ggf. Push-Benachrichtigungen (Supabase Edge Functions?).
*   **Validierung:**
    *   Logik zur Verhinderung von Doppelbuchungen oder Überschneidungen.

---

#### 🏷️ Vorgeschlagene Labels:
`feature`, `module-1`, `backend`, `frontend`, `database`, `supabase`, `nextjs`

---

#### 📅 Nächste Schritte:
*   Priorisierung und Zuweisung des Issues.
*   Detailliertere Spezifikation der einzelnen Phasen und technischen Anforderungen.
