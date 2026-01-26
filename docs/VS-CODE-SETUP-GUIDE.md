# 🔧 VS Code Setup Guide – Konsistente AI Extensions & Config

**Erstellt:** 2026-01-26
**Für:** BackstagePass Team (Multi-Device Setup)
**Ziel:** Alle VS Code Instanzen identisch konfiguriert

---

## 📋 Überblick

Dieses Guide stellt sicher, dass:
- ✅ Alle AI Extensions (Gemini, Claude, ChatGPT) auf allen Geräten verbunden sind
- ✅ Gleiche Extensions und Settings synchronisiert
- ✅ API Keys sicher gespeichert (nicht im Git!)
- ✅ Neue Team-Member können schnell onboarden

---

## 🚀 Quick Start (5 Min Setup)

### 1. VS Code Settings Sync aktivieren

**In VS Code:**
1. Drücke `Ctrl+Shift+P` (CMD+Shift+P auf Mac)
2. Suche: "Settings Sync"
3. Wähle: **"Settings Sync: Turn On"**
4. Melde dich mit GitHub an (oder Microsoft Account)
5. Wähle: **"Sign in with GitHub"**
6. Bestätige, dass deine Einstellungen synchronisiert werden

**Ergebnis:** Alle deine VS Code Settings, Extensions, Keybindings werden zu GitHub hochgeladen!

---

## 🔑 AI Extension Setup

### Schritt 1: Extensions installieren

Öffne VS Code und installiere diese Extensions:

```
Klick Extensions (Ctrl+Shift+X)

1. GitHub Copilot
   ID: github.copilot
   
2. Claude (Anthropic)
   ID: anthropic.claude
   
3. Google Gemini
   ID: google.makersuite-gemini-api
   
4. ChatGPT / OpenAI
   ID: openai.openai-gpt-4
```

**Oder:** Nutze `extensions.json` (siehe unten)

---

### Schritt 2: API Keys konfigurieren

**WICHTIG:** Speichere API Keys NICHT im Git Repository!

#### Option A: Local Settings (Empfohlen für Team)

Erstelle Datei: `~/.vscode/settings.json` (lokal, nicht im Git)

```json
{
  "claude.apiKey": "sk-ant-your-key-here",
  "gemini.apiKey": "your-gemini-key",
  "openai.apiKey": "sk-your-openai-key",
  "github.copilot.enable": {
    "*": true
  }
}
```

#### Option B: Environment Variables (Sicherer)

Erstelle Datei: `~/.bashrc` oder `~/.zshrc` (lokal):

```bash
# VS Code AI Extensions
export CLAUDE_API_KEY="sk-ant-your-key-here"
export GEMINI_API_KEY="your-gemini-key"
export OPENAI_API_KEY="sk-your-openai-key"
```

Oder Windows PowerShell Profile:

```powershell
# $PROFILE öffnen: notepad $PROFILE
$env:CLAUDE_API_KEY = "sk-ant-your-key-here"
$env:GEMINI_API_KEY = "your-gemini-key"
$env:OPENAI_API_KEY = "sk-your-openai-key"
```

#### Option C: VS Code Secrets (Empfohlen!)

Nutze VS Code Extension Secrets API:

1. Öffne Command Palette: `Ctrl+Shift+P`
2. Suche: "Secrets"
3. Wähle: "VS Code: Open User Secrets"
4. Speichere hier deine Keys:
   ```
   {
     "claude-api-key": "sk-ant-...",
     "gemini-api-key": "...",
     "openai-api-key": "sk-..."
   }
   ```

---

## 📁 Repository Config für Team

### Datei: `.vscode/extensions.json`

Erstelle diese Datei im Projekt-Root:

```json
{
  "recommendations": [
    "github.copilot",
    "anthropic.claude",
    "google.makersuite-gemini-api",
    "openai.openai-gpt-4",
    "eslint.vscode-eslint",
    "prettier.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "bradlc.vscode-tailwindcss",
    "eamodio.gitlens",
    "ms-vscode.remote-repositories",
    "ms-python.python",
    "ms-python.vscode-pylance"
  ]
}
```

**Effekt:** Wenn Team-Member Repo öffnet → VS Code schlägt diese Extensions vor!

