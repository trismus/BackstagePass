# 🎯 Springer: Quick Action Guide – Kanban-Board Setup

**Ziel:** Board optimieren und Modul 0 Issues in "In Progress" verschieben
**Zeit:** ~15 Min
**URL:** https://github.com/users/trismus/projects/2

---

## ⚡ 3-Schritt Quick-Fix

### Schritt 1: Modul 0 Issues in "In Progress" verschieben (5 Min)

1. Gehe zu: https://github.com/users/trismus/projects/2
2. Suche die Spalte "**In Progress**"
3. Verschiebe folgende Issues dorthin:
   - #88 – 0.1 Benutzer-Authentifizierung
   - #89 – 0.2 Mitgliederprofil & Benutzerverwaltung
   - #90 – 0.3 Rollenmanagement & Permissions
   - #91 – 0.4 Audit Log & Activity Tracking
   - #[Design] – 0.0 UI/UX Design-Vorgaben
   - #83 – Epic: Foundation

**Wie?** Klick & Drag oder Klick auf Issue → "Move to In Progress"

---

### Schritt 2: Custom Field "Modul" erstellen (5 Min)

1. Klick auf **⚙️ Settings** (oben rechts im Project)
2. Klick **Custom fields**
3. Klick **Add field**
4. Konfiguriere:
   ```
   Field name: Modul
   Field type: Single select
   Options:
     - Modul 0 (Foundation)
     - Modul 1 (Vereinsleben)
     - Modul 2 (Logistik)
     - Modul 3 (Künstlerisch)
   ```
5. Klick **Save**

---

### Schritt 3: Issues mit "Modul" Field taggen (5 Min)

1. Gehe zurück zu Project Board
2. Für jedes Issue in "Modul 0":
   - Klick auf Issue
   - Scrolle zu **Custom fields**
   - Klick **Modul** → Wähle "Modul 0"
   - Repeat für alle Issues

**Issues für Modul 0:**
- #83, #88, #89, #90, #91, #[Design]

---

## 🔧 Optionale Verbesserung: Neue Board View

1. Klick **+ Add view**
2. Wähle **Board** (oder Table)
3. Konfiguriere:
   ```
   Name: "Modul Overview"
   Group by: Modul
   Sort by: Priority (High → Low)
   ```
4. Klick **Save**

Jetzt sieht dein Board so aus:
```
┌─────────────────────────────────────┐
│ Modul 0 | Modul 1 | Modul 2 | Modul 3 │
├─────────────────────────────────────┤
│  [#88]  |         |         |         │
│  [#89]  |         |         |         │
│  [#90]  |         |         |         │
│  [#91]  |         |         |         │
└─────────────────────────────────────┘
```

---

## 📊 Alternative: Mehrere Board Views

Falls du nicht groupen willst, erstelle mehrere Filter-Views:

```
View 1: "Modul 0 Sprint"
  Filter: Milestone = "Modul 0"
  Columns: Backlog | Ready | In Progress | Review | Done

View 2: "Modul 1 Backlog"
  Filter: Milestone = "Modul 1"
  
View 3: "All Issues"
  No filter
  Sort by: Milestone, Priority
```

---

## ✅ Checklist

- [ ] Modul 0 Issues in "In Progress" verschoben
- [ ] Custom Field "Modul" erstellt
- [ ] Alle Issues getagged mit entsprechendem Modul
- [ ] Neue View "Modul Overview" erstellt (optional)
- [ ] Team über neue Board-Struktur informiert

---

## 📝 Result

**Vorher:**
```
Backlog (Chaos – alles durcheinander)
├─ #83 (Epic)
├─ #88 (Modul 0)
├─ #92 (Modul 1)
├─ #96 (Modul 2)
└─ #100 (Modul 3)
```

**Nachher:**
```
In Progress (klar organisiert)
├─ Modul 0
│  ├─ #83 Epic
│  ├─ #[Design] 0.0 Design
│  ├─ #88 0.1 Auth
│  ├─ #89 0.2 Profile
│  ├─ #90 0.3 Roles
│  └─ #91 0.4 Audit

Backlog
├─ Modul 1 (4 Issues)
├─ Modul 2 (4 Issues)
└─ Modul 3 (4 Issues)
```

---

**Zeit:** ~15 Min
**Impact:** 🔥 Huge – Team hat klare Übersicht!

Lass mich wissen wenn du das gemacht hast! 🚀
