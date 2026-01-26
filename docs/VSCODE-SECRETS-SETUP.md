# 🔐 VS Code Secrets Setup – API Keys Management

**Erstellt:** 2026-01-26  
**Ziel:** Sicheres Management von API Keys für AI Extensions  

---

## 🚀 Quick Start – API Keys speichern (3 Min)

### Schritt 1: VS Code Secrets öffnen

1. Drücke: **`Ctrl+Shift+P`** (Windows/Linux) oder **`Cmd+Shift+P`** (Mac)
2. Suche: **"VS Code: Open User Secrets"**
3. Wähle: **"VS Code: Open User Secrets"**
4. Eine neue JSON-Datei öffnet sich

### Schritt 2: API Keys eintragen

Kopiere diese Template in die Datei und fülle deine Keys ein:

```json
{
  "claude-api-key": "sk-ant-YOUR_CLAUDE_KEY_HERE",
  "gemini-api-key": "YOUR_GEMINI_KEY_HERE",
  "openai-api-key": "sk-YOUR_OPENAI_KEY_HERE",
  "github-copilot-token": "gho_YOUR_GITHUB_TOKEN_HERE"
}
```

### Schritt 3: Speichern

- Drücke: **`Ctrl+S`** (Save)
- Fertig! 🎉

---

## 📍 Wo man API Keys findet

### 1️⃣ Claude API Key (Anthropic)

**Link:** https://console.anthropic.com/account/keys

1. Gehe zu: https://console.anthropic.com
2. Klick: **"Account"** (oben rechts)
3. Klick: **"API Keys"**
4. Klick: **"Create Key"**
5. Kopiere den Key
6. Speichere in VS Code Secrets unter: `claude-api-key`

**Format:** `sk-ant-...`

---

### 2️⃣ Google Gemini API Key

**Link:** https://makersuite.google.com/app/apikey

1. Gehe zu: https://makersuite.google.com/app/apikey
2. Klick: **"Create API Key"**
3. Wähle: **"Create API key in new project"** (wenn nötig)
4. Kopiere den Key
5. Speichere in VS Code Secrets unter: `gemini-api-key`

**Format:** `AIza...`

---

### 3️⃣ OpenAI ChatGPT API Key

**Link:** https://platform.openai.com/account/api-keys

1. Gehe zu: https://platform.openai.com
2. Klick: **"Account"** (oben rechts)
3. Klick: **"API Keys"**
4. Klick: **"+ Create new secret key"**
5. Kopiere den Key (nur 1x sichtbar!)
6. Speichere in VS Code Secrets unter: `openai-api-key`

**Format:** `sk-proj-...` oder `sk-...`

---

### 4️⃣ GitHub Copilot (GitHub Token)

**Link:** https://github.com/settings/tokens

GitHub Copilot nutzt dein GitHub-Konto automatisch:

1. Gehe zu: https://github.com/settings/tokens
2. Klick: **"Generate new token"**
3. Wähle: **"Generate new token (classic)"**
4. Setze Expiration: 90 days
5. Wähle Scopes: `read:user`, `gist`, `codespace`
6. Kopiere den Token
7. Speichere in VS Code Secrets unter: `github-copilot-token`

**ODER** (einfacher): VS Code authentifiziert automatisch via GitHub OAuth

---

## 🔐 Sicherheit – Best Practices

### ✅ WAS DU TUN SOLLST:

- ✅ Speichere Keys in **VS Code Secrets** (verschlüsselt lokal)
- ✅ Speichere Keys in **Environment Variables** (z.B. `.bashrc`, PowerShell `$PROFILE`)
- ✅ Nutze separate Keys pro Gerät (wenn möglich)
- ✅ Rotiere Keys regelmäßig (monatlich empfohlen)
- ✅ Speichere wichtige Keys in **Password Manager** (1Password, Bitwarden, KeePass)

### ❌ WAS DU NICHT TUN SOLLST:

- ❌ **NIEMALS** Keys in `.env` oder `.env.local` speichern (wird oft versehentlich committed!)
- ❌ **NIEMALS** Keys in Git commiten (GitHub scannt und invalidiert sie automatisch)
- ❌ **NIEMALS** Keys im Chat/Slack teilen
- ❌ **NIEMALS** Keys hardcoden im Source Code
- ❌ **NIEMALS** Keys in `.vscode/settings.json` speichern (wird oft synced!)

---

## 🛡️ Falls API Key kompromittiert wurde

### Sofort-Maßnahmen:

1. **GitHub:** https://github.com/settings/tokens → Delete betroffene Tokens
2. **Claude:** https://console.anthropic.com/account/keys → Delete betroffenen Key
3. **OpenAI:** https://platform.openai.com/account/api-keys → Delete betroffenen Key
4. **Gemini:** https://makersuite.google.com/app/apikey → Delete betroffenen Key

