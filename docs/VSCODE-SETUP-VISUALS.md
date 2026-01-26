# 🎨 VS Code Setup – Visuelle Übersicht

---

## 🗺️ Dein Setup-Weg (Flowchart)

```
                    🎯 START: Neuer Developer
                         ↓
                 Lese TEAM-ONBOARDING-VSCODE.md
                         ↓
    ┌─────────────────────┴─────────────────────┐
    ↓                                           ↓
[Gerät 1]                               [Gerät 2 / Gerät 3]
    ├─ git clone                            ├─ git clone
    ├─ code .                               ├─ code .
    ├─ Install Extensions                  ├─ Install Extensions (Auto!)
    ├─ Settings Sync ON                    ├─ Settings Sync ON (Auto!)
    ├─ API Keys (VS Code Secrets)   →      ├─ API Keys (eigene Secrets)
    ├─ npm install                         ├─ npm install
    └─ npm run dev                         └─ npm run dev
       ↓                                      ↓
   ✅ READY!                             ✅ READY!

   Alle Geräte sind                      Alle Extensions gleich
   identisch konfiguriert!               Alle Settings gleich!
```

---

## 📦 Was wird wo gespeichert?

```
┌──────────────────────────────────────────────────────────────┐
│                    VS CODE SETUP                              │
├──────────────────────────────────────────────────────────────┤
│                                                                │
│  🌍 VS Code Cloud (GitHub)                                   │
│  ├─ Settings Sync Storage                                    │
│  │  ├─ Extensions (installed list)                          │
│  │  ├─ Settings (user preferences)                          │
│  │  ├─ Keybindings (shortcuts)                              │
│  │  └─ Snippets (code templates)                            │
│  │  [Sync'd across all your devices]                        │
│  │  [Encrypted on GitHub]                                   │
│  │  [API Keys: ❌ NOT here!]                                │
│  │                                                            │
│  └─ 🔒 (Auto-sync via GitHub account)                       │
│                                                                │
│  ───────────────────────────────────────────────────────────│
│                                                                │
│  📁 Dein Gerät (Gerät 1)                                     │
│  ├─ ~/.vscode/                                              │
│  │  ├─ settings.json (user settings)      [Sync'd]         │
│  │  ├─ keybindings.json                   [Sync'd]         │
│  │  └─ storage/                                             │
│  │     └─ secretStorage/                                    │
│  │        └─ 🔐 API Keys (encrypted)      [NO Sync!]      │
│  │                                                            │
│  ├─ Git Repository (Argus)                                  │
│  │  ├─ .vscode/                          [Shared!]         │
│  │  │  ├─ extensions.json (recommendations)                │
│  │  │  ├─ settings.json (workspace)                        │
│  │  │  ├─ tasks.json (build tasks)                         │
│  │  │  └─ launch.json (debugging)                          │
│  │  │                                                        │
│  │  └─ .gitignore ← Schützt `.env*` & Secrets!             │
│  │                                                            │
│  └─ 🏠 (Local & Encrypted)                                  │
│                                                                │
│  ───────────────────────────────────────────────────────────│
│                                                                │
│  📁 Dein Gerät (Gerät 2 / Laptop)                            │
│  ├─ ~/.vscode/                                              │
│  │  ├─ settings.json (user settings)      [Sync'd]         │
│  │  ├─ keybindings.json                   [Sync'd]         │
│  │  └─ storage/                                             │
│  │     └─ secretStorage/                                    │
│  │        └─ 🔐 API Keys (encrypted)      [NO Sync!]      │
│  │           (Deine eigenen Keys!)                          │
│  │                                                            │
│  ├─ Git Repository (Argus)                                  │
│  │  ├─ .vscode/ (auto-updated via git pull)               │
│  │  └─ (Gleich wie Gerät 1!)                               │
│  │                                                            │
│  └─ 🏠 (Local & Encrypted)                                  │
│                                                                │
└──────────────────────────────────────────────────────────────┘

🔑 KEY INSIGHT:
   ✅ Settings & Extensions automatisch sync'd
   ❌ API Keys intentional NICHT sync'd (Security!)
   ✅ Jedes Gerät hat eigene API Keys (lokal verschlüsselt)
   ✅ Git Repository hält Team-Config (.vscode/)
```

---

## 🔄 Synchronisierungs-Diagramm

```
                      VS Code Settings Sync
                    (Auto-Update alle 30 Sec)

                    Your GitHub Account
                    (Cloud Storage)
                             │
                    ┌────────┼────────┐
                    ↓        ↓        ↓
                  PC 1    Mac 1   Laptop
              ┌─────────┐ ┌────────┐ ┌──────────┐
              │ Extensions        │ │Extensions│
              │ Settings          │ │ Settings │
              │ Keybindings   ←─→ │ │Keybindings
              │ Snippets          │ │ Snippets │
              │                   │ │          │
              │ ❌ NO API Keys    │ │❌NO Keys │
              │ (Local encrypted) │ │(Local)   │
              └─────────┘ └────────┘ └──────────┘
```

---

