# Modulbeschreibung: Mitgliederverwaltung & Authentifizierung (Foundation)

Dieses Modul bildet das **Fundament** aller anderen Module. Es regelt die Verwaltung von Mitgliedsdaten, Authentifizierung, Benutzerrollen und Zugriffsrechte. Ohne diese Basis können die anderen Module (Vereinsleben, Logistik, Künstlerische Leitung) nicht funktionieren.

**Inhaltlicher Fokus**
- Benutzerverwaltung & Profile
- Authentifizierung (Login/Logout, Passwort-Reset)
- Benutzerrollen & Permissions (Member, Admin, Regie, Produktionsleitung, etc.)
- Row-Level Security (RLS) für Datenzugriff
- Persönliche Einstellungen & Datenschutz

**Zentrale Objekte**
- Mitglied / Benutzer (Profil, Kontakt, Bio)
- Authentifizierung (Email, Passwort, 2FA optional)
- Rolle (Member, Admin, Regie, Produktion, Technik, Maske, etc.)
- Permission (Wer darf was sehen/ändern?)
- User Settings (Notification Preferences, Privacy)
- Audit Log (Wer hat was wann getan?)

**Abgrenzung**
Keine spezifischen Vereinsanlässe, Aufführungen oder künstlerische Funktionen – dieses Modul ist rein infrastrukturell und ist die Grundlage für alles andere.

---

## 🔐 Security Considerations (für Bühnenmeister)

- **Authentication:** Supabase Auth (Email/Passwort, ggf. OAuth)
- **RLS Policies:** 
  - Jeder Nutzer sieht nur seine eigenen Daten + öffentliche Inhalte
  - Admins sehen alle Daten
  - Spezielle Rollen (Regie, Produktion) sehen Daten basierend auf Zuständigkeit
- **Audit Trail:** Alle Änderungen an kritischen Daten werden geloggt
- **Password Security:** Sichere Hashing, ggf. 2FA für Admins

---

## 👥 Rollen-Modell

```
┌─ Member (Standard-Mitglied)
│  ├─ Sieht: Eigenes Profil, öffentliche Events
│  └─ Kann: Sich an-/abmelden zu Events
│
├─ Admin (Administrator)
│  ├─ Sieht: Alles
│  └─ Kann: Benutzer verwalten, Settings anpassen
│
├─ Regie (Künstlerische Leitung)
│  ├─ Sieht: Künstlerische Planungen, Besetzungen, Proben
│  └─ Kann: Stücke, Szenen, Rollen, Besetzungen verwalten
│
├─ Produktion (Produktionsleitung)
│  ├─ Sieht: Aufführungen, Schichtpläne, Ressourcen
│  └─ Kann: Aufführungen, Helferrollen, Schichten verwalten
│
├─ Technik (Technisches Team)
│  ├─ Sieht: Technik-relevante Aufführungen & Proben
│  └─ Kann: Ressourcen (Technik) verwalten
│
└─ Maske/Kostüm (Creative Team)
   ├─ Sieht: Maske-relevante Aufführungen & Proben
   └─ Kann: Ressourcen (Maske) verwalten
```

**Flexible Mehrfach-Rollen:** Ein Mitglied kann mehrere Rollen haben.