5. **Neuen Key erstellen** und in VS Code Secrets aktualisieren

---

## 🔄 Extensions konfigurieren

Nach dem du Keys in Secrets gespeichert hast, nutzen die Extensions sie automatisch:

### Claude Extension

Die Extension `anthropic.claude` liest automatisch aus Secrets:
- Sucht nach: `claude-api-key` in VS Code Secrets
- Oder: `CLAUDE_API_KEY` Environment Variable
- Oder: `ANTHROPIC_API_KEY` Environment Variable

### Gemini Extension

Die Extension `google.makersuite-gemini-api` liest automatisch:
- Sucht nach: `gemini-api-key` in VS Code Secrets
- Oder: `GEMINI_API_KEY` Environment Variable

### OpenAI Extension

Die Extension `openai.openai-gpt-4` liest automatisch:
- Sucht nach: `openai-api-key` in VS Code Secrets
- Oder: `OPENAI_API_KEY` Environment Variable

### GitHub Copilot

GitHub Copilot authentifiziert sich automatisch via GitHub:
1. Beim ersten Start zeigt VS Code ein Browser-Fenster
2. Du meldest dich mit deinem GitHub-Konto an
3. VS Code speichert den Token automatisch (sicher!)
4. Fertig – Copilot funktioniert

---

## 🧪 Test: Sind die Keys richtig konfiguriert?

### Test in Terminal

```bash
# Claude
echo "Claude API Key konfiguriert:" $env:CLAUDE_API_KEY

# Gemini  
echo "Gemini API Key konfiguriert:" $env:GEMINI_API_KEY

# OpenAI
echo "OpenAI API Key konfiguriert:" $env:OPENAI_API_KEY
```

### Test in VS Code

1. Öffne das Command Palette: `Ctrl+Shift+P`
2. Suche: **"Claude: Configure API Key"**
3. Es sollte zeigen: `✅ API Key configured`

Falls es zeigt: `❌ No API Key found` → Überprüfe deine Secrets!

---

## 📋 Team Onboarding – Secrets Setup für neue Member

### Für jeden neuen Team-Member:

1. **VS Code Secrets öffnen:**
   ```
   Ctrl+Shift+P → "VS Code: Open User Secrets"
   ```

2. **Sich eigene API Keys besorgen:**
   - Claude: https://console.anthropic.com/account/keys
   - Gemini: https://makersuite.google.com/app/apikey
   - OpenAI: https://platform.openai.com/account/api-keys
   - GitHub: https://github.com/settings/tokens

3. **Keys in Secrets eintragen** (siehe Template oben)

4. **Test durchführen** (siehe Test-Section oben)

5. **Fertig!** 🎉

**Zeit:** ~10 Minuten pro Person

---

## 🐛 Troubleshooting

### Problem: "Claude Extension findet API Key nicht"

**Lösung 1:** Überprüfe ob Key in Secrets gespeichert:
```powershell
# PowerShell:
& code --open-url vscode://secrets
# oder
code --user-data-dir ~/.vscode/secrets
```

**Lösung 2:** Versuche Environment Variable:
```powershell
$env:CLAUDE_API_KEY = "sk-ant-YOUR_KEY"
code .
```

**Lösung 3:** Extension neuladen:
```
Ctrl+Shift+P → "Developer: Reload Window"
```

---

### Problem: "VS Code Secrets ist nicht sichtbar"

Diese Funktion ist in VS Code v1.65+ verfügbar.

1. Überprüfe VS Code Version: `Help → About`
2. Falls älter: Update VS Code (via Installer oder Store)
3. Neu starten: `Ctrl+Shift+P → "Developer: Reload Window"`

---

### Problem: "Secrets wurden gelöscht / nicht gespeichert"

VS Code speichert Secrets automatisch beim Save (`Ctrl+S`).

Falls verloren gegangen:
1. Stelle Key erneut her (bei Provider: Claude, Gemini, OpenAI)
2. Öffne Secrets neu: `Ctrl+Shift+P → "VS Code: Open User Secrets"`
3. Speichere Key erneut

---

## 📚 Weitere Ressourcen

- [VS Code Secrets Documentation](https://code.visualstudio.com/docs/editor/variables-reference#_environment-variables)
- [Claude API Docs](https://docs.anthropic.com)
- [Google Gemini API](https://ai.google.dev)
- [OpenAI API Docs](https://platform.openai.com/docs)
- [GitHub Copilot Setup](https://github.com/github/copilot.vim)

---

**Verfasser:** Springer (Project Manager)  
**Datum:** 2026-01-26  
**Status:** ✅ Production Ready
