# 🤸 Springer: Kanban-Board Analyse & Optimierungen

**Datum:** 2026-01-26
**Überprüfung:** GitHub Project #2 (Kanban Board)
**URL:** https://github.com/users/trismus/projects/2

---

## 🔍 Erkannte Probleme

### 1️⃣ **Milestone 0 nicht in "In Progress" Spalte sichtbar**

**Grund:**
- GitHub Projects können Issues automatisch nach Status sortieren
- Die Issues #88-91 sind zwar zu Milestone 0 zugewiesen, aber nicht manuell in "In Progress" verschoben
- GitHub Project Automation kann helfen, Issues basierend auf Status automatisch zu verschieben

**Lösung:**
- Lass mich die Issues manuell in "In Progress" verschieben
- ODER: Automation Setup (GitHub Actions oder Project Automation)

### 2️⃣ **Keine Sortierung nach Milestones im Board**

**Grund:**
- GitHub Projects unterstützen keine native "Grouping by Milestone" Funktion
- Issues werden nur nach Custom Field oder dem Project Status sortiert

**Mögliche Lösungen:**
1. **Manuell organisieren** (Issues gruppieren nach Milestone)
2. **Labels nutzen** (statt Milestones) – zusätzliche Metadaten
3. **Separate Project Boards** pro Milestone (Modul 0, Modul 1, etc.)
4. **GitHub Projects mit Custom Fields** (Modul-Feld hinzufügen)
5. **Script/Action** für automatische Sortierung

---

## ✅ Empfohlene Lösung: Hybrid Approach

### A) Sofort: Issues in "In Progress" verschieben
```bash
# Die Modul 0 Issues sollten in "In Progress" sein
# #88, #89, #90, #91 → In Progress Spalte
```

### B) Mittelfristig: Custom Field "Modul" hinzufügen
```
Project Board → Settings → Custom Fields
┌─────────────────────────────────────────┐
│ Feldname: Modul                          │
│ Typ: Single Select                       │
│ Optionen:                                │
│  - Modul 0 (Foundation)                 │
│  - Modul 1 (Vereinsleben)               │
│  - Modul 2 (Logistik)                   │
│  - Modul 3 (Künstlerisch)               │
└─────────────────────────────────────────┘
```

Dann können Issues nach "Modul" gruppiert werden!

### C) Langfristig: Labels für Grouping
```
Labels hinzufügen:
 - module-0, module-1, module-2, module-3
 - (statt nur Milestones)
```

---

## 🎯 Aktionsplan für Springer

### Schritt 1: Issues in "In Progress" verschieben
- [ ] Issue #88 → In Progress
- [ ] Issue #89 → In Progress
- [ ] Issue #90 → In Progress
- [ ] Issue #91 → In Progress
- [ ] Issue #[Design] → In Progress
- [ ] Epic #83 (Modul 0) → In Progress

### Schritt 2: Custom Field "Modul" erstellen
- [ ] Project Settings öffnen
- [ ] Custom Field "Modul" (Single Select) hinzufügen
- [ ] Optionen: Modul 0, 1, 2, 3
- [ ] Alle Issues mit entsprechendem Modul taggen

### Schritt 3: Board View konfigurieren
- [ ] View erstellen: "By Modul" (Grouping)
- [ ] Oder: View "Modul 0 Sprint" erstellen (Filter: Modul = 0)
- [ ] Oder: Board nach Status sortieren (Backlog, Ready, In Progress, Review, Done)

### Schritt 4: Automation Setup (Optional)
```yaml
# .github/workflows/project-automation.yml
# Automatisch Issues zu "In Progress" verschieben wenn:
# - Label "in-progress" hinzugefügt wird
# - Milestone gesetzt wird
# - Issue assigned wird
```

---

## 📊 Empfohlene Board-Struktur

### Spalten:
```
[ Backlog ] → [ Ready ] → [ In Progress ] → [ In Review ] → [ Done ]

Status:
- Backlog: Nicht gestartet (Module 1-3)
- Ready: Bereit (aber nicht gestartet)
- In Progress: Aktiv (Modul 0 Issues)
- In Review: Code Review (Kritiker)
- Done: Merged & Deployed
```

### Sortierung:
1. Nach Milestone (Primary)
2. Nach Priority (Secondary)
3. Nach Assigned (Tertiary)

---

## 🚀 Nächste Schritte

1. **Heute (2026-01-26):**
   - [ ] Modul 0 Issues in "In Progress" verschieben
   - [ ] Epic #83 in "In Progress" verschieben
   - [ ] Design Issue #[TBD] in "In Progress" verschieben

2. **Diese Woche:**
   - [ ] Custom Field "Modul" erstellen
   - [ ] Alle Issues taggen
   - [ ] Board Views optimieren

3. **Nächste Woche:**
   - [ ] Automation Setup (Optional)
   - [ ] Board Review & Optimierung

---

## 💡 GitHub Projects Best Practices

### ✅ Was wir tun sollten:
- Milestones für zeitliche Planung (Due Dates)
- Custom Fields für Kategorisierung (Modul, Priority)
- Labels für zusätzliche Kontext (module-0, blocking, ui/ux)
- Clear Status Spalten (Backlog → Done)
- Regular Board Reviews (täglich für aktive Sprint)

### ❌ Was wir vermeiden sollten:
- Issues ohne Milestone
- Issues ohne Assignee (wer arbeitet dran?)
- Zu viele Status-Spalten (→ Verwirrung)
- Veraltete Views
- Keine Automation (zu viel manuelles Verschieben)

---

## 📋 Detaillierte Anleitung: Custom Field Setup

### Im GitHub Project:
1. Gehe zu **Project → Settings** (Zahnrad-Icon oben rechts)
2. Klick auf **Custom fields**
3. Klick **Add field**
4. **Field name:** "Modul"
5. **Field type:** "Single select"
6. **Add option:**
   - Modul 0 (Foundation)
   - Modul 1 (Vereinsleben)
   - Modul 2 (Logistik)
   - Modul 3 (Künstlerisch)
7. **Save field**

### Dann für jede Issue:
8. Öffne Issue im Project Board
9. Klick auf das neue "Modul" Feld
10. Wähle entsprechendes Modul

### Neue View erstellen:
11. Gehe zurück zu Project Board
12. Klick **+ Add view**
13. Wähle **Table** oder **Board**
14. Konfiguriere: **Group by: Modul**
15. Name: "Modul Overview"

---

## 🎭 Impact für Team

| Rolle | Nutzen |
|-------|--------|
| **Springer** | Klare Übersicht über alle Issues pro Modul |
| **Bühnenmeister** | Weiß, welche Tech Plans aktuell needed sind |
| **Kulissenbauer** | Weiß sofort, welche Issues zu implementieren sind |
| **Kritiker** | Sieht welche Issues in Review sind |
| **Chronist** | Weiß welche Issues zu dokumentieren sind |

---

**Status:** 🔴 URGENT
**Priorität:** HIGH (Board ist das zentrale Team-Tool)
**Geschätzte Zeit:** 30 Min Setup + 10 Min regelmäßig

*Springer sollte das Board regelmäßig überprüfen (täglich während Sprint)!*
