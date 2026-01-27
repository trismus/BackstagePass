# GitHub Blueprint: Milestone "Mitglieder"

Dieses Dokument enthält alle Informationen zum Erstellen des Milestones und der Issues auf GitHub.

---

## Milestone erstellen

**URL:** `https://github.com/trismus/BackstagePass/milestones/new`

| Feld | Wert |
|------|------|
| **Title** | Mitglieder |
| **Due date** | _(optional)_ |
| **Description** | Vollständige Mitgliederverwaltung mit Profilen, Rollen, Kontaktdaten und Verfügbarkeiten. Basis für alle personenbezogenen Funktionen. |

---

## Issues erstellen

Für jedes Issue: `https://github.com/trismus/BackstagePass/issues/new`

---

### Issue #1: Mitgliederprofil erweitern

```
Title: [Mitglieder] Mitgliederprofil erweitern

Labels: enhancement, frontend, backend, priority:high
Milestone: Mitglieder
```

**Body:**
```markdown
## Beschreibung
Erweitere das bestehende Mitgliederprofil um zusätzliche Felder für eine vollständige Vereinsverwaltung.

## Anforderungen
- [ ] Notfallkontakt (Name, Telefon, Beziehung)
- [ ] Profilbild-Upload
- [ ] Biografiefeld (kurze Vorstellung)
- [ ] Mitglied-seit-Datum
- [ ] Austrittsdatum (für archivierte Mitglieder)
- [ ] Fähigkeiten/Skills (Tags)

## Technische Details
- Migration für neue Felder in `personen` Tabelle
- Bildupload via Supabase Storage
- Anpassung MitgliedForm.tsx

## Akzeptanzkriterien
- [ ] Alle neuen Felder können bearbeitet werden
- [ ] Profilbild wird angezeigt (Fallback auf Initialen)
- [ ] Notfallkontakt nur für Management sichtbar
- [ ] Skills als Tags auswählbar

## Abhängigkeiten
- Keine
```

---

### Issue #2: Rollen- und Zuständigkeitssystem

```
Title: [Mitglieder] Rollen- und Zuständigkeitssystem

Labels: enhancement, backend, database, priority:high
Milestone: Mitglieder
```

**Body:**
```markdown
## Beschreibung
Implementiere ein flexibles System für Vereinsrollen und Zuständigkeiten (nicht zu verwechseln mit App-Benutzerrollen).

## Anforderungen
- [ ] Vereinsrollen definierbar (Ensemble, Technik, Regie, Orga, Vorstand)
- [ ] Mehrere Rollen pro Mitglied möglich
- [ ] Zeitliche Gültigkeit (von-bis)
- [ ] Primäre Rolle kennzeichnen
- [ ] Rollen-Historie einsehbar

## Datenmodell
```typescript
interface Vereinsrolle {
  id: string
  name: string           // z.B. "Technik", "Ensemble"
  beschreibung: string
  farbe: string          // für UI-Badges
}

interface MitgliedRolle {
  mitglied_id: string
  rolle_id: string
  ist_primaer: boolean
  gueltig_von: date
  gueltig_bis: date | null
}
```

## Akzeptanzkriterien
- [ ] Mitglieder können mehrere Rollen haben
- [ ] Rollen werden als Badges angezeigt
- [ ] Filterung nach Rolle in Mitgliederliste
- [ ] Historie der Rollenzuweisungen

## Abhängigkeiten
- Keine
```

---

### Issue #3: Kontaktverwaltung verbessern

```
Title: [Mitglieder] Kontaktverwaltung verbessern

Labels: enhancement, frontend, priority:medium
Milestone: Mitglieder
```

**Body:**
```markdown
## Beschreibung
Verbessere die Kontaktdatenverwaltung mit mehreren Kontaktmöglichkeiten und Präferenzen.

## Anforderungen
- [ ] Mehrere Telefonnummern (Mobil, Privat, Geschäft)
- [ ] Bevorzugte Kontaktart markieren
- [ ] Social-Media-Links (optional)
- [ ] Kontakt-Notizen (z.B. "Nicht vor 10 Uhr anrufen")
- [ ] Schnellkontakt-Buttons (Anrufen, E-Mail, WhatsApp)

## Technische Details
- JSONB-Feld für flexible Kontaktdaten
- Click-to-Action Links für Telefon/E-Mail

## Akzeptanzkriterien
- [ ] Mehrere Kontaktarten pro Mitglied
- [ ] Bevorzugte Kontaktart hervorgehoben
- [ ] Ein-Klick-Kontakt funktioniert
- [ ] Datenschutz: Kontakte nur für berechtigte Rollen sichtbar

## Abhängigkeiten
- Issue #1 (Mitgliederprofil erweitern)
```

---

### Issue #4: Verfügbarkeiten-System

```
Title: [Mitglieder] Verfügbarkeiten-System implementieren

Labels: enhancement, frontend, backend, priority:high
Milestone: Mitglieder
```

