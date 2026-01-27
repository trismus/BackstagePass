# Was sind Software-Tests und warum brauchen wir sie?

**Datum:** 28. Januar 2026
**Zielgruppe:** Technisch interessierte Personen ohne Programmiererfahrung
**Lesezeit:** 15-20 Minuten

---

## Einleitung: Die Analogie zum Theater

Stell dir vor, du bist Regisseur einer Theaterproduktion. Bevor die Premiere stattfindet, machst du Proben. Viele Proben. Du probst einzelne Szenen, dann ganze Akte, und schliesslich das komplette Stück von Anfang bis Ende.

**Software-Tests sind die Proben der Programmierung.**

Genau wie beim Theater gibt es verschiedene Arten von "Proben":
- **Einzelproben** (Unit Tests) - Ein Schauspieler übt seinen Monolog
- **Szenenproben** (Integration Tests) - Mehrere Schauspieler proben zusammen
- **Hauptproben** (End-to-End Tests) - Das komplette Stück wird durchgespielt

---

## Teil 1: Warum überhaupt testen?

### Das Problem ohne Tests

Stell dir vor, du änderst eine Zeile Code. Diese Zeile betrifft die Anmeldung für Helfereinsätze. Du testest manuell: "Funktioniert die Anmeldung noch? Ja!"

Aber hast du auch getestet:
- Was passiert, wenn jemand sich zweimal anmeldet?
- Was passiert, wenn die Rolle bereits voll ist?
- Was passiert, wenn zwei Personen gleichzeitig den letzten Platz buchen?
- Was passiert bei einem Netzwerkfehler?
- Was passiert, wenn jemand nicht eingeloggt ist?

**Manuelles Testen ist:**
- Zeitaufwändig (jedes Mal alles durchklicken)
- Fehleranfällig (man vergisst Szenarien)
- Nicht reproduzierbar (war der Fehler wirklich da?)
- Langweilig (niemand will 50x dasselbe klicken)

### Die Lösung: Automatisierte Tests

Ein automatisierter Test ist wie eine Checkliste, die sich selbst abarbeitet:

```
✓ Kann sich ein Mitglied anmelden?
✓ Wird eine Doppel-Anmeldung verhindert?
✓ Kommt man auf die Warteliste wenn voll?
✓ Wird eine Bestätigungs-Email gesendet?
✓ Kann man sich wieder abmelden?
```

Diese Checkliste läuft in Sekunden durch - jedes Mal, wenn jemand Code ändert.

---

## Teil 2: Die drei Test-Typen erklärt

### Unit Tests - Die Einzelprobe

**Was ist das?**

Ein Unit Test prüft eine einzelne, kleine Funktion isoliert. "Unit" bedeutet "Einheit" - die kleinste testbare Einheit deines Codes.

**Theater-Analogie:**

Ein Schauspieler steht alleine auf der Bühne und spricht seinen Text. Kein Bühnenbild, keine Mitspieler, keine Requisiten. Nur er und sein Text.

Frage: "Kann dieser Schauspieler seinen Text fehlerfrei aufsagen?"

**Konkretes Beispiel aus BackstagePass:**

```
Test: "Kann ein Event erstellt werden?"

Vorbereitung:
- Simuliere eine leere Datenbank

Aktion:
- Rufe die Funktion "createHelferEvent" auf
- Übergib: Name="Sommerfest", Datum="2026-06-15"

Erwartung:
- Funktion antwortet mit: success=true
- Funktion gibt eine Event-ID zurück
```

**Vorteile von Unit Tests:**
- Sehr schnell (Millisekunden pro Test)
- Präzise Fehlerortung ("Fehler in Funktion X, Zeile Y")
- Einfach zu schreiben und zu verstehen

**Grenzen von Unit Tests:**
- Testen nur isolierte Teile
- Echte Probleme entstehen oft im Zusammenspiel

---

### Integration Tests - Die Szenenprobe

**Was ist das?**

Ein Integration Test prüft, ob mehrere Komponenten zusammen funktionieren. "Integration" bedeutet "Zusammenführung".

**Theater-Analogie:**

Drei Schauspieler proben eine Dialogszene. Sie müssen aufeinander reagieren, Stichwörter geben, im richtigen Timing sprechen.

Frage: "Funktioniert das Zusammenspiel dieser drei Personen?"

**Konkretes Beispiel aus BackstagePass:**