---

### Datei: `.vscode/settings.json`

Erstelle diese Datei im Projekt-Root (Workspace Settings):

```json
{
  "editor.defaultFormatter": "prettier.prettier-vscode",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "extensions.recommendations": [],
  "[typescript]": {
    "editor.defaultFormatter": "prettier.prettier-vscode"
  },
  "[json]": {
    "editor.defaultFormatter": "prettier.prettier-vscode"
  },
  "search.exclude": {
    "**/node_modules": true,
    ".next": true,
    ".git": true,
    ".supabase": true
  },
  "files.exclude": {
    "**/.DS_Store": true,
    "**/.env.local": true,
    "**/node_modules": true
  },
  "[markdown]": {
    "editor.wordWrap": "on",
    "editor.formatOnSave": false
  }
}
```

---

### Datei: `.vscode/launch.json`

Für Debugging (wenn nötig):

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Next.js Dev",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/node_modules/.bin/next",
      "args": ["dev"],
      "console": "integratedTerminal"
    }
  ]
}
```

---

### Datei: `.vscode/tasks.json`

Für häufige Tasks:

```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "npm install",
      "type": "shell",
      "command": "npm",
      "args": ["install"],
      "problemMatcher": [],
      "group": {
        "kind": "build",
        "isDefault": true
      }
    },
    {
      "label": "Next.js dev",
      "type": "shell",
      "command": "npm",
      "args": ["run", "dev"],
      "isBackground": true,
      "problemMatcher": {
        "pattern": {
          "regexp": "^(.*):([0-9]+):([0-9]+).*$",
          "file": 1,
          "location": 2,
          "message": 3
        },
        "background": {
          "activeOnStart": true,
          "beginsPattern": "^.*starting.*",
          "endsPattern": "^.*ready.*"
        }
      }
    }
  ]
}
```

---

## 🔐 Secrets & API Keys Management

### ❌ NICHT MACHEN:
```bash
# Niemals API Keys in Git commiten!
git add .env.local  # NEIN!
echo "CLAUDE_API_KEY=sk-ant-..." > .env  # NEIN!
```

### ✅ RICHTIG MACHEN:

**Datei: `.gitignore`** (in Repository-Root):

```
# API Keys & Secrets
.env
.env.local
.env.production.local
.env.development.local

# VS Code User Secrets
.vscode/secrets.json

# IDE
.vscode/settings.json.local
```

**Datei: `docs/SETUP-GUIDE.md`** (Anleitung für Team):

```markdown
# VS Code Setup für BackstagePass

## API Keys konfigurieren

Jedes Team-Member muss diese Keys lokal konfigurieren:

### 1. Claude API Key
- Gehe zu: https://console.anthropic.com
- Erstelle API Key
- Speichere in: VS Code Secrets oder `~/.bashrc`

### 2. Google Gemini API Key
- Gehe zu: https://makersuite.google.com/app/apikey
- Erstelle API Key
- Speichere lokal

### 3. OpenAI ChatGPT API Key
- Gehe zu: https://platform.openai.com/account/api-keys
- Erstelle API Key
- Speichere lokal

### 4. GitHub Copilot
- Melde dich mit GitHub an
- VS Code prompt wird angezeigt

## Secrets speichern (sicherste Methode)