## 🎯 Extension Installation Flow

```
Neuer Developer startet VS Code
            ↓
   .vscode/extensions.json wird gelesen
   (Liste von 18 recommended Extensions)
            ↓
   VS Code zeigt Popup:
   "These extensions are recommended
    for BackstagePass project"
            ↓
   Developer klickt: "Install All"
            ↓
   ┌────────────┬──────────────┬────────────┬───────┐
   ↓            ↓              ↓            ↓       ↓
GitHub        Claude        Gemini       ChatGPT  ESLint
Copilot       AI Chat       AI Chat      AI Chat  Formatter
   ↓            ↓              ↓            ↓       ↓
   └────────────┴──────────────┴────────────┴───────┘
              (Alle installiert!)
                    ↓
        VS Code Settings Sync:
        Speichere diese Extension-Liste
                    ↓
        Auf anderen Geräten:
        Extensions werden AUTO-INSTALLIERT
        (Wenn du dich anmeldest)
                    ↓
           ✅ Alle Geräte identisch!
```

---

## 🔐 API Key Security Architecture

```
┌──────────────────────────────────────────────────────────┐
│              API KEY SECURITY LAYERS                      │
├──────────────────────────────────────────────────────────┤
│                                                            │
│  Layer 1: Source (wo du Keys bekommst)                   │
│  ┌─────────────────────────────────────────────────┐    │
│  │ Claude:   https://console.anthropic.com/keys    │    │
│  │ Gemini:   https://makersuite.google.com/apikey │    │
│  │ OpenAI:   https://platform.openai.com/keys     │    │
│  │ GitHub:   https://github.com/settings/tokens   │    │
│  └─────────────────────────────────────────────────┘    │
│                    ↓ (COPY)                              │
│                                                            │
│  Layer 2: Storage (wo du Keys speicherst)                │
│  ┌──────────────────┬────────────────┬──────────────┐   │
│  │ VS Code Secrets  │ Environment    │ .bashrc/.    │   │
│  │ (RECOMMENDED)    │ Variable       │ zshrc        │   │
│  │                  │ (good)         │ (okay)       │   │
│  │ Encrypts:  ✅   │ Encrypts:  ❌  │ Encrypts: ❌ │   │
│  │ Local:     ✅   │ Local:     ✅  │ Local:    ✅ │   │
│  │ Sync:      ❌   │ Sync:      ❌  │ Sync:     ❌ │   │
│  └──────────────────┴────────────────┴──────────────┘   │
│                    ↓ (STORED SAFELY)                     │
│                                                            │
│  Layer 3: Access (wo Extensions Keys nutzen)             │
│  ┌─────────────────────────────────────────────────┐    │
│  │ VS Code Extension reads from:                   │    │
│  │ 1. VS Code Secrets (first check)                │    │
│  │ 2. Environment Variables (second check)         │    │
│  │ 3. .env file (fallback - don't do this!)        │    │
│  └─────────────────────────────────────────────────┘    │
│                    ↓ (REQUEST AUTH)                      │
│                                                            │
│  Layer 4: Transmission (Extension → API)                 │
│  ┌─────────────────────────────────────────────────┐    │
│  │ HTTPS/TLS Encryption                            │    │
│  │ (nur Key gesendet, nicht Code)                  │    │
│  └─────────────────────────────────────────────────┘    │
│                    ↓ (ENCRYPTED)                         │
│                                                            │
│  ✅ API Response kommt zurück                            │
│                                                            │
│  ⚠️ WICHTIG:                                             │
│  - Niemals Keys in .env committen (.gitignore schützt!)  │
│  - Niemals Keys im Chat/Slack posten                     │
│  - Niemals Keys im Code hardcoden                        │
│  - Regelmäßig rotieren (monatlich)                       │
│                                                            │
└──────────────────────────────────────────────────────────┘
```

---

## 📊 Team Setup Status Board

```
┌──────────────────────────────────────────────────────────────┐
│                 TEAM SETUP STATUS BOARD                       │
├──────┬──────────┬───────────┬──────────────┬─────────────────┤
│Role  │ Device 1 │ Device 2  │ API Keys OK  │ Status          │
├──────┼──────────┼───────────┼──────────────┼─────────────────┤
│Dev A │ ✅ Ready │ ✅ Ready  │ ✅ Claude    │ ✅ All Systems Go
│      │ Windows  │ MacBook   │ ✅ Gemini    │                 │
│      │          │           │ ✅ ChatGPT   │                 │
├──────┼──────────┼───────────┼──────────────┼─────────────────┤
│Dev B │ ✅ Ready │ ⏳ Setup   │ ✅ Claude    │ ⏳ Waiting Setup
│      │ Ubuntu   │ In Prog   │ ⏳ Gemini    │  (Dev 2)        │
│      │          │           │ ✅ ChatGPT   │                 │
├──────┼──────────┼───────────┼──────────────┼─────────────────┤
│Dev C │ ✅ Ready │ ✅ Ready  │ ❌ Claude    │ ⚠️  API Key Issue
│      │ Windows  │ Windows   │ ✅ Gemini    │  (Claude needs fix)
│      │          │           │ ✅ ChatGPT   │                 │
└──────┴──────────┴───────────┴──────────────┴─────────────────┘

Legend:
  ✅ = Ready / Configured / OK
  ⏳ = In Progress / Waiting
  ❌ = Failed / Needs Attention
```

