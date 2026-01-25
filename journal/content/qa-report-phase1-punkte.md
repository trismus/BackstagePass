# QA-Report: Offene Punkte für Phase 1

**Datum:** 2026-01-25
**Autor:** Kritiker (QA/Security)
**Status:** Analyse

---

## Zusammenfassung

Dieses Dokument analysiert drei zentrale QA-Themen, die vor oder während Phase 1 adressiert werden sollten. Für jedes Thema wird beschrieben: Was es ist, wie man es umsetzt, Vor- und Nachteile im frühen Stadium, sowie eine Dringlichkeitseinschätzung.

---

## 1. CI/CD Pipeline

### Was ist das?

Eine **Continuous Integration/Continuous Deployment (CI/CD) Pipeline** automatisiert das Testen und Deployen von Code bei jedem Push oder Pull Request. Bei GitHub wird dies typischerweise mit **GitHub Actions** realisiert.

### Wie realisieren?

1. Datei `.github/workflows/ci.yml` erstellen
2. Workflow definiert:
   - **Trigger:** Bei Push auf `main`/`develop` und bei Pull Requests
   - **Jobs:** Install dependencies, Linting (ESLint), Type-Check (TypeScript), Tests, Build
3. Beispiel-Workflow:

```yaml
name: CI
on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
        working-directory: apps/web
      - run: npm run lint
        working-directory: apps/web
      - run: npm run build
        working-directory: apps/web
```

### Pro/Cons im frühen Stadium

| Pro | Contra |
|-----|--------|
| Fehler werden sofort erkannt, bevor sie in `main` landen | Anfangs wenig Code zum Testen - Overhead erscheint gross |
| Entwickler gewöhnen sich früh an den Workflow | Setup-Zeit kostet initial ein paar Stunden |
| Verhindert "es funktioniert auf meinem Rechner"-Probleme | Bei sehr kleinem Team evtl. noch nicht kritisch |
| Dokumentiert implizit die Build-Schritte | - |

### Dringlichkeit: **MITTEL**

> **Empfehlung:** Sobald mehrere Entwickler (oder AI-Agents) parallel arbeiten, ist eine CI-Pipeline essentiell. Im Moment ist das Team klein, aber der Setup-Aufwand ist gering (1-2 Stunden). **Sollte in Phase 1 eingerichtet werden**, spätestens bevor das erste grössere Feature-Set gemerged wird.

---

## 2. Tests (Unit/Integration)

### Was ist das?

**Unit Tests** prüfen einzelne Funktionen oder Komponenten isoliert. **Integration Tests** prüfen das Zusammenspiel mehrerer Komponenten oder die Anbindung an externe Dienste (z.B. Supabase).

### Wie realisieren?

1. **Testing Framework installieren:**
   ```bash
   npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom
   ```

2. **Vitest konfigurieren** (`vitest.config.ts`):
   ```typescript
   import { defineConfig } from 'vitest/config'
   import react from '@vitejs/plugin-react'

   export default defineConfig({
     plugins: [react()],
     test: {
       environment: 'jsdom',
       setupFiles: ['./test/setup.ts'],
     },
   })
   ```

3. **Erste Tests schreiben:**
   - Utility-Funktionen (z.B. Formatierung, Validierung)
   - React-Komponenten (Rendering, User Interactions)
   - API-Routes / Server Actions (mit Mocks für Supabase)

4. **Test-Script in package.json:**
   ```json
   "scripts": {
     "test": "vitest",
     "test:run": "vitest run"
   }
   ```

### Pro/Cons im frühen Stadium

| Pro | Contra |
|-----|--------|
| Tests definieren erwartetes Verhalten - gute Dokumentation | Noch wenig Code vorhanden, den man testen könnte |
| Refactoring wird sicherer | Overhead bei schnellem Prototyping |
| Bugs werden früh gefunden, nicht erst in Production | Tests für UI können bei häufigen Design-Änderungen aufwändig sein |
| Test-Coverage wächst organisch mit dem Projekt | Lernkurve für Testing-Patterns (Mocking, etc.) |

### Dringlichkeit: **NIEDRIG bis MITTEL**

> **Empfehlung:** Im aktuellen Stadium (Phase 0/1) ist das Projekt noch im Aufbau. **Unit Tests für kritische Business-Logik** (z.B. Mitglieder-Validierung, Berechtigungen) sollten früh geschrieben werden. Umfassende Komponenten-Tests können warten, bis das UI stabiler ist. **Start mit 2-3 kritischen Tests**, dann organisch erweitern.

---

## 3. Branch Protection Rules

### Was ist das?

**Branch Protection** verhindert, dass Code direkt auf wichtige Branches (z.B. `main`, `develop`) gepusht wird. Stattdessen muss Code via Pull Request eingereicht und (optional) reviewed werden.

### Wie realisieren?

1. **GitHub Repository Settings öffnen**
2. **Branches → Add branch protection rule**
3. **Für `main` konfigurieren:**
   - [x] Require a pull request before merging
   - [x] Require status checks to pass (sobald CI existiert)
   - [x] Require branches to be up to date
   - [ ] Require approvals (optional bei kleinem Team)
   - [x] Do not allow bypassing the above settings

4. **Für `develop` (weniger strikt):**
   - [x] Require a pull request before merging
   - [x] Require status checks to pass

### Pro/Cons im frühen Stadium

| Pro | Contra |
|-----|--------|
| Verhindert versehentliche Pushes auf Production | Kann Entwicklung verlangsamen bei Solo-Arbeit |
| Erzwingt sauberen Git-Workflow von Anfang an | Ohne CI sind Status-Checks nicht möglich |
| Jede Änderung ist via PR dokumentiert | Bei kleinem Team evtl. "Review-Theater" |
| Einfacher Rollback durch klare PR-Historie | - |

### Dringlichkeit: **NIEDRIG**

> **Empfehlung:** Branch Protection ist ein **"Nice-to-have"** im frühen Stadium. Solange nur wenige Personen am Projekt arbeiten und alle wissen, was sie tun, ist direktes Pushen auf `develop` akzeptabel. **Für `main` sollte Protection aktiviert werden**, sobald Production-Traffic existiert. Der Setup dauert nur 5 Minuten.

---

## Fazit & Priorisierung

| Thema | Dringlichkeit | Aufwand | Empfehlung |
|-------|---------------|---------|------------|
| CI/CD Pipeline | MITTEL | 1-2h | In Phase 1 einrichten |
| Tests | NIEDRIG-MITTEL | Ongoing | Mit kritischen Tests starten |
| Branch Protection | NIEDRIG | 5min | Für `main` aktivieren, Rest später |

### Nächste Schritte

1. **Sofort:** Branch Protection für `main` aktivieren (5 Minuten)
2. **Phase 1 Start:** Basis-CI-Pipeline mit Lint + Build einrichten
3. **Phase 1 Mitte:** Erste Unit Tests für Mitglieder-Logik schreiben
4. **Phase 1 Ende:** Integration Tests für Supabase-Anbindung

---

*Erstellt vom Kritiker-Agent im Rahmen der QA-Analyse für BackstagePass/Argus.*
