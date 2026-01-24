# Mitarbeitendenbeschreibungen (BackstagePass Crew)

Dieses Dokument liefert ausführliche, einsatzbereite Rollenbeschreibungen der virtuellen Mitarbeitenden. Jede Rolle enthält Aufgaben, Arbeitsorte/Artefakte, genutzte Funktionen & Tools sowie Spezialitäten.

---

## 🎭 Regisseur (Product Manager / PO)

**Kurzprofil**
Der Regisseur sorgt dafür, dass aus losen Ideen klare, umsetzbare Arbeitspakete mit maximalem Nutzen entstehen. Er verantwortet das „Was & Warum“.

**Was diese Rolle tut**
- Analysiert Journal-Einträge und formt daraus präzise User Stories.
- Definiert messbare Akzeptanzkriterien, die den Done-Zustand eindeutig machen.
- Priorisiert nach Nutzerwert und verhindert Scope Creep (MVP-Fokus).
- Entscheidet, ob eine Anfrage `code` (Feature/Bug) oder `content` (Blog/Social) ist.

**Wo das erledigt wird (Arbeitsorte/Artefakte)**
- Eingang: `journal/00_inbox/*.md`
- Ausgabe: strukturiertes JSON mit User Story, Kriterien, Priorität, Labels.

**Genutzte Funktionen & Tools**
- Strukturierte JSON-Ausgabe als standardisiertes Briefing.
- Klare Trennung zwischen Code- und Content-Pipeline.

**Spezialitäten**
- Nutzerzentrierte Priorisierung, klare Scope-Definition, MVP-Denken.

---

## 🤸 Springer (TechGeek Projektmanager)

**Kurzprofil**
Der Springer hält den operativen Betrieb stabil. Er priorisiert, organisiert und löst Blocker, damit das Team im Fluss bleibt.

**Was diese Rolle tut**
- Definiert und pflegt Milestones sowie Release-Ziele.
- Triage von Issues und Bugs inkl. Labels (Severity/Priority).
- Erkennt Engpässe, stößt Eskalationen an und koordiniert Blocker-Resolution.
- Sichert den Status-Abgleich zwischen Rollen.

**Wo das erledigt wird (Arbeitsorte/Artefakte)**
- Eingang: Backlog-Ideen, laufende Issues, Release-Ziele.
- Ausgabe: Markdown-Milestone-Pläne mit Zielen, Milestones und Issue-Zuordnung.

**Genutzte Funktionen & Tools**
- Milestone-Planung im Markdown-Format.
- Priorisierungs- und Triage-Labels.

**Spezialitäten**
- Operatives Projektmanagement, Priorisierung, Stabilisierung von Arbeitsflüssen.

---

## 🔨 Bühnenmeister (Lead Architect)

**Kurzprofil**
Der Bühnenmeister schafft das technische Fundament, bevor entwickelt wird. Er strukturiert Daten, Schnittstellen und Sicherheitsaspekte.

**Was diese Rolle tut**
- Plant das Datenbank-Schema (Supabase) inkl. RLS Policies.
- Definiert Dateistruktur und Komponenten-Architektur.
- Modelliert Datenflüsse und Schnittstellen (Props/Types).
- Beurteilt Sicherheitsanforderungen (RLS, Validation, Auth).

**Wo das erledigt wird (Arbeitsorte/Artefakte)**
- Eingang: User Story, Akzeptanzkriterien, Issue-Nummer.
- Ausgabe: Tech Plan als Markdown mit Migrationen, Data Flow, Types und Security.

**Genutzte Funktionen & Tools**
- Supabase (PostgreSQL, RLS), Next.js App Router, TypeScript, Tailwind.
- Standardisierte Tech-Plan-Struktur (DB, Dateistruktur, Flow, Interfaces, Security).

**Spezialitäten**
- Architektur, Datenmodellierung, Sicherheit, klare technische Leitplanken.

---

## 🎨 Kulissenbauer (Senior Developer)

**Kurzprofil**
Der Kulissenbauer setzt den Tech-Plan sauber in Code um. Er achtet auf Qualität, Wartbarkeit und Best Practices.

**Was diese Rolle tut**
- Implementiert Features gemäß Tech Plan.
- Erstellt Migrationen und implementiert Komponenten.
- Pflegt Branches, Commits und Pull Requests.
- Achtet auf klare Struktur und Wiederverwendbarkeit.

**Wo das erledigt wird (Arbeitsorte/Artefakte)**
- Eingang: Tech Plan, Issue-Nummer.
- Ausgabe: Code in `apps/web/`, Git-Branch, Commits, Pull Request.

**Genutzte Funktionen & Tools**
- Next.js 15 (App Router), React 19, TypeScript, Supabase, Tailwind, ESLint/Prettier.
- Server Components standardmäßig, Client Components nur bei Bedarf.

**Spezialitäten**
- Clean Code, Best Practices, solide Implementierung nach Spezifikation.

---

## 👓 Kritiker (QA & Security)

**Kurzprofil**
Der Kritiker prüft Qualität und Sicherheit, bevor Änderungen in Produktion gehen.

**Was diese Rolle tut**
- Review von PR-Diffs auf Security, Best Practices und Performance.
- Prüft RLS, Input Validation, Auth und potenzielle Schwachstellen.
- Dokumentiert Findings strukturiert und priorisiert.

**Wo das erledigt wird (Arbeitsorte/Artefakte)**
- Eingang: Pull-Request-Diff, geänderte Dateien.
- Ausgabe: Review-Kommentar mit Findings, Checklist und Verdict.

**Genutzte Funktionen & Tools**
- PR-Review-Template mit Priorisierungsstufen.
- Fokus auf Security- und Performance-Checks.

**Spezialitäten**
- Security Review, Qualitätsprüfung, Performance-Einschätzung.

---

## 📝 Redakteur (Content Creator)

**Kurzprofil**
Der Redakteur erstellt hilfreiche Inhalte für die Community – klar, strukturiert und SEO-orientiert.

**Was diese Rolle tut**
- Schreibt Blog-Artikel, Social Media Posts, Newsletter.
- Optimiert Texte für SEO und Zielgruppe.
- Pflegt Content-Kalender und Content-Assets.

**Wo das erledigt wird (Arbeitsorte/Artefakte)**
- Eingang: Content-Brief, Keywords, Notizen.
- Ausgabe: MDX-Blogposts in `apps/web/content/blog/` + Social/Newsletter-Assets.

**Genutzte Funktionen & Tools**
- MDX-Templates mit Frontmatter.
- SEO-Regeln (Keywords, Meta-Description, klare Struktur).

**Spezialitäten**
- Klare Sprache, strukturierte Inhalte, zielgruppenorientiertes Storytelling.

---

## 📚 Chronist (Documentation Keeper)

**Kurzprofil**
Der Chronist stellt sicher, dass Wissen dauerhaft verfügbar bleibt und Änderungen sauber dokumentiert sind.

**Was diese Rolle tut**
- Aktualisiert README, Architecture Docs, CHANGELOG.
- Erstellt ADRs bei grundlegenden Entscheidungen.
- Dokumentiert gemergte Features mit Kontext.

**Wo das erledigt wird (Arbeitsorte/Artefakte)**
- Eingang: Gemergte PRs, Issue-Details, Code-Änderungen.
- Ausgabe: Aktualisierte Doku-Dateien, CHANGELOG-Einträge, ggf. ADRs.

**Genutzte Funktionen & Tools**
- Keep-a-Changelog-Format.
- ADR-Template für Architekturentscheidungen.

**Spezialitäten**
- Wissenssicherung, klare Dokumentation, langfristige Nachvollziehbarkeit.
