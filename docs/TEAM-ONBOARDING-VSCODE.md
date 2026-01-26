# 🎭 BackstagePass – Team Onboarding: Multi-Device VS Code Setup

**Für alle Team-Members – Step-by-Step Anleitung**

---

## 👋 Willkommen im BackstagePass Team!

Diese Anleitung stellt sicher, dass alle auf verschiedenen Geräten **exakt die gleiche VS Code Setup** haben – mit den richtigen AI Tools, Extensions und Konfigurationen.

**Zeiteinsatz:** ~20 Minuten

---

## ⚡ Super-Quick Start (Wenn du es eilig hast)

```bash
# 1. Repository clonen
git clone https://github.com/trismus/Argus.git
cd Argus

# 2. VS Code öffnen
code .

# 3. Warte ~10 Sekunden, installiere Recommended Extensions
# (VS Code sollte einen Dialog zeigen)
# Klick: "Install All"

# 4. Aktiviere Settings Sync
# Ctrl+Shift+P → Suche "Settings Sync: Turn On" → GitHub Login

# 5. Öffne VS Code Secrets und speichere deine API Keys
# Ctrl+Shift+P → Suche "VS Code: Open User Secrets"
# Füge ein:
# {
#   "claude-api-key": "sk-ant-YOUR_KEY",
#   "gemini-api-key": "YOUR_KEY",
#   "openai-api-key": "sk-YOUR_KEY"
# }

# 6. Installiere dependencies
npm install

# 7. Starte dev server
npm run dev

# 8. Öffne Browser: http://localhost:3000
```

**Fertig! 🎉**

---

## 📋 Step-by-Step Onboarding

### Step 1: Repository klonen

```bash
# Wechsle zu deinem Entwicklungs-Ordner
cd ~/Entwicklung
# oder
cd C:\Repos

# Klone das Repository
git clone https://github.com/trismus/Argus.git

# Wechsle in den Ordner
cd Argus
```

**Überprüfung:**
```bash
ls -la
# Sollte sichtbar sein: .vscode/, docs/, apps/, etc.
```

---

### Step 2: VS Code öffnen

```bash
code .
```

VS Code öffnet sich mit dem `Argus` Projekt.

**Überprüfung:**
- Du siehst den File Explorer links
- Es sagt "Argus" oben im Tab

---

### Step 3: Extensions installieren

#### Automatisch (empfohlen):

1. VS Code zeigt einen Popup: **"Recommended Extensions"**
2. Klick: **"Install All"** (oder grünes Icon links)
3. Warte ~2 Min bis alles installiert ist

#### Manuell (falls Popup nicht angezeigt):

1. Drücke: `Ctrl+Shift+X` (Extensions)
2. Suche nach: **"@recommended"**
3. Klick: **"Install"** auf jeder Extension

**Was wird installiert:**
- ✅ GitHub Copilot (AI Code Suggestions)
- ✅ Claude (Anthropic AI Chat)
- ✅ Google Gemini (Google AI Chat)
- ✅ ChatGPT (OpenAI AI Chat)
- ✅ ESLint (Code Quality)
- ✅ Prettier (Code Formatter)
- ✅ Tailwind CSS (CSS Utilities)
- ✅ GitLens (Git History)
- +5 mehr

**Überprüfung:**
```
Ctrl+Shift+X → Sollte ~18 Extensions in "Installed" zeigen
```

---

### Step 4: Settings Sync aktivieren

**Settings Sync** synchronisiert VS Code Einstellungen zwischen all deinen Geräten!

1. Drücke: `Ctrl+Shift+P`
2. Tippe: **"Settings Sync: Turn On"**
3. Wähle: **"Turn On"**
4. Wähle: **"Sign in with GitHub"**
5. Bestätige in Browser: **"Authorize Visual Studio Code"**
6. Zurück zu VS Code → alles sollte sich synchronisieren

**Was synchronisiert:**
- ✅ VS Code Settings
- ✅ Extensions (Auto-Install auf anderen Geräten)
- ✅ Keybindings
- ✅ Snippets
- ✅ UI State

**Was NICHT synchronisiert (absichtlich):**
- ❌ API Keys (zu sensitiv!)
- ❌ File-specific configs
- ❌ Workspace credentials

---

### Step 5: API Keys für AI Tools speichern

Dies ist **KRITISCH** – nur so funktionieren Claude, Gemini, ChatGPT!

#### Option A: VS Code Secrets (EMPFOHLEN - sicher & einfach)

1. Drücke: `Ctrl+Shift+P`
2. Suche: **"VS Code: Open User Secrets"**
3. Wähle: **"VS Code: Open User Secrets"**
4. Eine JSON-Datei öffnet sich
5. Ersetze den Inhalt mit:

```json
{
  "claude-api-key": "sk-ant-YOUR_CLAUDE_KEY_HERE",
  "gemini-api-key": "YOUR_GEMINI_KEY_HERE",
  "openai-api-key": "sk-YOUR_OPENAI_KEY_HERE"
}
```

6. Speichern: `Ctrl+S`
7. Fertig!

#### Wo man die Keys findet:

| AI Tool | Link | Wie man Key bekommt |
|---------|------|------------------|
| **Claude** | https://console.anthropic.com/account/keys | Einloggen → "Create Key" → Kopieren |
| **Gemini** | https://makersuite.google.com/app/apikey | "Create API Key" → Kopieren |
| **ChatGPT** | https://platform.openai.com/account/api-keys | Einloggen → "+ Create new secret key" → Kopieren |

#### Option B: Environment Variable (falls du MacOS/Linux nutzt)