```
Test: "Anmeldung mit E-Mail-Bestätigung"

Vorbereitung:
- Simuliere Datenbank mit einem Event
- Simuliere E-Mail-Service

Aktion:
- Rufe "anmelden" auf
- Diese Funktion ruft intern auf:
  → Datenbank: "Speichere Anmeldung"
  → E-Mail-Service: "Sende Bestätigung"

Erwartung:
- Anmeldung ist in Datenbank gespeichert
- E-Mail-Service wurde aufgerufen
- Benutzer erhält Erfolgsmeldung
```

**Vorteile von Integration Tests:**
- Testen realistischere Szenarien
- Finden Probleme in der Kommunikation zwischen Komponenten

**Grenzen von Integration Tests:**
- Langsamer als Unit Tests
- Fehler schwerer zu lokalisieren

---

### End-to-End Tests (E2E) - Die Hauptprobe

**Was ist das?**

Ein E2E-Test simuliert einen echten Benutzer, der durch die komplette Anwendung navigiert. Ein Roboter öffnet einen echten Browser und klickt sich durch.

**Theater-Analogie:**

Die Generalprobe. Alles ist wie bei der echten Aufführung: Kostüme, Bühnenbild, Licht, Ton, Publikum (zumindest ein paar Zuschauer). Das komplette Stück wird von Anfang bis Ende durchgespielt.

Frage: "Funktioniert die gesamte Aufführung?"

**Konkretes Beispiel aus BackstagePass:**

```
Test: "Externes Helfer-Anmeldung"

1. Roboter öffnet Browser
2. Roboter navigiert zu: backstagepass.app/public/helfer/abc123
3. Roboter sieht: "Sommerfest 2026 - Helfer gesucht!"
4. Roboter findet Formular
5. Roboter tippt ein:
   - Name: "Max Mustermann"
   - E-Mail: "max@example.com"
   - Telefon: "079 123 45 67"
6. Roboter klickt: "Anmelden"
7. Roboter wartet auf Bestätigung
8. Roboter prüft: Erscheint "Erfolgreich angemeldet"?

Wenn ja: ✓ Test bestanden
Wenn nein: ✗ Test fehlgeschlagen
```

**Vorteile von E2E Tests:**
- Testen die echte Benutzererfahrung
- Finden Probleme, die nur im Browser auftreten
- Höchste Konfidenz ("Wenn das funktioniert, funktioniert alles")

