# ⚡ VS Code Multi-Device Setup – Quick Reference

**Für schnelle Referenz – alle wichtigen Commands & Links**

---

## 🚀 5-Minute Setup Flow

```bash
# 1. Repository clonen
git clone https://github.com/trismus/Argus.git
cd Argus

# 2. VS Code öffnen
code .

# 3. Extensions werden auto-empfohlen (Klick "Install All")
# oder manuell: Ctrl+Shift+X → "Recommended" tab

# 4. Settings Sync aktivieren
# Ctrl+Shift+P → "Settings Sync: Turn On" → GitHub Login

# 5. Secrets konfigurieren
# Ctrl+Shift+P → "VS Code: Open User Secrets"
# Eintragen: claude-api-key, gemini-api-key, openai-api-key

# 6. Dependencies installieren
npm install

# 7. Dev starten
npm run dev

# 8. Fertig! 🎉
```

---

## 📋 Critical Commands

| Was | Command | Shortcut |
|-----|---------|----------|
| Settings Sync ON | `Ctrl+Shift+P` → "Settings Sync: Turn On" | `Ctrl+Shift+,` |
| API Keys speichern | `Ctrl+Shift+P` → "VS Code: Open User Secrets" | - |
| Extensions installieren | `Ctrl+Shift+P` → "Extensions: Show Recommended" | `Ctrl+Shift+X` |
| Reload Window | `Ctrl+Shift+P` → "Developer: Reload Window" | - |
| Terminal öffnen | - | `Ctrl+` (Backtick) |
| Format Document | `Ctrl+Shift+P` → "Format Document" | `Shift+Alt+F` |
| Lint Fix | `Ctrl+Shift+P` → "ESLint: Fix all auto-fixable problems" | - |

---

## 🔑 API Keys Links

| Service | URL | Key Format |
|---------|-----|-----------|
| **Claude** | https://console.anthropic.com/account/keys | `sk-ant-...` |
| **Gemini** | https://makersuite.google.com/app/apikey | `AIza...` |
| **OpenAI** | https://platform.openai.com/account/api-keys | `sk-proj-...` |
| **GitHub** | https://github.com/settings/tokens | `ghp_...` |

---

## ✅ Checklist: Neue Installation

- [ ] Repository geclont: `git clone https://github.com/trismus/Argus.git`
- [ ] VS Code geöffnet: `code .`
- [ ] Extensions installed (via `.vscode/extensions.json` recommendations)
- [ ] Settings Sync ON (via GitHub Login)
- [ ] Secrets konfiguriert (Ctrl+Shift+P → "Open User Secrets")
- [ ] npm Packages installed: `npm install`
- [ ] Dev Server läuft: `npm run dev`
- [ ] Claude/Gemini/ChatGPT funktionieren in AI Chat

---

## 📁 File Structure

```
Argus/
├── .vscode/
│   ├── extensions.json     ← Alle empfohlenen Extensions
│   ├── settings.json       ← Workspace Settings (Team)
│   ├── tasks.json          ← Vordefinierte Tasks
│   └── launch.json         ← Debug Konfiguration
├── docs/
│   ├── VS-CODE-SETUP-GUIDE.md           ← Komplettes Setup Guide
│   └── VSCODE-SECRETS-SETUP.md          ← Secrets Management
├── apps/web/
│   ├── next.config.ts
│   └── app/
└── README.md
```

---

## 🎯 Pro Tips

### Tip 1: Schnell zwischen Devices synchronisieren
```
Ctrl+Shift+P → "Settings Sync: Download" (neue Settings vom Cloud holen)
Ctrl+Shift+P → "Settings Sync: Upload" (lokale Settings hochladen)
```

### Tip 2: Terminal Auto-Approve aktivieren
In `.vscode/settings.json`:
```json
{
  "terminal.integrated.automationProfile.windows": "pwsh",
  "chat.tools.terminal.autoApprove": ["npm", "git"]
}
```

### Tip 3: AI Chat schnell aktivieren
- Claude: `Ctrl+Alt+L` (wenn Extension aktiv)
- ChatGPT: `Ctrl+Shift+I` (in einigen Setups)
- Gemini: `Ctrl+Alt+G`

### Tip 4: Workspace Secrets vs User Secrets
- **Workspace Secrets:** `.vscode/` (in Git-Repo, teamweit)
- **User Secrets:** `~/.vscode/` (lokal, gerätespezifisch) ← Nutze für API Keys!

---

## ⚙️ Konfiguration Übersicht

### Settings Sync (Auto-Sync)
- **Speichert:** VSCode Settings, Extensions, Keybindings, Snippets
- **Synchronisiert zu:** GitHub Cloud (sicher!)
- **Geräte:** Alle Geräte wo gleicher GitHub-Account
- **API Keys?** NEIN – nutze VS Code Secrets stattdessen!

### VS Code Secrets (Verschlüsselt lokal)
- **Speichert:** Sensitive Daten (API Keys, Tokens)
- **Synchronisiert?** NEIN (absichtlich!)
- **Speichert in:** `~/.vscode/storage/` (lokal verschlüsselt)
- **Jedes Gerät?** Eigene separate Secrets pro Gerät

### `.vscode/` Folder (im Git-Repo)
- **Speichert:** Workspace-Settings (teamweit)
- **Für:** Extensions, Formatter, Linter Konfiguration
- **Versioniert?** Ja (in Git)
- **API Keys?** NEIN – `.gitignore` schützt `.env*`

---

## 🐛 Quick Troubleshooting

| Problem | Lösung |
|---------|--------|
| Extensions nicht installiert | `Ctrl+Shift+X` → "Recommended" tab → Install all |
| Settings synchronisieren nicht | `Ctrl+Shift+P` → "Settings Sync: Turn On" → GitHub Login |
| API Keys nicht funktionieren | `Ctrl+Shift+P` → "Open User Secrets" → Key neu eingeben |
| ESLint funktioniert nicht | `npm install` + reload window (`Ctrl+Shift+P` → Reload) |
| Terminal funktioniert nicht | Settings prüfen: `"terminal.integrated.shell.windows": "pwsh"` |
| Prettier formatiert nicht | Rechtsklick → "Format Document" oder `Shift+Alt+F` |

---

## 🔐 Security Reminders

```
🚨 NIEMALS:
- API Keys in .env committen
- API Keys in Chat/Slack posten
- API Keys hardcoden im Code
- API Keys in .vscode/settings.json speichern

✅ IMMER:
- Secrets in VS Code Secrets speichern
- Secrets in ~/.bashrc oder $PROFILE speichern (lokal!)
- Secrets regelmäßig rotieren
- Alte Keys löschen wenn nicht mehr genutzt
```

---

## 📞 Hilfe & Support

**Problem?** Überprüf diese Dateien:
- [VS-CODE-SETUP-GUIDE.md](VS-CODE-SETUP-GUIDE.md) – Detailliertes Setup
- [VSCODE-SECRETS-SETUP.md](VSCODE-SECRETS-SETUP.md) – Secrets Management
- [README.md](../README.md) – Projekt Overview

**Fragen?** Kontakt: Springer (Project Manager)

---

**Zuletzt aktualisiert:** 2026-01-26  
**Version:** 1.0  
**Status:** ✅ Ready for Team
