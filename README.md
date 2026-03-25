# Maia

[![CI](https://github.com/maia-sdk/maia/actions/workflows/ci.yml/badge.svg)](https://github.com/maia-sdk/maia/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/@maia/sdk?label=npm)](https://www.npmjs.com/package/@maia/sdk)
[![PyPI](https://img.shields.io/pypi/v/maia-sdk?label=pypi)](https://pypi.org/project/maia-sdk/)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

> The collaboration and observability layer for AI agents.

Build AI agent teams that talk to each other, watch them work live, and ship with confidence.

## Install

```bash
npm install @maia/sdk    # JavaScript/TypeScript
pip install maia-sdk     # Python
```

## 30-Second Demo

```ts
import { Brain } from '@maia/brain';

const brain = new Brain({
  agents: [],  // empty = Brain picks from 27 built-in roles during planning
  llm: { apiKey: process.env.OPENAI_API_KEY },
});

const result = await brain.run("Analyze SaaS pricing trends and write a client report");

console.log(result.output);       // Final report
console.log(result.totalCostUsd); // $0.0234
console.log(result.steps);        // 3 steps: researcher → analyst → writer
```

When `agents` is empty, the planner selects roles from the built-in catalog at plan time. The selected agents discuss and challenge each other's work, Brain reviews every output, and you get a polished result. Pass explicit `AgentDefinition[]` to override.

## Watch Agents Work

```tsx
import { Theatre, TeamChat } from '@maia/sdk/theatre';

// Theatre: see the actual work (browser pages, documents, dashboards)
<Theatre streamUrl="/acp/events" />

// TeamChat: see agent conversations (challenges, agreements, handoffs)
<TeamChat streamUrl="/acp/events" showThinking />
```

Or in the terminal:

```bash
pip install maia-cli
maia stream http://localhost:8765/acp/events
```

## What's Inside

### Core

| Package | What it does | Install |
|---------|-------------|---------|
| `@maia/brain` | Agent orchestration — plan, execute, converse, review | `npm i @maia/brain` |
| `@maia/acp` | Agent-to-agent protocol — types, client, SSE parser | `npm i @maia/acp` |
| `@maia/theatre` | Live action visualization — 14 visual surfaces | `npm i @maia/theatre` |
| `@maia/teamchat` | Agent conversation UI — chat bubbles, reviews | `npm i @maia/teamchat` |
| `@maia/computer-use` | Browser automation with Playwright | `npm i @maia/computer-use` |
| `@maia/connectors` | 40+ SaaS connectors (Gmail, Slack, Jira...) | `npm i @maia/connectors` |
| `@maia/sdk` | Everything in one install | `npm i @maia/sdk` |

### Python

| Package | Install |
|---------|---------|
| `maia-sdk` | `pip install maia-sdk` |
| `maia-cli` | `pip install maia-cli` |

## Brain — How It Works

```
brain.run("your goal")
  │
  ├── Plans steps (LLM picks from 27 roles)
  ├── For each step:
  │     ├── Agent executes with personality + memory
  │     ├── Other agents can challenge/agree/clarify
  │     ├── Brain reviews (approve/revise/question/reject)
  │     └── Coverage check — are required facts satisfied?
  ├── If gaps remain → injects revision steps
  └── Synthesizes final response
```

### 27 Agent Roles

Brain knows these roles and auto-assigns the best one for each task:

**Executive:** supervisor, project_sponsor
**Product:** product_manager, business_analyst
**Project:** project_manager
**Technical:** tech_lead, coder, data_scientist, designer, devops, it_infrastructure
**Quality:** qa_tester, security_auditor, reviewer
**Content:** writer, translator, researcher, document_reader, browser
**Business:** sales, marketing, customer_support, email_specialist, delivery
**Other:** analyst, finance, legal

Each role has a distinct personality — vocabulary, directness, sentence length, and communication style.

### Caching

Save money on duplicate LLM calls:

```ts
import { createCache, setLLMCache } from '@maia/brain';

setLLMCache(createCache({ ttlMs: 30 * 60 * 1000, maxEntries: 500 }));
// Now identical prompts hit cache instead of the API
```

### Multi-Provider

Use multiple LLM providers with automatic failover:

```ts
import { openai, anthropic, qwen, callWithProviderChain } from '@maia/brain';

const result = await callWithProviderChain(
  { providers: [openai("sk-..."), anthropic("sk-ant-..."), qwen("sk-...")] },
  systemPrompt,
  userPrompt,
);
// If OpenAI fails → tries Anthropic → tries Qwen
```

Per-agent model overrides:

```ts
{ providers: [...], roleModelOverrides: { analyst: "gpt-4o", writer: "claude-sonnet-4-20250514" } }
```

### Structured Output

No more JSON parse failures:

```ts
import { schema, validateOutput } from '@maia/brain';

const s = schema()
  .string("answer", "The main answer", { required: true })
  .number("confidence", "0-1 confidence score")
  .string("verdict", "Decision", { enum: ["approve", "reject"] })
  .build();

const { data, valid, repairs } = validateOutput(llmResponse, s, fallback);
// Auto-strips code fences, extracts JSON, coerces types, validates enums
```

### Guardrails

Safety rails on input and output:

```ts
import { createGuardrails, injectionGuard, piiGuard, customGuard } from '@maia/brain';

const rails = createGuardrails({
  inputGuards: [injectionGuard()],
  outputGuards: [piiGuard(), customGuard("no-competitors", (text) => !text.includes("competitor"))],
});

const input = await rails.checkInput(userMessage);
if (!input.passed) return "Blocked: " + input.results.map(r => r.reason).join(", ");

const output = await rails.checkOutput(agentResponse);
// Blocks: prompt injection, PII (emails, SSNs, credit cards), custom rules
```

### Evaluation

Measure agent quality with datasets:

```ts
import { evaluate, fuzzyMatch, containsKeywords, lengthRange } from '@maia/brain';

const results = await evaluate(
  (input) => brain.run(input),
  {
    name: "pricing-analysis",
    examples: [
      { input: "Analyze SaaS pricing", expected: "PLG grew 34%" },
      { input: "Compare AWS vs GCP", expected: "AWS market share" },
    ],
  },
  [fuzzyMatch(0.5), containsKeywords("pricing", "growth"), lengthRange(100, 5000)],
);

console.log(results.passRate);     // 0.85
console.log(results.totalCostUsd); // $0.12
console.log(results.byScorer);     // { fuzzy_match: { avg: 0.72 }, ... }
```

### Telemetry

Auto-instrument every LLM call for Datadog, Jaeger, Honeycomb:

```ts
import { createTelemetry, setLLMTelemetry } from '@maia/brain';

setLLMTelemetry(createTelemetry({ serviceName: "my-app" }));
// Every callLLM() now creates an OpenTelemetry span with:
// model, provider, tokens, cost, latency, cached, success
```

### Memory

Agents remember past decisions across runs:

```ts
import { createMemoryStore, recallMemories, serializeMemoryStore } from '@maia/brain';

const memory = createMemoryStore();
// Brain auto-stores decisions during runs
// "Last time we split ACV by segment — let's start there"

// Persist to disk/DB
const json = serializeMemoryStore(memory);
```

## Theatre — 14 Visual Surfaces

Theatre doesn't just show text — it shows the actual work:

| Surface | When it appears | What you see |
|---------|----------------|-------------|
| Browser | Agent browses web | URL bar + page screenshot |
| Document | Agent reads PDF | Document with highlights |
| Editor | Agent writes/codes | Live text with cursor |
| Search | Agent searches | Results appearing |
| Email | Agent drafts email | To/Subject/Body |
| Terminal | Agent runs commands | Colored output |
| Chat | Agent uses Slack/Teams | Message bubbles |
| Dashboard | Agent analyzes data | KPI cards + charts |
| Kanban | Agent manages tasks | Board with cards |
| Database | Agent queries DB | SQL + table results |
| CRM | Agent manages leads | Contact/deal cards |
| Diff | Agent reviews code | Red/green lines |
| API | Agent calls APIs | Request/response JSON |
| Calendar | Agent schedules | Time grid + events |

```tsx
import { SurfaceRenderer } from '@maia/theatre';

// Auto-picks the right surface based on agent activity
<SurfaceRenderer surface={currentSurface} />
```

## TeamChat — Agent Conversations

See agents talk to each other with intent-colored bubbles:

```tsx
import { TeamChat } from '@maia/teamchat';

<TeamChat streamUrl="/acp/events" showThinking />
```

Features: agent avatars, intent badges (Proposes/Challenges/Agrees), thinking bubbles, review badges, typing indicators.

## Embeddable Chat

Add AI chat to any React app with one hook:

```tsx
import { useChat } from '@maia/theatre';

function MyChat() {
  const { messages, input, setInput, send, isLoading } = useChat({
    url: "/api/chat",
  });

  return (
    <div>
      {messages.map((m, i) => <div key={i}>{m.role}: {m.content}</div>)}
      <input value={input} onChange={(e) => setInput(e.target.value)} />
      <button onClick={() => send()} disabled={isLoading}>Send</button>
    </div>
  );
}
```

Handles SSE streaming, JSON responses, abort, error states automatically.

## Framework Adapters

Wrap existing LangChain, CrewAI, or AutoGen agents:

```python
from maia_sdk.adapters.langchain import ACPLangChainAdapter
from maia_sdk.adapters.crewai import ACPCrewAIAdapter
from maia_sdk.adapters.autogen import ACPAutoGenAdapter
```

## CLI

```bash
maia stream http://localhost:8000/acp/events   # Watch agents live
maia replay events.jsonl --speed 4             # Replay at 4x
maia validate events.jsonl                     # Validate event format
maia init my-agent                             # Scaffold a project
maia serve events.jsonl                        # Serve as SSE endpoint
maia info                                      # Version + environment
```

## Architecture

```
@maia/brain     → Orchestration (plan, execute, converse, review)
@maia/acp       → Protocol (agent-to-agent communication)
@maia/theatre   → Actions (14 visual surfaces + cost tracking)
@maia/teamchat  → Conversations (chat bubbles + reviews)
@maia/sdk       → Everything in one install
```

```
MCP  →  Tools       (Anthropic — how agents use tools)
ACP  →  Agents      (Maia — how agents talk to each other)
AG-UI → UI          (CopilotKit — how agents stream to frontends)
```

## Contributing

```bash
git clone https://github.com/maia-sdk/maia.git && cd maia
```

### JavaScript / TypeScript

```bash
npm install          # or: pnpm install
npm run build        # builds all packages (workspace order)
npm test             # runs all tests
npm run lint         # lints all packages
```

Build order: `@maia/acp` → `@maia/theatre`, `@maia/teamchat`, `@maia/brain`, ... → `@maia/sdk`

### Python

```bash
pip install -e packages/acp-py               # core protocol
pip install -e packages/connector-adapters    # framework adapters
pip install -e packages/sdk-py               # bundle (depends on acp)
pip install -e packages/cli-py               # CLI (depends on sdk)
python test_sdk.py                           # run tests
```

Install order matters — `acp-py` first, then `sdk-py`, then `cli-py`.

### Both at once

```bash
make install   # JS + Python
make build     # JS + Python wheels
make test      # JS + Python tests
```

Run `make help` for all targets.

## Open Source

MIT licensed. Everything is free.

For hosted infrastructure — managed LLMs, browser automation at scale, enterprise governance — see [maia.dev](https://maia.dev).