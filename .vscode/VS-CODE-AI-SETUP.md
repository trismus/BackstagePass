# 🚀 VS Code AI Team Integration Setup Guide

**Status:** ✅ Ready for Configuration  
**Last Updated:** 2026-01-26

---

## 📋 Übersicht

Dieses Dokument erklärt, wie du die 8 BackstagePass AI Team Members in VS Code aktivierst.

**Komponenten:**
- `.vscode/ai-team-agents.md` – Alle 8 System Prompts
- `.vscode/settings.json` – AI Tool Konfiguration
- `.vscode/keybindings.json` – Schnell-Tasten für Agenten
- `.vscode/extensions.json` – Empfohlene Extensions

---

## ⚙️ Setup-Schritte

### Schritt 1: Extensions installieren

Öffne Terminal in VS Code:

```powershell
code --install-extension GitHub.Copilot
code --install-extension GitHub.Copilot-Chat
code --install-extension OpenAI.OpenAI-Copilot
code --install-extension Google.Gemini
code --install-extension ms-python.python
code --install-extension charliermarsh.ruff
code --install-extension dbaeumer.vscode-eslint
```

Oder: Öffne Extensions Tab (Ctrl+Shift+X) und suche diese IDs.

### Schritt 2: API Keys konfigurieren

Erstelle `.env.local` im Workspace Root:

```bash
# .env.local (NICHT in Git committen!)
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
GOOGLE_GEMINI_API_KEY=AIzaSy...
```

VS Code liest diese automatisch für Extensions.

**Optional (für PowerShell Profile):**

```powershell
# Füge zu deinem PS Profile hinzu:
$env:ANTHROPIC_API_KEY = "sk-ant-..."
$env:OPENAI_API_KEY = "sk-..."
$env:GOOGLE_GEMINI_API_KEY = "AIzaSy..."
```

### Schritt 3: VS Code neu starten

```powershell
code .
```

---

## 🎯 Agenten nutzen – 3 Optionen

### Option A: Keyboard Shortcut (SCHNELL)

```
Ctrl+Shift+1 → 🎭 Christian (Regisseur/User Stories)
Ctrl+Shift+2 → 🤸 Greg (Springer/Operations)
Ctrl+Shift+3 → 🔨 Martin (Bühnenmeister/Architecture)
Ctrl+Shift+4 → 🎨 Peter (Kulissenbauer/Code)
Ctrl+Shift+5 → 🖌️ Kim (Maler/Design)
Ctrl+Shift+6 → 👓 Ioannis (Kritiker/Review)
Ctrl+Shift+7 → 📝 Melanie (Redakteur/Content)
Ctrl+Shift+8 → 📚 Johannes (Chronist/Docs)
```

1. Drücke Shortcut
2. VS Code öffnet Copilot Chat
3. System Prompt wird automatisch geladen
4. Stelle deine Frage

### Option B: Copy-Paste Manual (FLEXIBEL)

1. Öffne `.vscode/ai-team-agents.md`
2. Kopiere System Prompt von Agent deiner Wahl
3. Öffne Copilot Chat (Ctrl+L)
4. Paste System Prompt
5. Stelle Frage

### Option C: Command Palette (VOLLSTÄNDIG)

1. Drücke Ctrl+Shift+P
2. Suche nach "Copilot:" oder deinem Agent-Namen
3. Wähle aus Liste
4. Stelle Frage

---

## 📖 Workflow-Beispiele

### Beispiel 1: User Story mit Christian erstellen

```
Shortcut: Ctrl+Shift+1

Prompt:
"Analysiere dieses Feature-Request und erstelle eine User Story:
'Nutzer möchte ihr Profil bearbeiten können'"

Christian antwortet mit:
- User Story Format
- Akzeptanzkriterien
- Done Definition
```

### Beispiel 2: Tech Plan mit Martin

```
Shortcut: Ctrl+Shift+3

Prompt:
"Erstelle einen Tech Plan für User Profile Management Feature"

Martin antwortet mit:
- Database Schema
- Data Flow Diagramm
- Security Considerations
- Scaling Notes
```

### Beispiel 3: Code Review mit Ioannis

```
Shortcut: Ctrl+Shift+6

Prompt:
"Reviewe diesen PR auf Security und Performance"
[Paste Code]

Ioannis antwortet mit:
- Security Issues
- Performance Suggestions
- Best Practice Violations
```

