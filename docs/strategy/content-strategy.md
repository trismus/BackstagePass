# Content-Strategie - BackstagePass

**Status:** Draft
**Datum:** 2026-01-24
**Erstellt von:** Regisseur

---

## 1. Vision & Ziele

### 1.1 Content-Vision

> **"Wir sind die Stimme der Theater-Community - authentisch, hilfreich, inspirierend."**

### 1.2 Ziele

| Ziel | KPI | Zeitrahmen |
|------|-----|------------|
| **Awareness** | 1.000 Blog-Besucher/Monat | 6 Monate |
| **Engagement** | 10% Newsletter Open Rate | 3 Monate |
| **Trust** | 5 Case Studies veröffentlicht | 6 Monate |
| **SEO** | Top 10 für "Theaterverein Software" | 12 Monate |

---

## 2. Content-Arten

```
┌─────────────────────────────────────────────────────────────────┐
│                     CONTENT PYRAMID                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│                        ┌──────────┐                             │
│                        │  HERO    │  ← 1x/Quartal              │
│                        │ CONTENT  │  (Case Studies,             │
│                        └────┬─────┘   Feature Releases)         │
│                             │                                   │
│                    ┌────────┴────────┐                          │
│                    │   HUB CONTENT   │  ← 2x/Monat              │
│                    │  (Blog, Guides) │  (How-tos, Tutorials)    │
│                    └────────┬────────┘                          │
│                             │                                   │
│           ┌─────────────────┴─────────────────┐                 │
│           │      HYGIENE CONTENT              │  ← Kontinuierlich│
│           │  (Social, Updates, Changelog)     │  (Weekly)       │
│           └───────────────────────────────────┘                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 2.1 Hero Content (Leuchtturm-Inhalte)

- **Case Studies:** Erfolgsgeschichten von Theatervereinen
- **Feature Releases:** Große neue Funktionen
- **Jahresrückblicke:** Community-Highlights

### 2.2 Hub Content (Regelmäßige Inhalte)

- **Blog-Artikel:** How-tos, Best Practices
- **Guides:** Schritt-für-Schritt-Anleitungen
- **Tutorials:** Video/Text zur Nutzung der App

### 2.3 Hygiene Content (Basis-Inhalte)

- **Social Media Posts:** Updates, Tips
- **Changelog:** Feature-Updates
- **Newsletter:** Monatliche Updates

---

## 3. Content-Workflow

```
┌─────────────────────────────────────────────────────────────────┐
│                    CONTENT CREATION PIPELINE                    │
└─────────────────────────────────────────────────────────────────┘

1. IDEE (journal/inbox/)
   │
   │  Quellen:
   │  - Team-Mitglieder
   │  - Community-Feedback
   │  - Feature-Releases
   │  - SEO-Recherche
   │
   ▼
2. REGISSEUR
   │
   │  → Entscheidet: "type": "content"
   │  → Erstellt Content-Brief:
   │     - Zielgruppe
   │     - Format (Blog/Social/Guide)
   │     - Keywords
   │     - CTA (Call to Action)
   │
   ▼
3. REDAKTEUR (NEU!)
   │
   │  → Schreibt Entwurf
   │  → Erstellt Bilder/Grafiken (Midjourney/Canva)
   │  → SEO-Optimierung
   │  → Formatierung (MDX)
   │
   ▼
4. REVIEW (Regisseur oder Team-Member)
   │
   │  → Fakten-Check
   │  → Tone-of-Voice Check
   │  → Freigabe
   │
   ▼
5. PUBLISH
   │
   │  → Blog: apps/web/content/blog/
   │  → Commit: docs(blog): add [title]
   │  → Auto-Deploy via Vercel
   │
   ▼
6. DISTRIBUTE
   │
   │  → Social Media Snippets
   │  → Newsletter-Teaser
   │  → Community-Shares
   │
   ▼
7. MEASURE
   │
   └── Analytics:
       - Page Views
       - Time on Page
       - Conversion Rate
```

---

## 4. Content-Speicherorte

### 4.1 Repository-Struktur

```
Argus/
├── apps/web/
│   └── content/
│       ├── blog/
│       │   ├── 2026-01-24-supabase-vercel-integration.mdx
│       │   └── 2026-02-01-member-management-guide.mdx
│       ├── changelog/
│       │   └── v1.0.0.mdx
│       └── docs/
│           ├── getting-started.mdx
│           └── features/
│               └── member-management.mdx
│
├── journal/
│   └── content/
│       ├── supabase-vercel-integration.md  ← Raw/Draft
│       └── member-management.md
│
└── docs/
    └── strategy/
        └── content-strategy.md  ← Dieses Dokument
```

### 4.2 Content-Formate

| Format | Speicherort | Verwendung |
|--------|-------------|------------|
| **Blog MDX** | `apps/web/content/blog/` | Veröffentlichte Artikel |
| **Draft MD** | `journal/content/` | Rohentwürfe |
| **Changelog** | `apps/web/content/changelog/` | Release Notes |
| **Docs** | `apps/web/content/docs/` | Produkt-Dokumentation |

---

## 5. SEO-Strategie

### 5.1 Keyword-Cluster

```
                    ┌───────────────────────────┐
                    │   HAUPT-KEYWORD           │
                    │   "Theaterverein Software"│
                    └───────────┬───────────────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        │                       │                       │
        ▼                       ▼                       ▼
