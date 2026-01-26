# 📖 VS Code Multi-Device Setup – Master Index

**Vollständiges Setup für synchronisierte VS Code Umgebungen auf allen Geräten**

---

## 🎯 Ziel dieses Setups

Alle Team-Members haben **exakt gleiche VS Code Konfiguration** auf verschiedenen Geräten:

✅ Gleiche Extensions (Claude, Gemini, ChatGPT, etc.)  
✅ Gleiche Settings (Formatter, Linter, Themes)  
✅ Gleiche Keybindings  
✅ Gleiche IDE-Konfiguration (Tasks, Debug, etc.)  
✅ Alle AI Tools mit korrekten Credentials  
✅ Automatische Synchronisierung zwischen Devices  

---

## 📚 Dokumentationen (in Reihenfolge lesen)

### 1. **[TEAM-ONBOARDING-VSCODE.md](TEAM-ONBOARDING-VSCODE.md)** ← **START HIER!**
**Für:** Neue Team-Members, Quick Start  
**Inhalt:** Step-by-Step Setup (20 Min), Checklist, Troubleshooting  
**Lesen:** Immer zuerst! Alle anderen Docs sind Referenzen.

---

### 2. [VS-CODE-SETUP-GUIDE.md](VS-CODE-SETUP-GUIDE.md)
**Für:** Detaillierte Erklärung & Administration  
**Inhalt:**
- Settings Sync (Auto-Synchronisierung)
- AI Extension Konfiguration (Claude, Gemini, ChatGPT, Copilot)
- `.vscode/` Folder Struktur
- Environment Variable Setup
- Secrets Management
- Troubleshooting

**Lesen:** Wenn du verstehen willst, wie alles funktioniert

---

### 3. [VSCODE-SECRETS-SETUP.md](VSCODE-SECRETS-SETUP.md)
**Für:** API Key Management & Security  
**Inhalt:**
- Wo man API Keys bekommt (4 Services)
- Sicheres Speichern (VS Code Secrets vs Environment Variables)
- Security Best Practices
- Kompromittierte Keys wiederherstellen
- Extension Konfiguration

**Lesen:** Kritisch für API Key Setup!

---

### 4. [VSCODE-QUICK-REFERENCE.md](VSCODE-QUICK-REFERENCE.md)
**Für:** Schnelle Nachschlag-Reference  
**Inhalt:**
- 5-Min Setup Flow
- Critical Commands (Shortcuts)
- API Keys Links (schnell zugänglich)
- Checklist
- Pro Tips
- Quick Troubleshooting Table

**Lesen:** Beim schnellen nachschauen (z.B. welche Keybinding?)

---

## 📁 Dateien in diesem Repository

### In `.vscode/` Ordner (im Git-Repo):

```
.vscode/
├── extensions.json      # ← Team-Wide Extensions (git-tracked)
├── settings.json        # ← Workspace Settings (git-tracked)
├── tasks.json           # ← Vordefinierte Tasks (git-tracked)
├── launch.json          # ← Debug Konfiguration (git-tracked)
└── secrets.json         # ← ❌ NICHT im Git! (.gitignore schützt)
```

**Was ist "git-tracked"?** → Im Repository gespeichert, für alle Team-Members

---

### In `~/.vscode/` Ordner (lokal, nicht im Git):

```
~/.vscode/
├── settings.json        # Deine persönlichen User Settings (sync'd by Settings Sync)
├── keybindings.json     # Deine Keybindings (sync'd)
└── storage/secretStorage/
    └── [encrypted API Keys] # Deine Secrets (NICHT sync'd, lokal verschlüsselt)
```

**Was ist hier?** → Persönliche Einstellungen pro Gerät/Person

---

## 🚀 Quick Navigation

### Ich bin NEU im Team
👉 Lese: [TEAM-ONBOARDING-VSCODE.md](TEAM-ONBOARDING-VSCODE.md)

### Ich vergesse ständig welche Keybinding was war
👉 Lese: [VSCODE-QUICK-REFERENCE.md](VSCODE-QUICK-REFERENCE.md)

### Meine API Keys funktionieren nicht
👉 Lese: [VSCODE-SECRETS-SETUP.md](VSCODE-SECRETS-SETUP.md) → Troubleshooting

### Ich will alles detailliert verstehen
👉 Lese: [VS-CODE-SETUP-GUIDE.md](VS-CODE-SETUP-GUIDE.md)

### Ich administriere mehrere Team-Members
👉 Lese: [VS-CODE-SETUP-GUIDE.md](VS-CODE-SETUP-GUIDE.md) → Deploy Section

---

## ⚡ Super-Quick 3-Step Start

