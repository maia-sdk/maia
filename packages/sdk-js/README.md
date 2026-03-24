# @maia/sdk

> The collaboration and observability layer for AI agents. One install, everything you need.

## Install

```bash
npm install @maia/sdk
```

## Quick Start

### 1. Connect agents (protocol)

```typescript
import { ACPClient, message, handoff } from '@maia/sdk';

// Create a client for your agent
const client = new ACPClient({ agentId: 'agent://researcher' });

// Connect to a live event stream
client.connect('http://localhost:3000/acp/events');

// Listen for messages from other agents
client.on('message', (event) => {
  const msg = event.payload;
  console.log(`${msg.from}: ${msg.content}`);
});

// Send a message to another agent
const msg = message({
  from: 'agent://researcher',
  to: 'agent://analyst',
  intent: 'challenge',
  content: 'The 34% growth figure needs verification.',
});
```

### 2. Visualize agents (Theatre)

```tsx
import { Theatre } from '@maia/sdk/theatre';

// Live mode — watch agents collaborate in real-time
<Theatre streamUrl="/acp/events" />

// Replay mode — DVR for past runs
<Theatre recordedEvents={events} />

// With budget tracking
<Theatre streamUrl="/acp/events" budgetUsd={5.00} showThinking />
```

### 3. Use individual components

```tsx
import {
  TeamThread,       // Slack-like agent chat
  ActivityTimeline, // Tool calls, browser actions
  CostBar,          // Live cost counter
  ReplayControls,   // DVR controls
  AgentAvatar,      // Agent identity
  useACPStream,     // Hook: connect to SSE
  useReplay,        // Hook: replay events
} from '@maia/sdk/theatre';
```

## What's Inside

| Module | What it does |
|--------|-------------|
| `@maia/sdk` | ACP protocol — types, client, builders, SSE parser |
| `@maia/sdk/theatre` | React components — Theatre, TeamThread, CostBar, Replay |

## Works With Any SSE Stream

Theatre doesn't require ACP-native events. Point it at **any** Server-Sent Events endpoint and it will intelligently wrap the events for visualization:

```tsx
// Your existing agent stream — no changes needed
<Theatre streamUrl="/my-existing-agent/events" />
```

## Architecture

```
Your Agent  ──→  ACP Events  ──→  Theatre (visualization)
                     ↑
              Works with any
              SSE/JSON stream
```

## License

MIT — Free and open source.

For advanced features (Brain orchestrator, Computer Use, Connectors, Marketplace), see [maia.ai](https://maia.ai).
