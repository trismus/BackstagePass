# Dev/Test/Prod Strategie - BackstagePass

**Status:** Draft
**Datum:** 2026-01-24
**Erstellt von:** Regisseur

---

## 1. Vercel Environments Übersicht

```
                    ┌─────────────────────────────────────────────────┐
                    │                  VERCEL PROJECT                 │
                    │                  backstagepass                  │
                    └─────────────────────────────────────────────────┘
                                          │
          ┌───────────────────────────────┼───────────────────────────┐
          │                               │                           │
          ▼                               ▼                           ▼
┌─────────────────────┐     ┌─────────────────────┐     ┌─────────────────────┐
│     DEVELOPMENT     │     │       PREVIEW       │     │     PRODUCTION      │
│─────────────────────│     │─────────────────────│     │─────────────────────│
│ Branch: develop     │     │ Branch: feature/*   │     │ Branch: main        │
│                     │     │         fix/*       │     │                     │
│ URL:                │     │ URL:                │     │ URL:                │
│ dev.backstagepass   │     │ pr-{id}.vercel.app  │     │ backstagepass.de    │
│      .vercel.app    │     │                     │     │                     │
│                     │     │                     │     │                     │
│ Supabase:           │     │ Supabase:           │     │ Supabase:           │
│ backstagepass-dev   │     │ backstagepass-dev   │     │ backstagepass-prod  │
│                     │     │                     │     │                     │
│ Auto-Deploy: ✅     │     │ Auto-Deploy: ✅     │     │ Auto-Deploy: ✅     │
│ Protection: None    │     │ Protection: None    │     │ Protection: Auth    │
└─────────────────────┘     └─────────────────────┘     └─────────────────────┘
```

---

## 2. Git-Branch-Strategie

```
main (Production)
  │
  ├── develop (Development/Staging)
  │     │
  │     ├── feature/issue-123-member-list
  │     │     └── → PR → develop → PR → main
  │     │
  │     ├── fix/issue-456-login-bug
  │     │     └── → PR → develop → PR → main
  │     │
  │     └── claude/setup-dev-prod-strategy-enyyE
  │           └── → PR → develop
  │
  └── hotfix/critical-security-fix
        └── → PR → main (+ cherry-pick → develop)
```

### Branch-Typen

| Branch-Prefix | Ziel-Branch | Beschreibung |
|---------------|-------------|--------------|
| `feature/`    | `develop`   | Neue Features |
| `fix/`        | `develop`   | Bug Fixes (nicht-kritisch) |
| `claude/`     | `develop`   | AI-Agent Branches |
| `hotfix/`     | `main`      | Kritische Fixes (direkt in Prod) |
| `docs/`       | `develop`   | Dokumentation |
| `refactor/`   | `develop`   | Code Refactoring |

---

## 3. Environment-Konfiguration

### 3.1 Vercel Projekt-Setup

```bash
# 1. Vercel CLI installieren
npm i -g vercel

# 2. Projekt initialisieren
cd apps/web
vercel link

# 3. Environments konfigurieren
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add NEXT_PUBLIC_SUPABASE_URL preview
vercel env add NEXT_PUBLIC_SUPABASE_URL development
```

### 3.2 Environment Variables Matrix

| Variable | Development | Preview | Production |
|----------|-------------|---------|------------|
| `NEXT_PUBLIC_SUPABASE_URL` | `*-dev.supabase.co` | `*-dev.supabase.co` | `*-prod.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Dev Key | Dev Key | Prod Key |
| `SUPABASE_SERVICE_ROLE_KEY` | Dev Service Key | Dev Service Key | Prod Service Key |
| `NEXT_PUBLIC_SITE_URL` | `dev.backstagepass.vercel.app` | `pr-*.vercel.app` | `backstagepass.de` |
| `ENABLE_DEBUG` | `true` | `true` | `false` |

### 3.3 Supabase Projekte

Wir benötigen **zwei** Supabase-Projekte:

1. **backstagepass-dev** (Development + Preview)
   - Wird für lokale Entwicklung und PR-Previews verwendet
   - Testdaten erlaubt
   - Kann jederzeit zurückgesetzt werden

2. **backstagepass-prod** (Production)
   - Nur für `main` Branch
   - Echte Nutzerdaten
   - Backups aktiv (daily)
   - Point-in-time Recovery (Pro Plan)

---

## 4. Deployment-Workflow

### 4.1 Feature-Entwicklung

```
┌──────────────────────────────────────────────────────────────────┐
│                    FEATURE DEVELOPMENT FLOW                      │
└──────────────────────────────────────────────────────────────────┘

1. BRANCH ERSTELLEN
   │
   │  git checkout develop
   │  git pull origin develop
   │  git checkout -b feature/issue-123-member-list
   │
   ▼
2. ENTWICKELN + COMMIT
   │
   │  # Lokale Entwicklung mit dev Supabase
   │  npm run dev
   │
   │  # Commits
   │  git commit -m "feat(members): add list component"
   │
   ▼
3. PUSH + PREVIEW DEPLOYMENT
   │
   │  git push -u origin feature/issue-123-member-list
   │
   │  → Vercel erstellt automatisch Preview URL
   │  → https://backstagepass-issue-123-xxxxx.vercel.app
   │
   ▼
