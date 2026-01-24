# n8n Integration - AI Agenten für das Team

**Status:** Draft
**Datum:** 2026-01-24
**Erstellt von:** Regisseur

---

## 1. Vision

> **"Jeder Mitarbeiter (Mensch & AI) bekommt einen AI-Assistenten, der repetitive Aufgaben automatisiert und intelligente Vorschläge macht."**

```
┌─────────────────────────────────────────────────────────────────┐
│                    AI AGENT ECOSYSTEM                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   GitHub ◄────────────────────────────────────────► Supabase    │
│     │                                                   │       │
│     │         ┌─────────────────────────┐               │       │
│     └────────►│         n8n             │◄──────────────┘       │
│               │   (Workflow Engine)     │                       │
│               └───────────┬─────────────┘                       │
│                           │                                     │
│       ┌───────────────────┼───────────────────┐                 │
│       │                   │                   │                 │
│       ▼                   ▼                   ▼                 │
│  ┌─────────┐        ┌─────────┐        ┌─────────┐              │
│  │ OpenAI  │        │ Claude  │        │ Gemini  │              │
│  │   API   │        │   API   │        │   API   │              │
│  └─────────┘        └─────────┘        └─────────┘              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. n8n Setup

### 2.1 Deployment-Optionen

| Option | Kosten | Vorteile | Nachteile |
|--------|--------|----------|-----------|
| **n8n Cloud** | ~€20/Monat | Keine Wartung, Updates automatisch | Weniger Kontrolle |
| **Self-Hosted (Railway)** | ~€5/Monat | Volle Kontrolle, günstiger | Mehr Wartung |
| **Self-Hosted (VPS)** | ~€5-10/Monat | Maximale Kontrolle | Komplexes Setup |

**Empfehlung für Start:** n8n Cloud (Einfachheit)

### 2.2 Self-Hosted Setup (Railway)

```bash
# 1. Railway CLI installieren
npm i -g @railway/cli

# 2. Login
railway login

# 3. Neues Projekt erstellen
railway init

# 4. n8n deployen
railway add --template n8n

# 5. Environment Variables setzen
railway variables set N8N_BASIC_AUTH_USER=admin
railway variables set N8N_BASIC_AUTH_PASSWORD=<sicheres-passwort>
railway variables set N8N_ENCRYPTION_KEY=<zufälliger-string>
railway variables set WEBHOOK_URL=https://<dein-domain>.railway.app/
```

### 2.3 Benötigte Integrationen

| Integration | Verwendung | API Key nötig |
|-------------|------------|---------------|
| **GitHub** | Issues, PRs, Webhooks | OAuth oder PAT |
| **OpenAI** | GPT-4 für AI Agents | API Key |
| **Anthropic** | Claude für AI Agents | API Key |
| **Supabase** | Datenbank-Zugriff | Service Role Key |
| **Slack/Discord** | Benachrichtigungen | Webhook URL |

---

## 3. AI Agent Workflows

### 3.1 Übersicht der Workflows

```
┌─────────────────────────────────────────────────────────────────┐
│                    n8n WORKFLOW ÜBERSICHT                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  WORKFLOW 1: Journal → Issue Pipeline                           │
│  ────────────────────────────────────                           │
│  Trigger: Neuer Commit in journal/inbox/                        │
│  → REGISSEUR AI analysiert                                      │
│  → GitHub Issue erstellt                                        │
│  → Slack Notification                                           │
│                                                                 │
│  WORKFLOW 2: Issue → Tech Plan                                  │
│  ────────────────────────────────                               │
│  Trigger: Issue labeled "needs-plan"                            │
│  → BÜHNENMEISTER AI erstellt Plan                               │
│  → Plan als Comment gepostet                                    │
│  → Label aktualisiert                                           │
│                                                                 │
│  WORKFLOW 3: PR → Code Review                                   │
│  ───────────────────────────────                                │
│  Trigger: Neue Pull Request                                     │
│  → KRITIKER AI analysiert Diff                                  │
│  → Review Comment gepostet                                      │
│  → Approve/Request Changes                                      │
│                                                                 │
│  WORKFLOW 4: Content Pipeline                                   │
│  ────────────────────────────                                   │
│  Trigger: Issue labeled "content"                               │
│  → REDAKTEUR AI schreibt Draft                                  │
│  → Draft als PR erstellt                                        │
│  → Review angefordert                                           │
│                                                                 │
│  WORKFLOW 5: Merged PR → Docs Update                            │
│  ───────────────────────────────────                            │
│  Trigger: PR merged                                             │
│  → CHRONIST AI aktualisiert Docs                                │
│  → CHANGELOG.md erweitert                                       │
│  → Commit erstellt                                              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 Workflow 1: Journal → Issue Pipeline