```bash
# Öffne dein Shell Profile
nano ~/.bashrc
# oder
nano ~/.zshrc

# Füge am Ende ein:
export CLAUDE_API_KEY="sk-ant-YOUR_KEY"
export GEMINI_API_KEY="YOUR_KEY"
export OPENAI_API_KEY="sk-YOUR_KEY"

# Speichere: Ctrl+X → Y → Enter
```

**Überprüfung (Test):**
```bash
echo $CLAUDE_API_KEY
# Sollte zeigen: sk-ant-... (nicht leer!)
```

---

### Step 6: npm Dependencies installieren

```bash
# Stelle sicher du im Ordner bist
cd Argus

# Installiere alle Packages
npm install

# oder mit pnpm (schneller)
pnpm install
```

Dies wird ~2 Minuten dauern.

**Überprüfung:**
```bash
ls node_modules/ | wc -l
# Sollte 100+ Packages zeigen
```

---

### Step 7: Dev Server starten

```bash
npm run dev
```

Warte bis du siehst:
```
▲ Next.js 15.x
  - Local:        http://localhost:3000
  - Environments: .env.local
```

---

### Step 8: Browser öffnen und testen

1. Öffne Browser: http://localhost:3000
2. Du solltest die BackstagePass App sehen
3. Alles funktioniert! 🎉

---

## ✅ Final Checklist

Nach diesen Steps solltest du abhaken können:

- [ ] Repository geclont (`git clone ...`)
- [ ] VS Code geöffnet (`code .`)
- [ ] Recommended Extensions installiert (18+)
- [ ] Settings Sync ON (GitHub Login)
- [ ] VS Code Secrets konfiguriert (API Keys gespeichert)
- [ ] npm install durchgeführt (`npm install`)
- [ ] Dev Server läuft (`npm run dev`)
- [ ] Browser zeigt App (`http://localhost:3000`)
- [ ] AI Chats funktionieren:
  - [ ] Ctrl+L: Claude Chat (wenn Extension aktiv)
  - [ ] Ctrl+I: ChatGPT (je nach Extension)
  - [ ] Gemini Chat öffnet sich

---

## 🎯 Dein Workflow ab jetzt

### Beim Starten (jeden Tag):

```bash
cd Argus
git pull origin main          # Neueste Changes holen
npm install                   # Falls dependencies sich geändert haben
npm run dev                   # Dev server starten
```

### Um Änderungen zu speichern:

```bash
git add .
git commit -m "feat: deine Änderung hier"
git push origin main
```

### Um AI Chat zu nutzen:

| AI | Aktivierung | Was macht es |
|----|-------------|-------------|
| **Claude** | Klick Extension Links, oder `/claude` | Code Review, Erklärungen, Debugging |
| **ChatGPT** | Klick Extension Links | Quick Q&A |
| **Copilot** | `Tab` beim Coding | Auto-Completions |

---

## 🔐 Security – Wichtig!

### ✅ Sicherheit macht Sinn:

```bash
# Secrets sind lokal verschlüsselt
Ctrl+Shift+P → "VS Code: Open User Secrets"

# .gitignore schützt deine Keys
git add .  # Keys werden NICHT zu GitHub gepusht!
```

### ❌ NIEMALS MACHEN:

```bash
# Niemals deine API Keys posten!
echo "CLAUDE_API_KEY=sk-ant-..." > .env  # ❌ NEIN!
git add .env  # ❌ NEIN!
```

---

## 🐛 Häufige Probleme

### Problem: "Extensions werden nicht empfohlen"

**Lösung:**
1. Reload Window: `Ctrl+Shift+P` → "Developer: Reload Window"
2. Oder: Starte VS Code komplett neu

### Problem: "API Key funktioniert nicht"

**Lösung:**
1. Überprüfe: `Ctrl+Shift+P` → "VS Code: Open User Secrets"
2. Ist der Key dort? Ja → Überprüfe Tippfehler
3. Reload Window: `Ctrl+Shift+P` → "Developer: Reload Window"

### Problem: "npm install fehlgeschlagen"

**Lösung:**
```bash
# Versuche Node-Version zu überprüfen
node --version  # Sollte v18+ sein
npm --version   # Sollte 9+ sein

# Wenn alt: Update Node.js von https://nodejs.org

# Dann erneut:
rm -rf node_modules/
npm install
```

### Problem: "Dev Server startet nicht"

**Lösung:**
```bash
# Überprüfe ob Port 3000 nicht belegt ist
lsof -i :3000  # macOS/Linux
netstat -ano | findstr :3000  # Windows

# Falls belegt:
npm run dev -- -p 3001  # Nutze anderen Port
```

---

## 📚 Weitere Dokumentation

- [VS-CODE-SETUP-GUIDE.md](VS-CODE-SETUP-GUIDE.md) – Detailliertes Setup
- [VSCODE-SECRETS-SETUP.md](VSCODE-SECRETS-SETUP.md) – Secrets Management
- [VSCODE-QUICK-REFERENCE.md](VSCODE-QUICK-REFERENCE.md) – Schnelle Referenz
- [README.md](../README.md) – Projekt Overview

---

## 💬 Fragen?

Wenn etwas nicht funktioniert:

1. Überprüfe die Documentationen oben
2. Frag im Team Slack
3. Kontakt: Springer (Project Manager)

---

**Herzlich Willkommen! 🎉**

Wir freuen uns, dich im BackstagePass Team zu haben!

**Nächste Schritte nach Onboarding:**
1. Schau dir die [Kanban Board](https://github.com/users/trismus/projects/2) an
2. Lies die aktuellen Issues zu deiner Rolle
3. Starte mit den einfachen Issues (mit "good first issue" Label)

**Viel Spaß beim Entwickeln!** 🚀

---

*Zuletzt aktualisiert: 2026-01-26*
*Verfasser: Springer (Project Manager)*
*Status: ✅ Production Ready*
