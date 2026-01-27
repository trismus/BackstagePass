# GitHub Bot Account Setup für BackstagePass AI Team

**Status:** 📋 Inbox Item
**Erstellt von:** Greg (Springer/Project Manager)
**Datum:** 2026-01-26
**Kategorie:** Infrastructure / Git Setup
**Priority:** 🟡 Medium (Nice-to-have, aber sauber)

---

## 📌 Problem Statement

Aktuell: Alle AI-Team Commits (Christian, Peter, Kim, Ioannis, etc.) werden unter "GitHub User [TBD]" gemacht.

**Frage:** Wie managen wir 8 AI-Agents in Git, ohne 8 separate GitHub User zu erstellen?

---

## 🎯 Anforderungen

- ✅ Alle 8 AI-Agents können commits machen
- ✅ Erkennbar, welcher Agent was committed hat
- ✅ Nicht 8 separate GitHub Accounts
- ✅ Saubere Git History
- ✅ Einfach zu managen

---

## 3️⃣ Lösungs-Optionen

### Option 1: Git Author Overrides (QUICK & DIRTY)

**Wie:**
```powershell
# Commit mit spezifischem Author
git -c user.name="Christian (Regisseur)" -c user.email="ai-team@backstagepass.local" commit -m "..."
```

**Pros:**
- ✅ Keine neuen Accounts nötig
- ✅ Schnell implementierbar

**Cons:**
- ❌ Verwirrend auf GitHub (Author nicht authentifiziert)
- ❌ Nicht vertrauenswürdig (jeder könnte sich als "Christian" ausgeben)
- ❌ GitHub zeigt "Unknown Author"

**Fazit:** 🔴 Nicht empfohlen für Production

---

### Option 2: Single Bot Account (EMPFOHLEN ⭐)

**Wie:**
1. Erstelle einen GitHub Account: `backstagepass-team`
2. Generiere Personal Access Token
3. Speichere Token in `.env`
4. Alle Agents committen unter diesem Account
5. Agent-Name in Commit Message oder Co-Author

**Setup:**
```bash
# .env
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxx
GIT_AUTHOR_NAME="BackstagePass Team"
GIT_AUTHOR_EMAIL="team@backstagepass.local"
```

**Commit Format:**
```
feat(auth): Login form validation

Implemented login page with form validation and error handling.

[Agent: Christian - Regisseur]
[Time: 2026-01-26 14:30]
```

**Oder mit Co-Author Footer (GitHub native):**
```
feat(auth): Login form validation

Implemented by BackstagePass AI Team.

Co-authored-by: Christian (Regisseur) <christian@backstagepass.local>
```

**Pros:**
- ✅ Ein Account zu managen
- ✅ Ein Token in `.env`
- ✅ GitHub zeigt verifizierten Commit
- ✅ Klar erkennbar im Commit Log (Agent Name in Message)
- ✅ Professionell aussehende Git History
- ✅ GitHub erkennt Co-Author automatisch

**Cons:**
- ⚠️ Alle 8 Agents unter einem Account
- ⚠️ Individuelle Commit-Statistiken nicht möglich

**Timeline:** ⏱️ 10 Minuten Setup

---

### Option 3: Commit Footer Pattern (ELEGANT)

**Wie:**
Nutze GitHub's native `Co-authored-by` Footer

```
git commit -m "feat(design): Component styles

This commit includes styling for Button, Input, and Modal components
for the Auth Module.

Co-authored-by: Kim (Maler) <kim@backstagepass.local>
Co-authored-by: Peter (Kulissenbauer) <peter@backstagepass.local>"
```

**Pros:**
- ✅ GitHub erkennt automatisch multiple Authors
- ✅ Contributes zu multiple Profilen (wenn authentifiziert)
- ✅ Professionell
- ✅ GitHub UI zeigt alle Co-Authors

**Cons:**
- ⚠️ Braucht authentifizierte Emails
- ⚠️ Komplexer für Automation

**Fazit:** 🟢 Gut, aber komplizierter

---

## ✅ EMPFEHLUNG: Option 2 (Single Bot Account)

**Warum?**
1. **Einfachheit:** Ein Account, ein Token, ein `.env` Entry
2. **Klarheit:** Agent Name ist in jeder Commit Message
3. **Vertrauenswürdigkeit:** GitHub verifiziert den Commit
4. **Skalierbar:** Für alle 8 Agents ohne Mehraufwand
5. **Wartbar:** Minimale Komplexität