4. PULL REQUEST → develop
   │
   │  gh pr create --base develop
   │
   │  → KRITIKER (AI) macht Code Review
   │  → Tests müssen grün sein
   │  → Mind. 1 Approval nötig
   │
   ▼
5. MERGE → develop
   │
   │  → Automatisches Deployment auf dev.backstagepass.vercel.app
   │  → Integration Tests laufen
   │
   ▼
6. RELEASE → main
   │
   │  # Wenn develop stabil ist:
   │  gh pr create --base main --head develop
   │
   │  → Finaler Review
   │  → Merge → Production Deployment
   │
   ▼
7. PRODUCTION LIVE
   │
   └── backstagepass.de (Production)
```

### 4.2 Hotfix-Flow (Kritische Bugs)

```
main ─────┬─────────────────────────────┬─────────>
          │                             │
          │  hotfix/security-fix        │
          └──────────┬──────────────────┘
                     │
                     ▼
              PR → main (direkt!)
                     │
                     └── Cherry-pick → develop
```

---

## 5. Vercel-Konfiguration

### 5.1 vercel.json (apps/web/vercel.json)

```json
{
  "git": {
    "deploymentEnabled": {
      "main": true,
      "develop": true
    }
  },
  "github": {
    "silent": true
  },
  "build": {
    "env": {
      "NEXT_TELEMETRY_DISABLED": "1"
    }
  },
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "NOSNIFF"
        }
      ]
    }
  ]
}
```

### 5.2 Branch-spezifische Domains

```
# Vercel Dashboard → Settings → Domains

backstagepass.de              → main (Production)
www.backstagepass.de          → main (Production)
dev.backstagepass.vercel.app  → develop (Development)
*.backstagepass.vercel.app    → feature/* (Previews)
```

---

## 6. CI/CD Pipeline (GitHub Actions)

### 6.1 Basis-Workflow (.github/workflows/ci.yml)

```yaml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  lint-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: apps/web/package-lock.json

      - name: Install Dependencies
        working-directory: apps/web
        run: npm ci

      - name: Lint
        working-directory: apps/web
        run: npm run lint

      - name: Type Check
        working-directory: apps/web
        run: npm run type-check

      - name: Test
        working-directory: apps/web
        run: npm run test

  # Vercel handles deployment automatically via Git integration
```

---

## 7. Rollback-Strategie

### 7.1 Instant Rollback (Vercel)

```bash
# Vercel Dashboard → Deployments → Select Previous → Promote to Production

# Oder via CLI:
vercel rollback [deployment-url]
```

### 7.2 Database Rollback (Supabase)

```bash
# Point-in-time Recovery (Pro Plan)
# Supabase Dashboard → Database → Backups → Restore to Point in Time

# Oder Migration Rollback:
supabase db reset --linked
supabase migration repair --status reverted
```

---

## 8. Monitoring & Alerts

### 8.1 Vercel Analytics

- **Web Vitals:** LCP, FID, CLS
- **Real User Monitoring:** Echte Performance-Daten
- **Error Tracking:** Runtime Errors

### 8.2 Supabase Monitoring

- **Database Performance:** Query Execution Times
- **Auth Metrics:** Login Success/Failure Rates
- **Storage Usage:** Bucket Sizes

### 8.3 Alerts (Einrichten in Vercel/Supabase)

| Event | Alert | Channel |
|-------|-------|---------|
| Deployment Failed | Sofort | Email + Slack |
| Error Rate > 5% | Sofort | Email + Slack |
| Response Time > 2s | Warnung | Slack |
| Database Connection Issues | Sofort | Email |

---

## 9. Checklisten

### 9.1 Vor dem Merge zu `develop`

- [ ] Code Review bestanden (KRITIKER)
- [ ] Alle Tests grün
- [ ] Type Check bestanden
- [ ] Lint Errors behoben
- [ ] Preview Deployment funktioniert
- [ ] Keine Secrets im Code

### 9.2 Vor dem Release zu `main`

- [ ] develop Branch ist stabil (mind. 24h ohne Bugs)
- [ ] Alle Features getestet auf dev Environment
- [ ] CHANGELOG.md aktualisiert
- [ ] Migration Files vorhanden (wenn DB-Änderungen)
- [ ] Rollback-Plan dokumentiert

### 9.3 Nach dem Production Deployment

- [ ] Smoke Tests auf Production
- [ ] Monitoring Dashboard prüfen
- [ ] Error Logs prüfen (erste 30 Min)
- [ ] User Feedback Channel überwachen

---

## 10. Nächste Schritte

1. **Vercel Projekt erstellen**
   - [ ] Neues Projekt: `backstagepass`
   - [ ] GitHub Repo verbinden
   - [ ] Custom Domain konfigurieren

2. **Supabase Projekte erstellen**
   - [ ] `backstagepass-dev` (Frankfurt Region)
   - [ ] `backstagepass-prod` (Frankfurt Region)
   - [ ] Vercel Integration aktivieren

3. **GitHub Repository konfigurieren**
   - [ ] Branch Protection Rules für `main` und `develop`
   - [ ] Required Reviews: 1
   - [ ] Required Status Checks: CI

4. **CI/CD einrichten**
   - [ ] GitHub Actions Workflow erstellen
   - [ ] Secrets konfigurieren

---

*Dieses Dokument ist Teil der BackstagePass Dokumentation und sollte bei größeren Infrastruktur-Änderungen aktualisiert werden.*