**Body:**
```markdown
## Beschreibung
Implementiere ein System zur Erfassung und Verwaltung von Mitglieder-Verfügbarkeiten.

## Anforderungen
- [ ] Verfügbarkeit pro Zeitraum erfassen (Datum, Zeitfenster)
- [ ] Status: Verfügbar, Eingeschränkt, Nicht verfügbar
- [ ] Wiederkehrende Einträge (z.B. "Jeden Dienstag nicht verfügbar")
- [ ] Abwesenheiten planen (Urlaub, etc.)
- [ ] Kalenderansicht der eigenen Verfügbarkeit

## Datenmodell
```typescript
interface Verfuegbarkeit {
  id: string
  mitglied_id: string
  datum_von: date
  datum_bis: date
  zeitfenster_von: time | null
  zeitfenster_bis: time | null
  status: 'verfuegbar' | 'eingeschraenkt' | 'nicht_verfuegbar'
  wiederholung: 'keine' | 'woechentlich' | 'monatlich'
  notiz: string | null
}
```

## UI-Komponenten
- [ ] `components/mitglieder/VerfuegbarkeitForm.tsx`
- [ ] `components/mitglieder/VerfuegbarkeitKalender.tsx`
- [ ] `components/mitglieder/VerfuegbarkeitBadge.tsx`

## Akzeptanzkriterien
- [ ] Mitglieder können eigene Verfügbarkeit pflegen
- [ ] Management sieht Verfügbarkeiten aller Mitglieder
- [ ] Verfügbarkeit wird bei Terminplanung berücksichtigt
- [ ] Konflikte werden angezeigt

## Abhängigkeiten
- Keine
```

---

### Issue #5: Mitglieder-Archivierung

```
Title: [Mitglieder] Archivierungsfunktion implementieren

Labels: enhancement, backend, priority:medium
Milestone: Mitglieder
```

**Body:**
```markdown
## Beschreibung
Implementiere eine Archivierungsfunktion für ausgetretene oder inaktive Mitglieder.

## Anforderungen
- [ ] Soft-Delete statt hartem Löschen
- [ ] Archivierte Mitglieder aus Listen ausblenden (Toggle)
- [ ] Archiv-Ansicht für historische Daten
- [ ] Reaktivierung möglich
- [ ] Austrittsdatum und -grund erfassen

## Technische Details
- `archiviert_am` und `austritts_grund` Felder
- RLS-Anpassung für Archiv-Zugriff
- Filter in allen Mitglieder-Queries

## Akzeptanzkriterien
- [ ] Mitglieder können archiviert werden
- [ ] Archivierte erscheinen nicht in aktiven Listen
- [ ] Archiv ist für Management einsehbar
- [ ] Reaktivierung funktioniert ohne Datenverlust

## Abhängigkeiten
- Issue #1 (Mitgliederprofil erweitern)
```

---

### Issue #6: Mitglieder-Suche und Filter

```
Title: [Mitglieder] Erweiterte Suche und Filter

Labels: enhancement, frontend, priority:medium
Milestone: Mitglieder
```

**Body:**
```markdown
## Beschreibung
Erweitere die Mitgliederliste um eine leistungsfähige Suche und Filterfunktionen.

## Anforderungen
- [ ] Volltextsuche (Name, E-Mail, etc.)
- [ ] Filter nach Vereinsrolle
- [ ] Filter nach Status (Aktiv, Archiviert)
- [ ] Filter nach Verfügbarkeit (für Zeitraum X)
- [ ] Filter nach Skills/Fähigkeiten
- [ ] Sortierung (Name, Beitrittsdatum, Rolle)
- [ ] Filter-Kombination speichern

## Technische Details
- URL-Parameter für Filter (shareable Links)
- Debounced Search Input
- Pagination mit Cursor

## Akzeptanzkriterien
- [ ] Suche findet Mitglieder in < 200ms
- [ ] Filter sind kombinierbar
- [ ] URL spiegelt aktuelle Filter wider
- [ ] Leere Ergebnisse zeigen hilfreiche Meldung

## Abhängigkeiten
- Issue #2 (Rollen-System)
- Issue #4 (Verfügbarkeiten)
```

---

### Issue #7: Mitglieder-Export

```
Title: [Mitglieder] Export-Funktion

Labels: enhancement, frontend, priority:low
Milestone: Mitglieder
```

**Body:**
```markdown
## Beschreibung
Ermögliche den Export von Mitgliederdaten in verschiedenen Formaten.

## Anforderungen
- [ ] CSV-Export
- [ ] Excel-Export (.xlsx)
- [ ] Filterung vor Export anwenden
- [ ] Spaltenauswahl für Export
- [ ] E-Mail-Liste exportieren (für Newsletter)

## Technische Details
- Server Action für Export-Generierung
- Temporäre Datei oder Streaming-Download
- Berechtigungsprüfung (nur Management)

## Akzeptanzkriterien
- [ ] Export enthält gewählte Spalten
- [ ] Filter werden berücksichtigt
- [ ] Datei-Download funktioniert
- [ ] Keine sensiblen Daten ohne Berechtigung

## Abhängigkeiten
- Issue #6 (Suche und Filter)
```

---

## Checkliste für GitHub

### Milestone
- [ ] Milestone "Mitglieder" erstellen

### Issues (in dieser Reihenfolge erstellen)
1. [ ] Issue #1: Mitgliederprofil erweitern (keine Abhängigkeiten)
2. [ ] Issue #2: Rollen- und Zuständigkeitssystem (keine Abhängigkeiten)
3. [ ] Issue #4: Verfügbarkeiten-System (keine Abhängigkeiten)
4. [ ] Issue #3: Kontaktverwaltung (nach #1)
5. [ ] Issue #5: Archivierungsfunktion (nach #1)
6. [ ] Issue #6: Suche und Filter (nach #2, #4)
7. [ ] Issue #7: Export-Funktion (nach #6)

### Labels prüfen
- [ ] `priority:high`
- [ ] `priority:medium`
- [ ] `priority:low`
- [ ] `frontend`
- [ ] `backend`
- [ ] `database`
- [ ] `enhancement`

---

## Zusammenfassung

| Metrik | Wert |
|--------|------|
| **Milestone** | Mitglieder |
| **Anzahl Issues** | 7 |
| **Priorität High** | 3 |
| **Priorität Medium** | 3 |
| **Priorität Low** | 1 |