---

## 🚀 Implementation Plan

### Phase 1: Setup (1 Tag)

**Verantwortlich:** Greg (Springer)

1. **GitHub Account erstellen**
   ```
   Username: backstagepass-team
   Email: team@backstagepass.local (oder deine Domain)
   ```

2. **Personal Access Token generieren**
   - Settings → Developer Settings → Personal Access Tokens
   - Scope: `repo` (Read/Write on repositories)
   - Copy Token

3. **In `.env.local` speichern**
   ```bash
   GITHUB_TOKEN=ghp_...
   GIT_AUTHOR_NAME="BackstagePass Team"
   GIT_AUTHOR_EMAIL="team@backstagepass.local"
   ```

4. **`.env.local` zu `.gitignore` hinzufügen** (falls nicht schon)
   ```
   .env.local
   .env.*.local
   ```

5. **Git global konfigurieren** (optional, für lokale Commits)
   ```powershell
   git config user.name "BackstagePass Team"
   git config user.email "team@backstagepass.local"
   ```

### Phase 2: Workflow (laufend)

**Für jeden Commit:**
```powershell
git commit -m "feat(module): Description [Agent: Christian - Regisseur]"
```

**Oder explizit mit Author:**
```powershell
git -c user.name="BackstagePass Team" -c user.email="team@backstagepass.local" commit -m "..."
```

### Phase 3: Documentation (1 Tag)

**Erstelle:**
- `.github/COMMIT_GUIDELINES.md` - Wie committen mit Agent-Namen
- `.github/workflows/ai-commits.yml` - Optional für Automation
- Team Guide im Wiki

---

## 📋 Commit Message Format (Standard)

```
feat(scope): Brief description [Agent: Name - Role]

Optional: More detailed explanation

[Timestamp: 2026-01-26 14:30]
[Module: 0 (Auth)]
```

**Beispiele:**
```
feat(auth): Login form validation [Agent: Christian - Regisseur]

fix(design): Button hover state [Agent: Kim - Maler]

docs: Update README [Agent: Johannes - Chronist]

refactor(types): Simplify user types [Agent: Peter - Kulissenbauer]
```

---

## 🔐 Security Notes

- ✅ Token in `.env.local` speichern
- ✅ `.env.local` NICHT in Git committen
- ✅ Token rotieren nach X Monaten
- ✅ Token Permissions minimal halten (nur `repo` scope)
- ✅ Für CI/CD: GitHub Secrets nutzen

---

## 🎯 Alternativen kurz bewertet

| Option | Setup | Klarheit | Vertrauen | Empfehlung |
|--------|-------|----------|-----------|------------|
| Option 1: Author Overrides | ⚡ Quick | 🟡 Mittel | 🔴 Niedrig | ❌ Nein |
| Option 2: Single Bot ⭐ | ⚡ 10min | 🟢 Hoch | 🟢 Hoch | ✅ JA |
| Option 3: Co-Author Footer | 🟡 15min | 🟢 Hoch | 🟢 Hoch | 🟢 Alternativ |

---

## 📅 Next Steps

1. **Christian (Regisseur):** Genehmigung für GitHub Account
2. **Greg (Springer - das bin ich):** Account erstellen + Token generieren
3. **Team:** `.env.local` konfigurieren + Workflow trainieren
4. **Johannes (Chronist):** Dokumentation schreiben

---

## 💭 Team Input Gebraucht

**Questions for Team:**
- [ ] Ist ein Single Account `backstagepass-team` OK oder lieber `argus-team`?
- [ ] Welche Email verwenden? (`team@backstagepass.local` oder `ai@...`?)
- [ ] Sollen Co-Author Footers genutzt werden oder nur Agent Name in Message?
- [ ] Brauchen wir GitHub Actions für automated Commits?

---

## 📚 References

- [GitHub Co-Author Documentation](https://docs.github.com/en/pull-requests/committing-changes-to-your-project/creating-and-editing-commits/creating-a-commit-with-multiple-authors)
- [Personal Access Tokens](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens)
- [Git Commit Best Practices](https://www.conventionalcommits.org/)

---

*Erstellt von Greg (Springer)*
*Ready for Discussion & Implementation*