---

## 🚀 Timeline: Typical Setup Progression

```
Time    Activity                          Device 1    Device 2
─────   ──────────────────────────────    ────────    ────────

0:00    Clone Repository                  ✅          -
0:02    Open VS Code                      ✅          -
0:05    Install Extensions (dialog)       ⏳          -
0:08    Extensions Done                   ✅          -
0:10    Settings Sync: Turn ON            ✅          -
0:12    GitHub Login (browser)            ⏳          -
0:14    Settings Sync Cloud Done          ✅          -
0:15    Settings Sync Ready               ✅          ⏳ (auto-triggered)
0:16    Open User Secrets                 ⏳          -
0:18    Paste API Keys (Claude, etc.)     ✅          -
0:20    Reload Window                     ✅          ⏳
0:22    npm install                       ⏳          ✅ (Extensions Auto-Installed!)
0:25    npm install Done                  ✅          ✅
0:26    npm run dev                       ✅          ✅
0:27    Dev Server Running                ✅          ✅
0:28    Browser: http://localhost:3000    ✅          ✅
0:29    Test AI Chat (Claude)             ✅          ✅
0:30    🎉 FULLY READY!                  ✅          ✅
        Both devices identical!
        All Extensions working!
        All AI Tools connected!
```

---

## 🎯 Decision Tree: "Was sollte ich speichern wo?"

```
            "Wo speichere ich das?"
                     │
        ┌────────────┼────────────┐
        ↓            ↓            ↓
    API Key?    Settings?   Extensions?
        │            │            │
        │            │        Neue Extension?
        │            │            │
        ├─ Ja    ├─ Ja        ├─ Ja
        │        │            │
        │        ↓            ↓
        │    Persönlich?   In .vscode/?
        │    │              │
        │    ├─ Ja  └─ Ja   ├─ Ja → Add to
        │    │              │        extensions.json
        │    ↓              │        (in Git)
        │ Store in:         │
        │ User Settings ├─ Nein   └─ Nein → Try
        │ (.vscode)     │              personal
        │              └─ Nein → Ask
        │                        Springer
        │
        └─ Nein → Store in
           VS Code Secrets
           (Ctrl+Shift+P →
            Open User Secrets)


        RESULT:
        ├─ .vscode/ (Team Config) → Git Repo
        ├─ User Settings → Cloud Sync
        ├─ API Keys → VS Code Secrets (Local!)
        └─ Extensions → Both (.json + Cloud)
```

---

## 📈 Adoption Path

```
Month 1: Initial Setup
┌─────────────┐
│ Week 1      │
│ ├─ Docs published
│ ├─ Dev A onboards
│ ├─ Dev B onboards
│ └─ 50% Team Ready
│
│ Week 2-4    │
│ ├─ Dev C-F onboards
│ ├─ Settings refined
│ ├─ Docs updated
│ └─ 100% Team Ready
└─────────────┘

Month 2+: Operations
┌─────────────┐
│ Ongoing     │
│ ├─ New devs: 20 min onboarding
│ ├─ Settings auto-sync'd
│ ├─ Extensions auto-installed
│ ├─ No manual sync needed!
│ └─ 🔄 Fully automated
└─────────────┘
```

---

## 💡 Visual: Why This Setup Matters

```
OHNE Setup:                      MIT Setup:
─────────────────────────        ──────────────────────

Dev A                            Dev A
├─ VS Code 1.85                  ├─ VS Code 1.90
├─ Extensions: 12                ├─ Extensions: 18  ✅
├─ ESLint broken?                ├─ ESLint working  ✅
├─ Prettier issues?              ├─ Prettier perfect✅
├─ No Claude?                    ├─ Claude ready    ✅
├─ Gemini not working?           ├─ Gemini ready    ✅
└─ CHAOS 😱                      └─ 👍 PRODUCTIVE!

Dev B                            Dev B
├─ VS Code 1.88                  ├─ VS Code 1.90   ✅
├─ Extensions: 10                ├─ Extensions: 18  ✅
├─ ESLint broken?                ├─ ESLint working  ✅
├─ Different keybindings         ├─ Same keybinds   ✅
├─ No Claude?                    ├─ Claude ready    ✅
└─ CONFUSION 😕                  └─ 🎯 ALIGNED!

Team                             Team
├─ No consistency                ├─ 100% Consistent
├─ Debugging is hard             ├─ Debugging is easy
├─ Onboarding takes DAYS         ├─ Onboarding takes 20min
└─ Lost productivity 📉          └─ High productivity 📈
```

---

**Erstellt durch:** Springer (Project Manager)
**Datum:** 2026-01-26
**Visualisierung:** Komplette Setup-Architektur übersichtlich