```bash
# 1. Clone & Open
git clone https://github.com/trismus/Argus.git
cd Argus && code .

# 2. Install Extensions & Sync Settings
# VS Code zeigt Auto-Dialog → "Install All"
# Ctrl+Shift+P → "Settings Sync: Turn On" → GitHub

# 3. Setup Secrets & Start
# Ctrl+Shift+P → "VS Code: Open User Secrets"
# Speichere deine API Keys
# npm install && npm run dev
```

**Fertig!** 🎉 (20 Min)

---

## 🔑 API Keys – Wo bekommst du sie?

| Service | Link | What to do |
|---------|------|-----------|
| **Claude** | https://console.anthropic.com/account/keys | Create API Key |
| **Gemini** | https://makersuite.google.com/app/apikey | Create API Key |
| **ChatGPT** | https://platform.openai.com/account/api-keys | Create Secret Key |
| **GitHub Copilot** | Built-in (GitHub OAuth) | Authenticate in VS Code |

Siehe: [VSCODE-SECRETS-SETUP.md](VSCODE-SECRETS-SETUP.md) für detaillierte Anleitung

---

## 🔐 Security Cheat Sheet

### ✅ DO:
- Speichere Keys in **VS Code Secrets** (Ctrl+Shift+P → "Open User Secrets")
- Speichere Keys in **Environment Variables** (~/.bashrc, $PROFILE)
- Rotiere Keys monatlich
- Nutze einen **Password Manager** für Backup

### ❌ DON'T:
- **NIE** Keys in `.env` speichern (wird oft committed!)
- **NIE** Keys im Source Code hardcoden
- **NIE** Keys in Git committen
- **NIE** Keys in `.vscode/settings.json` speichern (wird synced!)

---

## 🛠️ Synchronisierung – Wie es funktioniert

### Komponente 1: Settings Sync (VS Code Built-in)

```
Dein PC 1                  VS Code Cloud (GitHub)         Dein Laptop
┌──────────────┐          ┌──────────────┐          ┌──────────────┐
│ Settings     │  Upload  │ Sync Storage │  Download│ Settings     │
│ Extensions   │ -------> │ (encrypted)  │ <------- │ Extensions   │
│ Keybindings  │          │              │          │ Keybindings  │
│ Snippets     │          │              │          │ Snippets     │
└──────────────┘          └──────────────┘          └──────────────┘
          ↑                                                  ↑
          └──────────── Auto-Sync alle 30 sec ────────────┘
```

**Was wird sync'd:**
- ✅ VS Code Settings
- ✅ Installed Extensions (Auto-Install!)
- ✅ Keybindings
- ✅ Snippets
- ✅ User Themes
- ❌ API Keys (absichtlich nicht!)
- ❌ Local file-specific configs

---

### Komponente 2: VS Code Secrets (Lokal verschlüsselt)

```
Dein PC 1                    Dein Laptop
┌──────────────┐           ┌──────────────┐
│ API Keys     │  ← NO →   │ API Keys     │
│ (encrypted   │ SYNC!     │ (encrypted   │
│  lokal)      │           │  lokal)      │
└──────────────┘           └──────────────┘
   Getrennt!               Getrennt!
```

**Jedes Gerät hat seine eigenen Secrets** (nicht synchronisiert)

---

### Komponente 3: Repository Config (`.vscode/`)

```
Git Repository (Shared)
┌──────────────────────────────────┐
│ .vscode/                         │
│ ├── extensions.json  ✅ im Git   │
│ ├── settings.json    ✅ im Git   │
│ ├── tasks.json       ✅ im Git   │
│ └── launch.json      ✅ im Git   │
│                                  │
│ → Alle Team-Members haben diese  │
└──────────────────────────────────┘
```

**Diese Dateien sind im Git** → Alle bekommen sie

---

## 📋 Features nach dem Setup

### AI Chat Extensions (alle aktiviert)

| Feature | Hotkey | Was macht es |
|---------|--------|------------|
| **Claude Chat** | Varies* | Code Review, Erklärungen, Architecture |
| **ChatGPT Chat** | Varies* | Quick Q&A, Brainstorming |
| **Gemini Chat** | Varies* | Code Analysis |
| **Copilot** | `Tab` | Auto-Completions (fancy!) |

*Exact keybindings shown in [VSCODE-QUICK-REFERENCE.md](VSCODE-QUICK-REFERENCE.md)

---

### Developer Tools

| Tool | Benefit |
|------|---------|
| **ESLint** | Automatische Code-Fehler finden |
| **Prettier** | Automatische Code-Formatierung |
| **Tailwind CSS** | IntelliSense für Tailwind Classes |
| **GitLens** | Git History im Editor |
| **Remote Dev** | SSH Development Container |

---

