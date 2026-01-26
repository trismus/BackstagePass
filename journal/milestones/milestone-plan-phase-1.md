# 🎯 Milestone Plan: BackstagePass Phase 1

**Erstellt:** 2026-01-26
**Springer-Planung:** Release-Roadmap für 3 Module + Basis

---

## 📊 Release-Reihenfolge

```
Module 0 (Basis) → Module 1 (Vereinsleben) → Module 2 (Logistik) → Module 3 (Künstlerische Leitung)
```

---

## 🔧 **Module 0: Mitglieder & Authentifizierung (FOUNDATION)**

**Status:** 🚀 In Progress
**Ziel:** Basis für alle anderen Module

### Issues zugeordnet:
- [x] #[TBD] – **0.0 UI/UX Design-Vorgaben & Component Style Guide** 🎨 (BLOCKING)
- [x] #88 – 0.1 Benutzer-Authentifizierung & Login-System
- [x] #89 – 0.2 Mitgliederprofil & Benutzerverwaltung
- [x] #90 – 0.3 Rollenmanagement & Permissions
- [x] #91 – 0.4 Audit Log & Activity Tracking

### Dokumentation:
- 📋 Tech Plan: `journal/decisions/PLAN-module-0-foundation.md`
- 📝 Implementation Brief: `journal/implementation-briefs/BRIEF-module-0-kulissenbauer.md`

### Abhängigkeiten für:
- ✅ Modul 1 (benötigt Mitglied-Objekt)
- ✅ Modul 2 (benötigt Mitglied-Zuordnung zu Helferrollen)
- ✅ Modul 3 (benötigt Besetzung/Künstlerische Funktionen)

**Priority:** 🔴 HIGH
**Timeline:** V0.1 (Basis)
**Start:** 2026-01-26
**Geschätzte Dauer:** 3-4 Tage

---

## 🎉 **Module 1: Vereinsleben & Helfereinsätze**

**Epic:** Vereinsleben & Helfereinsätze zentral abbilden
**Ziel:** Vereinsinterne Anlässe + externe Helfereinsätze

### Issues zugeordnet:
- [ ] #1.1 Vereinsevents verwalten (Erstellen/Planen/Anmelden)
- [ ] #1.2 Externe Helfereinsätze abbilden
- [ ] #1.3 Persönliche Einsatz- und Kalenderübersicht

**Priority:** 🟡 MEDIUM-HIGH
**Timeline:** V0.2 (nach Module 0)
**Abhängigkeiten:** Module 0 ✅

---

## 🎬 **Module 2: Operative Aufführungslogistik**

**Epic:** Operative Aufführungslogistik effizient planen
**Ziel:** Aufführungsplanung + Ressourcen- & Schichtmanagement

### Issues zugeordnet:
- [ ] #2.1 Aufführungen mit Zeitblöcken planen
- [ ] #2.2 Ressourcen & Räume verwalten
- [ ] #2.3 Einsatz-Templates für wiederkehrende Abläufe

**Priority:** 🟡 MEDIUM-HIGH
**Timeline:** V0.3 (nach Module 1)
**Abhängigkeiten:** Module 0 ✅, Module 1 ✅

---

## 🎭 **Module 3: Künstlerische Leitung**

**Epic:** Künstlerische Planung vom Stück bis zur Probe strukturieren
**Ziel:** Stück/Szenen/Rollen + Besetzung + Probenplanung

### Issues zugeordnet:
- [ ] #3.1 Stück, Szenen und Rollen strukturieren
- [ ] #3.2 Besetzung verwalten
- [ ] #3.3 Probenplanung mit künstlerischen Funktionen

**Priority:** 🟡 MEDIUM-HIGH
**Timeline:** V0.4 (nach Module 2)
**Abhängigkeiten:** Module 0 ✅, Module 1 ✅, Module 2 ✅

---

## 📈 Gesamtstatus

| Modul | Epic | Issues | Priority | Status | Start |
|-------|------|--------|----------|--------|-------|
| 0 | Foundation (Auth & Mitglieder) | **5** (1 Design + 4 Dev) | 🔴 HIGH | 🚀 In Progress | 2026-01-26 |
| 1 | Vereinsleben & Helfereinsätze | 3 | 🟡 MEDIUM-HIGH | ⏳ Backlog | - |
| 2 | Operative Aufführungslogistik | 3 | 🟡 MEDIUM-HIGH | ⏳ Backlog | - |
| 3 | Künstlerische Leitung | 3 | 🟡 MEDIUM-HIGH | ⏳ Backlog | - |

**Total Issues:** 14 (1 Design + 4 Modul 0 + 3x3 für Module 1-3)
**In Progress:** 
- Design (Maler - Issue 0.0)
- Modul 0 Development (Kulissenbauer - Issues #88-91)

---

## 🚀 Nächste Schritte

1. **Regisseur:** Modul 0 Issues aus Journal-Ideen definieren
2. **Springer:** Issues in GitHub erstellen (mit Labels, Epics)
3. **Bühnenmeister:** Tech Plans für Modul 0 starten
4. **Kulissenbauer:** Code-Implementierung nach Tech Plans
5. **Kritiker:** PR-Reviews durchführen
6. **Chronist:** Dokumentation updaten

---

*Gültig ab: 2026-01-26*
*Geplant durch: Springer* 🤸
