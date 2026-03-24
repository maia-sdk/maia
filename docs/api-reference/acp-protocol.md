# ACP Protocol Reference

Agent Collaboration Protocol v1.0

## Event Envelope

Every ACP event follows this structure:

```json
{
  "acp_version": "1.0",
  "run_id": "string",
  "agent_id": "agent://name",
  "event_type": "message|handoff|review|artifact|event|capabilities",
  "timestamp": "2026-03-22T10:30:00Z",
  "sequence": 0,
  "parent_event_id": null,
  "payload": {}
}
```

## Primitives

### message

One agent sends structured content to another.

```json
{
  "from": "agent://researcher",
  "to": "agent://analyst",
  "intent": "challenge",
  "content": "The 34% growth figure needs verification.",
  "thinking": "This seems high compared to last quarter...",
  "mood": "concerned",
  "artifacts": [],
  "context": {
    "thread_id": "thread_1",
    "in_reply_to": null
  }
}
```

**Intents:** `propose`, `challenge`, `clarify`, `review`, `handoff`, `summarize`, `agree`, `escalate`

**Moods:** `neutral`, `confident`, `uncertain`, `excited`, `concerned`, `focused`

### handoff

Transfer task ownership from one agent to another.

```json
{
  "from": "agent://brain",
  "to": "agent://writer",
  "task": {
    "description": "Write the client report using the verified data.",
    "constraints": ["Max 1500 words", "Include citations"],
    "definition_of_done": "Report ready for client review",
    "priority": "high"
  },
  "context": { "prior_findings": "..." },
  "artifacts": []
}
```

**Priority:** `low`, `normal`, `high`, `critical`

### review

One agent evaluates another's output.

```json
{
  "reviewer": "agent://brain",
  "author": "agent://writer",
  "verdict": "revise",
  "score": 0.75,
  "feedback": "Good structure but missing the ACV segment breakdown.",
  "revision_instructions": "Add Enterprise vs SMB split in section 2.",
  "strengths": ["Clear writing", "Good citations"],
  "issues": [
    { "severity": "major", "description": "Missing segment data" }
  ],
  "round": 1,
  "max_rounds": 3
}
```

**Verdicts:** `approve`, `revise`, `reject`, `escalate`

**Issue severity:** `minor`, `major`, `critical`

### artifact

A work product passed between agents.

```json
{
  "artifact_id": "artifact_abc123",
  "kind": "markdown",
  "title": "Q4 Market Report Draft",
  "content": "# SaaS Pricing Trends\n\n...",
  "mime_type": "text/markdown",
  "version": 2,
  "parent_artifact_id": "artifact_abc122"
}
```

**Kinds:** `text`, `markdown`, `json`, `csv`, `html`, `code`, `image`, `pdf`, `url`, `binary`

### event (activity)

Live stream of work happening.

```json
{
  "agent_id": "agent://researcher",
  "activity": "searching",
  "detail": "Searching Google for SaaS pricing data 2026",
  "tool": {
    "tool_id": "web_search",
    "tool_name": "Web Search",
    "status": "running"
  },
  "cost": {
    "tokens_used": 450,
    "cost_usd": 0.0007,
    "model": "gpt-4o"
  }
}
```

**Activities:** `thinking`, `searching`, `reading`, `writing`, `browsing`, `coding`, `analyzing`, `tool_calling`, `waiting`, `reviewing`, `idle`, `error`

### capabilities

Declares what an agent can do.

```json
{
  "agent_id": "agent://researcher",
  "name": "Researcher",
  "role": "research",
  "personality": {
    "style": "detailed",
    "traits": ["thorough", "curious"],
    "avatar_color": "#3B82F6",
    "avatar_emoji": "\uD83D\uDD0D"
  },
  "skills": [
    { "skill_id": "web_search", "description": "Search the web" },
    { "skill_id": "document_read", "description": "Read documents" }
  ],
  "connectors": ["brave_search", "google_drive"]
}
```

## Transport

ACP events are transmitted as Server-Sent Events (SSE):

```
data: {"acp_version":"1.0","run_id":"run_1","agent_id":"agent://brain",...}

data: {"acp_version":"1.0","run_id":"run_1","agent_id":"agent://researcher",...}

data: [DONE]
```

Any HTTP server can serve ACP events. Any SSE client can consume them.