## 🎯 Team Roles & Verantwortung

| Role | VS Code Setup Responsibility |
|------|----------------------------|
| **Springer** (Project Manager) | Verwaltet `.vscode/` Konfiguration, dokumentiert Updates |
| **Bühnenmeister** (Tech Lead) | Reviews Tech Architecture, bestätigt Settings |
| **Kulissenbauer** (Backend Dev) | Nutzt Setup für API Development |
| **Alle anderen** | Folgen [TEAM-ONBOARDING-VSCODE.md](TEAM-ONBOARDING-VSCODE.md) |

---

## ❓ FAQs

**Q: Was wenn ich Settings ändern will?**  
A: Persönliche Settings → User Settings (sync'd across devices)  
Team-Settings → `.vscode/settings.json` (git-tracked)

**Q: Werden meine API Keys verloren wenn ich Gerät wechsle?**  
A: Nein! Aber sie sind nicht auto-sync'd. Du musst deine Keys auf jedem Gerät selbst speichern.

**Q: Kann ich ein Extension ignorieren?**  
A: Ja! Extensions in `recommendations` sind optional. Ignore wenn du es nicht nutzt.

**Q: Was wenn Settings Sync bricht?**  
A: `Ctrl+Shift+P` → "Settings Sync: Reset"

**Q: Kann ich eigene VS Code Snippets hinzufügen?**  
A: Ja! Sie werden auto-sync'd. Siehe [VS-CODE-SETUP-GUIDE.md](VS-CODE-SETUP-GUIDE.md)

---

## 🚨 Häufige Fehler

### ❌ Fehler 1: "API Keys nicht konfiguriert"
**Grund:** Keys nicht in VS Code Secrets gespeichert  
**Fix:** `Ctrl+Shift+P` → "Open User Secrets" → Key eintragen  
**Siehe:** [VSCODE-SECRETS-SETUP.md](VSCODE-SECRETS-SETUP.md)

### ❌ Fehler 2: "Extensions werden nicht synchronisiert"
**Grund:** Settings Sync nicht aktiviert  
**Fix:** `Ctrl+Shift+P` → "Settings Sync: Turn On"  
**Siehe:** [VS-CODE-SETUP-GUIDE.md](VS-CODE-SETUP-GUIDE.md)

### ❌ Fehler 3: "Different Settings on Device 1 vs Device 2"
**Grund:** Du hast User Settings überschrieben (sollte nicht sein!)  
**Fix:** Stelle sicher `.vscode/settings.json` ist in Git  
**Siehe:** [VS-CODE-SETUP-GUIDE.md](VS-CODE-SETUP-GUIDE.md)

---

## 🔄 Workflow Update

Falls Springer die Setup ändert (z.B. neue Extension):

```bash
# Auf allen Deinen Geräten:
git pull origin main            # Hole neue `.vscode/` config
Ctrl+Shift+P → "Developer: Reload Window"  # Reload VS Code
# Extensions sollten auto-installieren (dank Settings Sync)
```

---

## 📞 Support & Questions

| Question | Document |
|----------|----------|
| "Wie starte ich?" | [TEAM-ONBOARDING-VSCODE.md](TEAM-ONBOARDING-VSCODE.md) |
| "API Keys funktionieren nicht" | [VSCODE-SECRETS-SETUP.md](VSCODE-SECRETS-SETUP.md) |
| "Welcher Hotkey war das?" | [VSCODE-QUICK-REFERENCE.md](VSCODE-QUICK-REFERENCE.md) |
| "Ich will Technologie verstehen" | [VS-CODE-SETUP-GUIDE.md](VS-CODE-SETUP-GUIDE.md) |

**Slack:** #dev-setup-help  
**Email:** springer@backstagepass.dev (Project Manager)

---

## ✅ Completion Checklist

Nach dem du diesen Index gelesen hast:

- [ ] Ich habe [TEAM-ONBOARDING-VSCODE.md](TEAM-ONBOARDING-VSCODE.md) gelesen
- [ ] Ich habe mein Setup durchgeführt (20 min)
- [ ] Meine API Keys funktionieren
- [ ] Meine VS Code Extensions sind installiert
- [ ] Settings Sync ist ON
- [ ] Ich kann Claude/Gemini/ChatGPT im VS Code nutzen
- [ ] `npm install` funktioniert
- [ ] `npm run dev` läuft auf http://localhost:3000

**Falls alle ✅:** Du bist ready! 🚀

---

**Erstellt durch:** Springer (Project Manager)  
**Datum:** 2026-01-26  
**Status:** ✅ Production Ready  
**Version:** 1.0

---

## 📜 Changelog

| Date | What Changed |
|------|-------------|
| 2026-01-26 | Initial Setup Complete |