1. Öffne VS Code
2. Drücke: `Ctrl+Shift+P`
3. Suche: "VS Code: Open User Secrets"
4. Speichere Secrets als JSON
```

---

## 🤖 AI Extension Config Details

### Claude (Anthropic)

Extension Settings in `.vscode/settings.json`:

```json
{
  "anthropic.apiKey": "${CLAUDE_API_KEY}",
  "anthropic.model": "claude-3-sonnet-20240229",
  "anthropic.systemPrompt": "Du bist ein hilfreicher Assistant für BackstagePass Development"
}
```

### Google Gemini

```json
{
  "google.apiKey": "${GEMINI_API_KEY}",
  "google.model": "gemini-pro",
  "google.theme": "light"
}
```

### OpenAI ChatGPT

```json
{
  "openai.apiKey": "${OPENAI_API_KEY}",
  "openai.organization": "your-org-id",
  "openai.model": "gpt-4"
}
```

### GitHub Copilot

```json
{
  "github.copilot.enable": {
    "*": true,
    "yaml": false,
    "plaintext": false
  },
  "github.copilot.chat.enabled": true
}
```

---

## 📋 Onboarding Checklist für neue Team-Member

1. **Repository clonen:**
   ```bash
   git clone https://github.com/trismus/Argus.git
   cd Argus
   ```

2. **VS Code öffnen:**
   ```bash
   code .
   ```

3. **Extensions installieren:**
   - VS Code fragt automatisch (wegen `.vscode/extensions.json`)
   - Oder: `Ctrl+Shift+X` → klick "Recommended"

4. **Settings Sync aktivieren:**
   - `Ctrl+Shift+P` → "Settings Sync: Turn On"
   - Melde dich mit GitHub an

5. **API Keys konfigurieren (lokal!):**
   - `Ctrl+Shift+P` → "VS Code: Open User Secrets"
   - Speichere deine persönlichen API Keys

6. **Dependencies installieren:**
   ```bash
   npm install
   # oder
   pnpm install
   ```

7. **Dev Server starten:**
   ```bash
   npm run dev
   ```

8. **Fertig!** 🎉
   - Alle AI Extensions sollten funktionieren
   - VS Code Settings synchronisiert

---

## 🔄 Synchronisierung über Geräte

### Automatisch (empfohlen):
- ✅ Settings Sync aktivieren (VS Code Built-in)
- ✅ GitHub Account nutzen für Sync
- ✅ Alles synchronisiert automatisch

### Manuell:
- Exportiere Settings: `Code → Preferences → Settings → ...`
- Kopiere `.vscode/` Folder zu neuem Gerät

---

## 🐛 Troubleshooting

### Problem: "API Key nicht gefunden"

**Lösung 1:** Überprüfe ob Key in User Settings ist
```bash
# macOS/Linux
cat ~/.vscode/settings.json | grep apiKey

# Windows PowerShell
Get-Content $env:APPDATA\Code\User\settings.json | Select-String apiKey
```

**Lösung 2:** Setze Environment Variable
```bash
export CLAUDE_API_KEY="sk-ant-..."
code .
```

**Lösung 3:** Nutze VS Code Secrets statt Environment Variables

### Problem: "Extension wird nicht empfohlen"

- Überprüfe `.vscode/extensions.json` Syntax (JSON valid?)
- Reload VS Code: `Ctrl+Shift+P` → "Reload Window"

### Problem: "Settings synchronisieren nicht"

- Überprüfe ob Settings Sync aktiv: `Ctrl+Shift+P` → "Settings Sync"
- Überprüfe GitHub Login: VS Code Account Icon (unten links)
- Manuell synchronisieren: `Ctrl+Shift+P` → "Settings Sync: Download"

---

## 📊 Zusammenfassung

| Gerät 1 | Gerät 2 | Gerät 3 |
|---------|---------|---------|
| ✅ Settings Sync | ✅ Settings Sync | ✅ Settings Sync |
| ✅ Extensions | ✅ Extensions | ✅ Extensions |
| ✅ AI Chat (Claude) | ✅ AI Chat (Claude) | ✅ AI Chat (Claude) |
| ✅ AI Chat (Gemini) | ✅ AI Chat (Gemini) | ✅ AI Chat (Gemini) |
| ✅ AI Chat (ChatGPT) | ✅ AI Chat (ChatGPT) | ✅ AI Chat (ChatGPT) |
| ⚠️ API Keys (lokal!) | ⚠️ API Keys (lokal!) | ⚠️ API Keys (lokal!) |

---

## 🎯 Best Practices

- **Never commit API Keys** → `.gitignore` nutzen
- **Use Settings Sync** → Extensions & Settings automatisch sync
- **Use VS Code Secrets** → Sichereste Methode für Keys
- **Document everything** → Team Guide in `docs/`
- **Test on fresh install** → Überprüfe Onboarding Works

---

**Setup-Zeit:** ~15 Min pro Gerät (danach automatisch!)
**Team-Wert:** 🔥 Huge – konsistente Developer Experience

*Erstellt durch: Springer*
*Datum: 2026-01-26*