### Beispiel 4: Blog Post mit Melanie

```
Shortcut: Ctrl+Shift+7

Prompt:
"Schreib einen Blog Post über diese neue Feature für Developer"

Melanie antwortet mit:
- SEO-optimierter Artikel
- Code Examples
- Marketing Angle
```

---

## 🔧 Konfiguration anpassen

### Custom Keyboard Shortcuts

Bearbeite `.vscode/keybindings.json`:

```json
{
  "key": "ctrl+alt+c",  // Dein Shortcut
  "command": "workbench.action.openGlobalCommandPalette",
  "args": "🎭 Christian - Regisseur"
}
```

### Andere KI-Tools verwenden

Wenn du statt Claude, ChatGPT oder Gemini andere KIs nutzen möchtest:

**Für Claude (Anthropic):**
- Extension: `Anthropic.Claude` (offiziell)
- API Key: `.env.local` oder VS Code Settings

**Für ChatGPT (OpenAI):**
- Extension: `OpenAI.OpenAI-Copilot`
- API Key: `.env.local`

**Für Gemini (Google):**
- Extension: `Google.Gemini`
- API Key: `.env.local`

---

## 🚨 Troubleshooting

### Problem: "API Key not found"
**Lösung:** 
- Prüfe ob `.env.local` existiert
- Prüfe ob API Keys korrekt sind
- Starte VS Code neu

### Problem: Extensions laden nicht
**Lösung:**
- Deinstalliere & reinstalliere Extension
- Prüfe ob du mit GitHub account eingeloggt bist

### Problem: Keyboard Shortcuts funktionieren nicht
**Lösung:**
- Prüfe ob `keybindings.json` syntaktisch korrekt ist (JSON Validator nutzen)
- Starte VS Code neu

### Problem: Chat öffnet, aber System Prompt wird nicht geladen
**Lösung:**
- Copy System Prompt manuell from `.vscode/ai-team-agents.md`
- Oder nutze Copilot mit explizitem Prompt: "Du bist Christian, der Regisseur..."

---

## 📊 Empfehlung nach Use Case

| Use Case | Agent | Shortcut | KI |
|----------|-------|----------|-----|
| Neue Feature definieren | Christian | Ctrl+1 | Claude |
| Sprint planen | Greg | Ctrl+2 | ChatGPT |
| Architecture entwerfen | Martin | Ctrl+3 | Gemini/Claude |
| Code implementieren | Peter | Ctrl+4 | Claude |
| Design definieren | Kim | Ctrl+5 | Claude |
| Code reviewen | Ioannis | Ctrl+6 | Claude |
| Content schreiben | Melanie | Ctrl+7 | Claude |
| Docs aktualisieren | Johannes | Ctrl+8 | Claude |

---

## 🎓 Best Practices

### 1. Nutze den richtigen Agent
- **Christian** für Requirements & Planning
- **Peter** für Code-Fragen
- **Martin** für Architecture-Fragen
- **Ioannis** für Security & Quality

### 2. Kontext ist wichtig
Statt: "Schreib Code"  
Besser: "Schreib einen React Server Component für User Profile Table mit RLS"

### 3. Iteration ist key
- First Pass: Schnelle Lösung
- Second Pass: Refinement
- Third Pass: Polish

### 4. Kombiniere Agenten
1. **Christian** definiert Anforderung
2. **Martin** erstellt Tech Plan
3. **Peter** implementiert
4. **Ioannis** reviewt
5. **Melanie** schreibt Release Note
6. **Johannes** dokumentiert

---

## 📚 Weiterführende Ressourcen

- [AI Team Agents](.vscode/ai-team-agents.md) – Alle System Prompts
- [VS Code Settings](.vscode/settings.json) – Detaillierte Konfiguration
- [Daily Reports](/journal/content/) – Tägliche Team-Updates
- [Team Members](../docs/mitarbeiter-beschreibungen.md) – Rollenbeschreibungen

---

## ✅ Checkliste Setup Complete

- [ ] Extensions installiert
- [ ] API Keys in `.env.local` konfiguriert
- [ ] VS Code neu gestartet
- [ ] Keyboard Shortcuts getestet
- [ ] Einen Agent erfolgreich nutzt
- [ ] Workflow definiert

---

*Setup Guide v1.0*  
*Created: 2026-01-26*  
*Next Update: Nach erstem Team-Einsatz*