┌───────────────┐      ┌───────────────┐      ┌───────────────┐
│ Mitglieder-   │      │ Proben-       │      │ Aufführungs-  │
│ verwaltung    │      │ planung       │      │ planung       │
│               │      │               │      │               │
│ - Theaterverein│     │ - Probenplan  │      │ - Termin-     │
│   Mitglieder  │      │   erstellen   │      │   planung     │
│ - Ensemble-   │      │ - Anwesenheit │      │ - Besetzungs- │
│   verwaltung  │      │   tracken     │      │   liste       │
└───────────────┘      └───────────────┘      └───────────────┘
```

### 5.2 Content-Kalender (Template)

| Woche | Content-Typ | Titel | Keyword | Status |
|-------|-------------|-------|---------|--------|
| KW 05 | Blog | "5 Tipps für effektive Probenplanung" | Probenplanung | Draft |
| KW 06 | Guide | "Mitgliederverwaltung einrichten" | Mitgliederverwaltung | Geplant |
| KW 07 | Case Study | "Wie das Stadttheater XY Zeit spart" | Theaterverein Software | Idee |
| KW 08 | Changelog | "Version 1.1 - Neue Kalender-Ansicht" | - | Geplant |

---

## 6. Tone of Voice

### 6.1 Unsere Persönlichkeit

| Eigenschaft | Bedeutet | Bedeutet NICHT |
|-------------|----------|----------------|
| **Freundlich** | Warmherzig, einladend | Übertrieben enthusiastisch |
| **Professionell** | Kompetent, zuverlässig | Steif, bürokratisch |
| **Hilfreich** | Lösungsorientiert | Belehrend |
| **Authentisch** | Echt, ehrlich | Informell/Slang |

### 6.2 Schreibregeln

1. **Du-Form** (nicht Sie)
2. **Aktiv statt Passiv** ("Du erstellst" statt "Es wird erstellt")
3. **Kurze Sätze** (max. 20 Wörter)
4. **Klare Struktur** (Überschriften, Listen, Absätze)
5. **Keine Superlative** ("beste", "einzige", "revolutionär")

### 6.3 Beispiele

| ❌ Nicht so | ✅ So besser |
|-------------|-------------|
| "Unsere revolutionäre Software" | "Mit BackstagePass organisierst du..." |
| "Es ist wichtig zu beachten, dass..." | "Beachte:" |
| "Die Funktionalität wurde implementiert" | "Du kannst jetzt..." |

---

## 7. Distribution

### 7.1 Kanäle

| Kanal | Frequenz | Content-Typ | Verantwortlich |
|-------|----------|-------------|----------------|
| **Blog** | 2x/Monat | Artikel, Guides | REDAKTEUR |
| **Newsletter** | 1x/Monat | Zusammenfassung | REDAKTEUR |
| **Twitter/X** | 3x/Woche | Tips, Updates | REDAKTEUR |
| **LinkedIn** | 1x/Woche | Artikel-Shares | REDAKTEUR |
| **GitHub Discussions** | Ad-hoc | Community Q&A | Team |

### 7.2 Cross-Posting-Matrix

```
Blog-Artikel
    │
    ├── Newsletter (Teaser + Link)
    ├── Twitter (3 Tweets mit Key-Points)
    ├── LinkedIn (1 Post mit Summary)
    └── GitHub Discussions (Link + Diskussion)
```

---

## 8. Metriken & Reporting

### 8.1 KPIs

| Metrik | Tool | Ziel |
|--------|------|------|
| **Page Views** | Vercel Analytics | +10% MoM |
| **Time on Page** | Vercel Analytics | > 2 Min |
| **Bounce Rate** | Vercel Analytics | < 60% |
| **Newsletter Subscribers** | TBD | 500 in 6 Monaten |
| **Social Engagement** | Native Analytics | 5% Engagement Rate |

### 8.2 Reporting-Rhythmus

- **Wöchentlich:** Quick-Check (Pageviews, Top-Content)
- **Monatlich:** Content-Performance Review
- **Quartalsweise:** Strategie-Anpassung

---

## 9. Tools & Ressourcen

### 9.1 Content-Erstellung

| Tool | Verwendung |
|------|------------|
| **VS Code / Cursor** | MDX-Erstellung |
| **Canva** | Grafiken, Social Media |
| **Midjourney/DALL-E** | Illustrationen |
| **Grammarly** | Rechtschreibung (optional) |

### 9.2 Distribution

| Tool | Verwendung |
|------|------------|
| **Vercel** | Automatisches Blog-Deployment |
| **Buffer/Later** | Social Media Scheduling |
| **Buttondown/Resend** | Newsletter (TBD) |

---

## 10. Nächste Schritte

1. **REDAKTEUR Bot erstellen**
   - [ ] System Prompt definieren
   - [ ] In docs/team.md hinzufügen
   - [ ] n8n Workflow erstellen

2. **Blog-Infrastruktur**
   - [ ] MDX Setup in Next.js
   - [ ] Blog-Index-Seite erstellen
   - [ ] RSS Feed implementieren

3. **Erster Content**
   - [ ] Supabase-Vercel Integration Artikel finalisieren
   - [ ] "Was ist BackstagePass?" Artikel
   - [ ] Getting Started Guide

4. **Distribution Setup**
   - [ ] Newsletter-Tool auswählen
   - [ ] Social Media Accounts erstellen
   - [ ] Scheduling einrichten

---

*Dieses Dokument ist Teil der BackstagePass Dokumentation und sollte quartalsweise überprüft werden.*