```
┌────────────────┐     ┌─────────────────┐     ┌────────────────┐
│ GitHub Webhook │────►│ Parse Markdown  │────►│ AI Agent Node  │
│ (push event)   │     │ (Get file)      │     │ (REGISSEUR)    │
└────────────────┘     └─────────────────┘     └───────┬────────┘
                                                       │
                                                       ▼
┌────────────────┐     ┌─────────────────┐     ┌────────────────┐
│ Slack Notify   │◄────│ Add Labels      │◄────│ Create Issue   │
│                │     │                 │     │                │
└────────────────┘     └─────────────────┘     └────────────────┘
```

**n8n Nodes:**

1. **GitHub Trigger** (Webhook)
   - Event: `push`
   - Filter: `journal/inbox/*.md`

2. **HTTP Request** (Get Raw File)
   - URL: `https://raw.githubusercontent.com/...`

3. **AI Agent** (OpenAI/Claude)
   - System Prompt: REGISSEUR (aus team.md)
   - Output: JSON

4. **GitHub** (Create Issue)
   - Title: `{{ $json.title }}`
   - Body: `{{ $json.userStory }}`

5. **GitHub** (Add Labels)
   - Labels: `{{ $json.labels }}`

6. **Slack** (Notify)
   - Channel: `#backstagepass-updates`
   - Message: "Neues Issue erstellt: {{ $json.title }}"

### 3.3 Workflow 2: Issue → Tech Plan

```
┌────────────────┐     ┌─────────────────┐     ┌────────────────┐
│ GitHub Trigger │────►│ Get Issue       │────►│ AI Agent Node  │
│ (label added)  │     │ Details         │     │ (BÜHNENMEISTER)│
└────────────────┘     └─────────────────┘     └───────┬────────┘
                                                       │
                                                       ▼
┌────────────────┐     ┌─────────────────┐     ┌────────────────┐
│ Update Label   │◄────│ Create Comment  │◄────│ Format as      │
│ (has-plan)     │     │                 │     │ Markdown       │
└────────────────┘     └─────────────────┘     └────────────────┘
```

### 3.4 Workflow 3: PR → Code Review

```
┌────────────────┐     ┌─────────────────┐     ┌────────────────┐
│ GitHub Trigger │────►│ Get PR Diff     │────►│ AI Agent Node  │
│ (PR opened)    │     │                 │     │ (KRITIKER)     │
└────────────────┘     └─────────────────┘     └───────┬────────┘
                                                       │
                                                       ▼
┌────────────────┐     ┌─────────────────┐     ┌────────────────┐
│ Slack Notify   │◄────│ Submit Review   │◄────│ Parse Verdict  │
│                │     │ (Approve/       │     │                │
│                │     │  Request Change)│     │                │
└────────────────┘     └─────────────────┘     └────────────────┘
```

---

## 4. AI Agent Node Konfiguration

### 4.1 Basis-Konfiguration

```json
{
  "nodeType": "n8n-nodes-base.openAi",
  "parameters": {
    "resource": "chat",
    "model": "gpt-4-turbo-preview",
    "messages": {
      "values": [
        {
          "role": "system",
          "content": "{{ $parameter.systemPrompt }}"
        },
        {
          "role": "user",
          "content": "{{ $json.input }}"
        }
      ]
    },
    "options": {
      "temperature": 0.7,
      "maxTokens": 2000,
      "responseFormat": "json_object"
    }
  }
}
```

### 4.2 Claude API Alternative

```json
{
  "nodeType": "n8n-nodes-base.httpRequest",
  "parameters": {
    "method": "POST",
    "url": "https://api.anthropic.com/v1/messages",
    "headers": {
      "x-api-key": "{{ $credentials.anthropicApi.apiKey }}",
      "anthropic-version": "2023-06-01",
      "content-type": "application/json"
    },
    "body": {
      "model": "claude-3-sonnet-20240229",
      "max_tokens": 2000,
      "system": "{{ $parameter.systemPrompt }}",
      "messages": [
        {
          "role": "user",
          "content": "{{ $json.input }}"
        }
      ]
    }
  }
}
```

---

## 5. GitHub Integration

### 5.1 Required Permissions (GitHub App)

```
Repository permissions:
- Contents: Read & Write (für Commits)
- Issues: Read & Write (für Issue-Erstellung)
- Pull requests: Read & Write (für Reviews)
- Webhooks: Read & Write (für Trigger)

Organization permissions:
- Members: Read (optional, für Assignments)
```

### 5.2 Webhook Events

| Event | Trigger für Workflow |
|-------|---------------------|
| `push` | Journal → Issue Pipeline |
| `issues.labeled` | Issue → Tech Plan |
| `pull_request.opened` | PR → Code Review |
| `pull_request.closed` (merged) | Docs Update |

---

## 6. Erweiterung: Team-Assistenten

### 6.1 Konzept

Jeder menschliche Mitarbeiter kann einen persönlichen AI-Assistenten bekommen:

