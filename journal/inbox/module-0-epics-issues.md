````markdown
# Module 0 Epics & Issues für GitHub

> Modul 0: Mitgliederverwaltung & Authentifizierung (Foundation)
> Erstellt am 2026-01-26
> Kopiere diese Epics/Issues auf: https://github.com/trismus/Argus/issues/new

---

## Epic 0: Fundament für alle Module – Authentifizierung & Mitgliederverwaltung

**Title:** `Epic: Fundament für alle Module – Authentifizierung & Mitgliederverwaltung`

**Body:**
```markdown
## Ziel
Authentifizierung, Benutzerverwaltung und rollenbasierte Zugriffsrechte als sichere Grundlage für alle Module einrichten.

## Nutzen / User Storys
- Als Mitglied möchte ich mich sicher anmelden können, um auf die Plattform zuzugreifen.
- Als Admin möchte ich Benutzer und Rollen verwalten können.
- Als Regie/Produktion möchte ich nur relevante Daten sehen (basierend auf meiner Rolle).

## Vorschlag
- Supabase Auth für sichere Authentifizierung
- Rollenmodell (Member, Admin, Regie, Produktion, Technik, Maske, etc.)
- RLS Policies für Datenschutz und Zugriffsrechte
- Persönliche Profile und Settings
- Audit Log für kritische Aktionen

## Abhängigkeiten
- Alle anderen Module (1, 2, 3) hängen von Modul 0 ab
```

---

## Issue 0.1: Benutzer-Authentifizierung & Login-System

**Title:** `Benutzer-Authentifizierung & Login-System`

**Body:**
```markdown
## Ziel
Ein sicheres Login/Logout-System mit Email-Authentifizierung über Supabase aufbauen.

## Nutzen / User Storys
- Als Mitglied möchte ich mich mit Email und Passwort anmelden können.
- Als Mitglied möchte ich mein Passwort zurücksetzen können, wenn ich es vergesse.
- Als Plattform möchte ich sichere Authentifizierung ohne Sicherheitslücken.

## Vorschlag
- Supabase Auth (Email/Passwort)
- Login-Page mit Email/Passwort-Feldern
- Passwort-Reset via Email
- Session-Management (Tokens)
- Logout-Funktion
- ggf. "Remember Me" Option

## Akzeptanzkriterien
- [ ] Login funktioniert mit korrekten Credentials
- [ ] Falsches Passwort wird abgelehnt
- [ ] Passwort-Reset sendet Email und setzt neues Passwort
- [ ] Session bleibt erhalten bei Seitenwechsel
- [ ] Logout löscht Session & Redirect zu Login-Page
- [ ] Error-Handling für ungültige Email-Formate

## Alternativen
- OAuth (Google/GitHub) statt Email/Passwort
- 2FA für zusätzliche Sicherheit (optional für Phase 2)
```

---

## Issue 0.2: Mitgliederprofil & Benutzerverwaltung

**Title:** `Mitgliederprofil & Benutzerverwaltung`

**Body:**
```markdown
## Ziel
Benutzerprofile mit persönlichen Daten, Kontaktinformationen und Einstellungen verwalten.

## Nutzen / User Storys
- Als Mitglied möchte ich mein Profil (Name, Email, Telefon, Bio) sehen und bearbeiten können.
- Als Admin möchte ich alle Benutzer und deren Daten verwalten können.
- Als Mitglied möchte ich meine Datenschutz-Einstellungen kontrollieren.

## Vorschlag
- Profil-Seite mit bearbeitbarem Namen, Email, Telefon, Bio
- Avatar/Profilbild Upload (optional)
- Datenschutz-Einstellungen (Wer sieht mein Profil?)
- Admin-Panel zur Verwaltung aller Benutzer
- Benutzer-Liste mit Filter & Suche
- Benutzer aktivieren/deaktivieren (Soft Delete)

## Akzeptanzkriterien
- [ ] Mitglied kann Profildaten einsehen und bearbeiten
- [ ] Avatar-Upload funktioniert
- [ ] Admin sieht alle Benutzer in einer Tabelle
- [ ] Admin kann Benutzer aktivieren/deaktivieren
- [ ] Benutzer-Suche funktioniert
- [ ] Änderungen werden im Audit Log geloggt

## Alternativen
- Profile als Read-Only für Member (nur Admin kann ändern)
- Avatar-Upload nicht unterstützen
```

---

## Issue 0.3: Rollenmanagement & Permissions

**Title:** `Rollenmanagement & Permissions`

**Body:**
```markdown
## Ziel
Ein flexibles Rollenmodell mit Permissions für verschiedene Funktionen und Zugriffsebenen aufbauen.

## Nutzen / User Storys
- Als Admin möchte ich Rollen (Member, Admin, Regie, Produktion, etc.) zuweisen können.
- Als Regie möchte ich nur künstlerische Funktionen sehen und verwalten können.
- Als Produktion möchte ich nur Aufführungs- & Logistik-Daten sehen und verwalten können.

## Vorschlag
- Rollen-Modell mit Rollen:
  - Member (Standard-Mitglied)
  - Admin (Super-Admin)
  - Regie (Künstlerische Leitung)
  - Produktion (Produktionsleitung)
  - Technik (Technisches Team)
  - Maske/Kostüm (Creative Team)
- Permission-System (Wer darf was machen?)
- Mehrfach-Rollen pro Mitglied möglich
- Admin-Panel zur Rollen-Zuweisung
- RLS Policies in Supabase für Datenzugriff

## Akzeptanzkriterien
- [ ] Admin kann Rollen zuweisen/entfernen
- [ ] Mitglied kann mehrere Rollen haben
- [ ] RLS Policies sind implementiert
- [ ] Regie sieht nur künstlerische Daten
- [ ] Produktion sieht nur Logistik-Daten
- [ ] Audit Log trackt Rollen-Änderungen

## Alternativen
- Feste Rollen ohne Flexibility
- RLS später implementieren (Security Risk!)
```

---

## Issue 0.4: Audit Log & Activity Tracking

**Title:** `Audit Log & Activity Tracking`

**Body:**
```markdown
## Ziel
Alle kritischen Aktionen (Login, Profil-Änderungen, Rollen-Zuweisung) für Transparenz und Sicherheit loggen.

## Nutzen / User Storys
- Als Admin möchte ich sehen, wer was wann getan hat (für Accountability).
- Als Security-Officer möchte ich verdächtige Aktivitäten erkennen (mehrere failed Logins, etc.).

## Vorschlag
- Audit Log für kritische Aktionen:
  - Login/Logout
  - Profil-Änderungen
  - Rollen-Zuweisung
  - Admin-Aktionen
  - Data Changes (wer hat was geändert)
- Audit Log Admin-Dashboard mit Filter & Export
- Optional: Email-Alert bei verdächtigen Aktivitäten

## Akzeptanzkriterien
- [ ] Alle Login/Logout-Events werden geloggt
- [ ] Profil-Änderungen werden mit alte/neue Werte geloggt
- [ ] Admin-Panel zeigt Audit Log
- [ ] Filter nach Benutzer, Datum, Action möglich
- [ ] Audit Log kann exportiert werden

## Alternativen
- Nur Fehler-Logging (nicht alle Aktionen)
- Audit Log nur für Admins sichtbar (ja, das ist gut!)
```

````
