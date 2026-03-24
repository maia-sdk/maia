# Maia

> The collaboration and observability layer for AI agents.

**Agents need to communicate. Teams need to see what they're doing. Enterprises need to trust the output.**

Maia gives you:
- **ACP** — Agent Collaboration Protocol. The open standard for agent-to-agent communication.
- **Theatre** — Live visualization SDK. Watch agents collaborate in real-time.
- **CLI** — Stream, replay, and validate agent events from the terminal.

## Quick Start

### JavaScript / TypeScript

```bash
npm install @maia/sdk
```

```tsx
// Protocol — agent-to-agent communication
import { ACPClient, message, handoff, review } from '@maia/sdk';

// Visualization — watch agents work live
import { Theatre } from '@maia/sdk/theatre';

<Theatre streamUrl="/acp/events" />
```

### Python

```bash
pip install maia-sdk
```

```python
from maia_sdk import ACPClient, message, handoff, review

# Wrap existing frameworks
from maia_sdk.adapters.langchain import ACPLangChainAdapter
from maia_sdk.adapters.crewai import ACPCrewAIAdapter
from maia_sdk.adapters.autogen import ACPAutoGenAdapter
```

### CLI

```bash
pip install maia-cli

maia stream http://localhost:8000/acp/events   # Watch agents live
maia replay events.jsonl --speed 2             # Replay recorded runs
maia validate events.jsonl                     # Validate events
maia init my-agent                             # Scaffold a new project
```

## Where Maia Fits

```
MCP  ->  Tools       (Anthropic - how agents use tools)
ACP  ->  Agents      (Maia - how agents talk to each other)
AG-UI -> UI          (CopilotKit - how agents stream to frontends)
```

MCP solved tool connectivity. AG-UI solved frontend streaming. **Nobody solved agent-to-agent collaboration.** ACP fills that gap. Theatre makes it visible.

## Packages

| Package | Description | Install |
|---------|-------------|---------|
| [`@maia/sdk`](packages/sdk-js/) | JS/TS bundle - ACP + Theatre | `npm install @maia/sdk` |
| [`maia-sdk`](packages/sdk-py/) | Python bundle - ACP + adapters | `pip install maia-sdk` |
| [`@maia/acp`](packages/acp-js/) | ACP TypeScript client | `npm install @maia/acp` |
| [`maia-acp`](packages/acp-py/) | ACP Python client | `pip install maia-acp` |
| [`@maia/theatre`](packages/theatre-react/) | React visualization SDK | `npm install @maia/theatre` |
| [`@maia/cli`](packages/cli/) | Node.js CLI | `npx @maia/cli` |
| [`maia-cli`](packages/cli-py/) | Python CLI | `pip install maia-cli` |
| [`acp-spec`](packages/acp-spec/) | ACP v1 JSON Schema definitions | - |

## ACP Protocol - 6 Primitives

| Primitive | Purpose | Example |
|-----------|---------|---------|
| `message` | Agent talks to agent | Researcher asks Analyst to verify data |
| `handoff` | Transfer task + context | Brain delegates "write report" to Writer |
| `review` | Evaluate another's output | Brain reviews Writer's draft |
| `artifact` | Pass work products | Analyst sends dataset to Writer |
| `event` | Live work activity stream | Agent emits "searching web..." |
| `capabilities` | Agent discovery | Brain queries available agents |

## Theatre - Live Visualization

```tsx
// Live mode - connect to any SSE stream
<Theatre streamUrl="/acp/events" />

// Replay mode - DVR for past runs
<Theatre recordedEvents={events} />

// With budget tracking
<Theatre streamUrl="/acp/events" budgetUsd={5.00} showThinking />
```

Theatre works with **any SSE stream** - not just ACP. Point it at your existing agent endpoint and it will intelligently render the events. No migration required.

### Components

| Component | What it does |
|-----------|-------------|
| `<Theatre>` | Main component - team chat + activity + cost + replay |
| `<TeamThread>` | Slack-like agent conversation view |
| `<ActivityTimeline>` | Tool calls, browser actions, searches |
| `<CostBar>` | Live running cost counter with budget gates |
| `<ReplayControls>` | DVR controls - play/pause, speed, scrub |
| `<AgentAvatar>` | Consistent agent identity with mood/activity indicators |

### Hooks

| Hook | What it does |
|------|-------------|
| `useACPStream` | Connect to SSE, get typed events, track agents + cost |
| `useReplay` | Variable-speed replay with timestamp-based delays |

## Framework Adapters

```python
# LangChain
from maia_sdk.adapters.langchain import ACPLangChainAdapter
acp_agent = ACPLangChainAdapter(agent=my_agent, agent_id="agent://researcher")
for event in acp_agent.run("Find Q4 data"):
    print(event.model_dump_json())

# CrewAI
from maia_sdk.adapters.crewai import ACPCrewAIAdapter
acp_crew = ACPCrewAIAdapter(crew=my_crew)

# AutoGen
from maia_sdk.adapters.autogen import ACPAutoGenAdapter
acp_chat = ACPAutoGenAdapter(group_chat=my_chat)
```

## Open Source

Everything in this repo is MIT licensed.

For advanced features - Brain orchestrator, Computer Use, Connectors, Marketplace, Enterprise governance - see [maia.dev](https://maia.dev).

## License

MIT