**Grenzen von E2E Tests:**
- Langsam (Sekunden bis Minuten pro Test)
- Manchmal instabil ("flaky" - mal geht's, mal nicht)
- Teuer in der Wartung

---

## Teil 3: Unsere Test-Werkzeuge

### Vitest - Für Unit & Integration Tests

**Was ist Vitest?**

Vitest ist ein Programm, das deine Test-Dateien findet und ausführt. Es ist wie ein Prüfer, der deine Checkliste durchgeht.

**Wie funktioniert es?**

1. Du schreibst Test-Dateien (enden auf `.test.ts`)
2. Vitest findet diese Dateien automatisch
3. Vitest führt jeden Test aus
4. Vitest zeigt dir: ✓ bestanden oder ✗ fehlgeschlagen

**Was wir damit testen:**

| Datei | Testet |
|-------|--------|
| `helferliste.test.ts` | Alle Helfer-Funktionen |

**Unsere 20+ Tests prüfen:**
- Events erstellen, bearbeiten, löschen
- Rollen hinzufügen und verwalten
- Anmeldungen (intern und extern)
- Abmeldungen
- Statusänderungen
- Fehlerbehandlung

---

### Playwright - Für End-to-End Tests

**Was ist Playwright?**

Playwright ist ein "Browser-Roboter". Es kann einen echten Chrome-Browser fernsteuern: Seiten öffnen, Text eintippen, Buttons klicken, auf Elemente warten.

**Wie funktioniert es?**

```
Playwright: *öffnet Chrome*
Playwright: *navigiert zu localhost:3000/login*
Playwright: *findet Eingabefeld "E-Mail"*
Playwright: *tippt "admin@test.local"*
Playwright: *findet Eingabefeld "Passwort"*
Playwright: *tippt "geheim123"*
Playwright: *findet Button "Anmelden"*
Playwright: *klickt*
Playwright: *wartet auf neue Seite*
Playwright: *prüft ob URL "/dashboard" enthält*
Playwright: "Test bestanden!"
```

**Was wir damit testen:**

| Test-Datei | Simuliert | Prüft |
|------------|-----------|-------|
| `helferliste-admin.spec.ts` | Administrator | Events erstellen, Rollen verwalten, Anmeldungen bearbeiten |
| `helferliste-member.spec.ts` | Vereinsmitglied | Events ansehen, Anmelden, Abmelden |
| `helferliste-public.spec.ts` | Externer Helfer | Öffentliche Seite, Registrierung ohne Login |

---

## Teil 4: Die Tests ausführen - Schritt für Schritt

### Voraussetzungen

Bevor du Tests ausführen kannst, brauchst du:

1. **Node.js** - Die Laufzeitumgebung für JavaScript
   - Download: https://nodejs.org
   - Empfohlen: Version 20 oder höher

2. **Das Projekt** - Auf deinem Computer
   ```
   C:\GIT\BackstagePass\
   ```

3. **Dependencies installiert** - Alle benötigten Pakete
   ```
   npm install
   ```

### Die Test-Befehle

Öffne ein Terminal (Kommandozeile) und navigiere zum Projekt:

```
cd C:\GIT\BackstagePass\apps\web
```

Nun hast du folgende Befehle zur Verfügung:

---

#### `npm run test` - Interaktiver Modus

**Was passiert:**
- Vitest startet und bleibt aktiv
- Bei jeder Code-Änderung laufen die Tests automatisch neu
- Perfekt während der Entwicklung

**Ausgabe sieht so aus:**
```
 ✓ lib/actions/helferliste.test.ts (23 tests) 847ms
   ✓ Helferliste Actions
     ✓ getHelferEvents
       ✓ returns empty array when no events exist
       ✓ returns events with role counts
       ✓ handles errors gracefully
     ✓ createHelferEvent
       ✓ creates a new event and returns success
       ✓ returns error on failure
     ...

 Test Files  1 passed (1)
      Tests  23 passed (23)
   Start at  14:32:15
   Duration  1.24s
```

**Beenden:** Drücke `q` oder `Ctrl+C`

---

#### `npm run test:run` - Einmaliger Durchlauf

**Was passiert:**
- Alle Tests laufen einmal durch
- Programm beendet sich danach
- Gut für schnelle Überprüfung

**Wann verwenden:**
- Vor einem Commit ("Ist noch alles in Ordnung?")
- In CI/CD Pipelines (automatische Prüfung)

---

#### `npm run test:coverage` - Mit Abdeckungsbericht

**Was passiert:**
- Tests laufen durch
- Zusätzlich: Analyse, welcher Code getestet wurde

**Ausgabe:**
```
 ✓ lib/actions/helferliste.test.ts (23 tests)

----------|---------|----------|---------|---------|
File      | % Stmts | % Branch | % Funcs | % Lines |
----------|---------|----------|---------|---------|
helferliste.ts | 85.2% | 78.4% | 92.3% | 85.2% |
----------|---------|----------|---------|---------|
```

**Was bedeuten die Zahlen?**

| Metrik | Bedeutung | Unser Wert |
|--------|-----------|------------|
| Statements | Wie viele Zeilen wurden ausgeführt? | 85.2% |
| Branches | Wie viele Verzweigungen (if/else) wurden geprüft? | 78.4% |
| Functions | Wie viele Funktionen wurden aufgerufen? | 92.3% |
| Lines | Wie viele Zeilen insgesamt? | 85.2% |

**Faustregel:** 80%+ ist gut, 100% ist selten sinnvoll.

---

#### `npm run test:e2e` - Browser-Tests

**Was passiert:**
- Playwright startet
- Ein unsichtbarer Chrome-Browser öffnet sich
- Der Roboter klickt sich durch die App
- Ergebnisse werden angezeigt

**Voraussetzung:**
```
npx playwright install
```
(Lädt die Browser-Engines herunter, einmalig nötig)

**Ausgabe:**
```
Running 15 tests using 1 worker

  ✓ helferliste-admin.spec.ts:20:7 › can view helferliste overview (2.3s)
  ✓ helferliste-admin.spec.ts:32:7 › can create a new helfer event (4.1s)
  ✓ helferliste-member.spec.ts:20:7 › can view available helfer events (1.8s)
  ...

  15 passed (45.2s)
```

**Wichtig:** Die App muss laufen! Entweder:
- `npm run dev` in einem anderen Terminal, oder
- Playwright startet sie automatisch (konfiguriert in `playwright.config.ts`)

---

#### `npm run test:e2e:ui` - Browser-Tests mit Oberfläche

**Was passiert:**
- Playwright öffnet eine visuelle Oberfläche
- Du siehst jeden Test einzeln
- Du kannst Tests manuell starten
- Du siehst den Browser in Aktion

**Screenshot der UI:**
```
┌─────────────────────────────────────────────────────────┐
│  Playwright Test Runner                                  │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ▸ helferliste-admin.spec.ts (7 tests)                  │
│    ✓ can view helferliste overview                      │
│    ✓ can create a new helfer event                      │
│    ○ can add role instances from templates              │
│    ...                                                   │
│                                                          │
│  ▸ helferliste-member.spec.ts (6 tests)                 │
│  ▸ helferliste-public.spec.ts (6 tests)                 │
│                                                          │
│  [Run all]  [Run selected]  [Debug]                     │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

**Perfekt für:**
- Fehlersuche ("Warum schlägt dieser Test fehl?")
- Verstehen, was der Test macht
- Screenshots bei Fehlern ansehen

---

## Teil 5: Was tun, wenn ein Test fehlschlägt?

### Beispiel: Fehlgeschlagener Unit Test

```
 ✗ lib/actions/helferliste.test.ts
   ✗ createHelferEvent › creates a new event and returns success

   AssertionError: expected false to be true

   - Expected: true
   + Received: false

    at Object.<anonymous> (lib/actions/helferliste.test.ts:142:28)
```

**Analyse:**
1. **Welcher Test?** `createHelferEvent › creates a new event and returns success`
2. **Was war erwartet?** `true` (Erfolg)
3. **Was kam zurück?** `false` (Misserfolg)
4. **Wo im Code?** Zeile 142 in der Test-Datei

**Mögliche Ursachen:**
- Code-Änderung hat etwas kaputt gemacht
- Test ist veraltet und passt nicht mehr zum Code
- Externe Abhängigkeit (Datenbank, API) antwortet anders

---

### Beispiel: Fehlgeschlagener E2E Test

```
 ✗ helferliste-admin.spec.ts:32:7 › can create a new helfer event

   Error: Timeout 5000ms exceeded.

   Waiting for locator('button[type="submit"]')
```

**Analyse:**
1. **Welcher Test?** Event erstellen als Admin
2. **Was ging schief?** Button wurde nicht gefunden
3. **Warum?** Timeout nach 5 Sekunden

**Mögliche Ursachen:**
- Button existiert nicht mehr (HTML geändert)
- Button hat anderen Text/Typ bekommen
- Seite lädt zu langsam
- Seite hat Fehler und zeigt Button nicht an

**Debugging-Tipps:**
1. Führe Test mit UI aus: `npm run test:e2e:ui`
2. Schau dir den Screenshot an (wird bei Fehler gespeichert)
3. Prüfe, ob die App überhaupt läuft
4. Öffne die Seite manuell im Browser

---

## Teil 6: Zusammenfassung

### Die Test-Pyramide

```
        /\
       /  \        E2E Tests
      / 15 \       (wenige, aber wichtige)
     /------\
    /        \     Integration Tests
   /    20    \    (mittlere Anzahl)
  /------------\
 /              \  Unit Tests
/      100+      \ (viele, schnelle)
------------------
```

**Prinzip:** Viele schnelle Unit Tests an der Basis, wenige langsame E2E Tests an der Spitze.

### Unsere Test-Befehle auf einen Blick

| Befehl | Dauer | Wann verwenden |
|--------|-------|----------------|
| `npm run test` | Läuft dauerhaft | Während Entwicklung |
| `npm run test:run` | ~2 Sekunden | Vor Commit |
| `npm run test:coverage` | ~3 Sekunden | Code-Qualität prüfen |
| `npm run test:e2e` | ~1 Minute | Vor Release |
| `npm run test:e2e:ui` | Interaktiv | Bei Problemen |

### Warum das alles wichtig ist

1. **Sicherheit** - Änderungen brechen nichts Bestehendes
2. **Dokumentation** - Tests zeigen, wie Code funktionieren soll
3. **Mut** - Entwickler trauen sich, Code zu verbessern
4. **Zeit** - Automatische Tests sind schneller als manuelle
5. **Schlaf** - Man kann nachts ruhig schlafen 😴

---

## Glossar

| Begriff | Erklärung |
|---------|-----------|
| **Test** | Automatische Prüfung, ob Code funktioniert |
| **Unit Test** | Test einer einzelnen Funktion |
| **Integration Test** | Test mehrerer Funktionen zusammen |
| **E2E Test** | Test der gesamten Anwendung wie ein Benutzer |
| **Assertion** | Behauptung ("X sollte Y sein") |
| **Mock** | Simulation einer externen Komponente |
| **Coverage** | Prozent des Codes, der getestet wird |
| **Flaky Test** | Unzuverlässiger Test (mal grün, mal rot) |
| **CI/CD** | Automatische Test-Ausführung bei Code-Änderungen |

---

*Dieser Artikel wurde für das BackstagePass-Projekt erstellt. Bei Fragen wende dich an das Entwicklungsteam.*