```
┌─────────────────────────────────────────────────────────────────┐
│                    TEAM ASSISTANT SYSTEM                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  TRIGGER: Slack Command /ask                                    │
│                                                                 │
│  User: "/ask Wie implementiere ich RLS für die Termine-Tabelle?"│
│                                                                 │
│  → n8n Workflow:                                                │
│    1. Kontext laden (User-Role, Projekt-Docs)                   │
│    2. RAG: Relevante Docs suchen                                │
│    3. AI: Antwort generieren                                    │
│    4. Slack: Antwort posten                                     │
│                                                                 │
│  Bot: "Für RLS bei der Termine-Tabelle empfehle ich..."         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 6.2 Workflow: Slack AI Assistant

```
┌────────────────┐     ┌─────────────────┐     ┌────────────────┐
│ Slack Trigger  │────►│ Load Context    │────►│ Vector Search  │
│ (/ask command) │     │ (User, Project) │     │ (Supabase)     │
└────────────────┘     └─────────────────┘     └───────┬────────┘
                                                       │
                                                       ▼
┌────────────────┐     ┌─────────────────┐     ┌────────────────┐
│ Slack Reply    │◄────│ Format Response │◄────│ AI Agent       │
│ (in thread)    │     │                 │     │ (with RAG)     │
└────────────────┘     └─────────────────┘     └────────────────┘
```

### 6.3 RAG Setup mit Supabase

```sql
-- Vector Extension aktivieren
CREATE EXTENSION IF NOT EXISTS vector;

-- Dokumenten-Embeddings Tabelle
CREATE TABLE doc_embeddings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content TEXT NOT NULL,
  source TEXT NOT NULL,  -- z.B. 'docs/architecture.md'
  embedding VECTOR(1536),  -- OpenAI ada-002
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Similarity Search Function
CREATE FUNCTION search_docs(
  query_embedding VECTOR(1536),
  match_count INT DEFAULT 5
)
RETURNS TABLE (
  id UUID,
  content TEXT,
  source TEXT,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    doc_embeddings.id,
    doc_embeddings.content,
    doc_embeddings.source,
    1 - (doc_embeddings.embedding <=> query_embedding) AS similarity
  FROM doc_embeddings
  ORDER BY doc_embeddings.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
```

---

## 7. Security Considerations

### 7.1 API Key Management

```
┌─────────────────────────────────────────────────────────────────┐
│                    SECRETS MANAGEMENT                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  NIEMALS in Code oder Workflows speichern:                      │
│  - OpenAI API Key                                               │
│  - Anthropic API Key                                            │
│  - GitHub PAT                                                   │
│  - Supabase Service Role Key                                    │
│                                                                 │
│  STATTDESSEN:                                                   │
│  - n8n Credentials (verschlüsselt)                              │
│  - Environment Variables                                        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 7.2 Rate Limiting

| API | Limit | Strategie |
|-----|-------|-----------|
| OpenAI | 10k TPM (gpt-4) | Queue + Retry |
| Anthropic | 100k TPM | Queue + Retry |
| GitHub | 5k/h | Caching |

### 7.3 Cost Monitoring

```
Empfohlene Budgets (monatlich):
- OpenAI: €50-100 (mit GPT-4 Turbo)
- Anthropic: €30-50
- n8n Cloud: €20

Total: ~€100-170/Monat
```

---

## 8. Implementierungsplan

### Phase 1: Basis-Setup (Woche 1-2)

- [ ] n8n Cloud Account erstellen
- [ ] GitHub App erstellen + installieren
- [ ] OpenAI/Anthropic Credentials einrichten
- [ ] Webhook-Verbindung testen

### Phase 2: Core Workflows (Woche 3-4)

- [ ] Workflow 1: Journal → Issue
- [ ] Workflow 3: PR → Code Review
- [ ] Slack Integration für Notifications

### Phase 3: Erweiterte Workflows (Woche 5-6)

- [ ] Workflow 2: Issue → Tech Plan
- [ ] Workflow 4: Content Pipeline
- [ ] Workflow 5: Docs Update

### Phase 4: Team Assistants (Woche 7-8)

- [ ] RAG Setup mit Supabase
- [ ] Slack /ask Command
- [ ] Docs Embedding Pipeline

---

## 9. Monitoring & Debugging

### 9.1 n8n Execution Logs

- Alle Workflow-Ausführungen werden geloggt
- Fehler werden mit Stack Trace gespeichert
- Retry-Mechanismus für fehlgeschlagene Runs

### 9.2 Alerts einrichten

```
Workflow Failed Alert:
- Channel: #backstagepass-alerts
- Trigger: Execution Error
- Info: Workflow Name, Error Message, Execution ID
```

---

## 10. Nächste Schritte

1. **n8n Account erstellen**
   - [ ] n8n Cloud registrieren
   - [ ] Domain konfigurieren

2. **GitHub App erstellen**
   - [ ] App in GitHub erstellen
   - [ ] Permissions konfigurieren
   - [ ] In Repo installieren

3. **Ersten Workflow bauen**
   - [ ] PR → Code Review (einfachster Start)
   - [ ] Testen mit echtem PR

4. **Dokumentation**
   - [ ] Workflow-Diagramme erstellen
   - [ ] Runbooks für Fehlerbehandlung

---

*Dieses Dokument ist Teil der BackstagePass Dokumentation und sollte bei Änderungen der n8n-Konfiguration aktualisiert werden.*
