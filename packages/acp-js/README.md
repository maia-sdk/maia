# @maia/acp

Agent Collaboration Protocol — TypeScript/JavaScript client for agent-to-agent communication.

## Install

```bash
npm install @maia/acp
```

## Quick Start

```ts
import { ACPClient, message, handoff, review, envelope } from '@maia/acp';

// Create a client
const client = new ACPClient({ agentId: 'agent://researcher' });

// Build messages
const msg = message({
  from: 'agent://researcher',
  to: 'agent://analyst',
  intent: 'propose',
  content: 'Found 3 pricing trends in the data.',
});

// Build handoffs
const h = handoff({
  from: 'agent://brain',
  to: 'agent://writer',
  task: 'Write a client-ready report',
});

// Build reviews
const r = review({
  reviewer: 'agent://brain',
  author: 'agent://writer',
  verdict: 'revise',
  feedback: 'Add segment breakdown',
  score: 0.75,
});

// Wrap in ACP envelope
const event = envelope('agent://researcher', 'run_1', 'message', msg);
```

## SSE Streaming

```ts
import { parseSSELine, connectToSSE } from '@maia/acp';

// Parse individual SSE lines
const event = parseSSELine('data: {"acp_version":"1.0",...}');

// Connect to a live stream
const unsub = connectToSSE('http://localhost:8765/acp/events', (event) => {
  console.log(event.event_type, event.payload);
});
```

## API

### Builders
- `message(opts)` — agent-to-agent message
- `handoff(opts)` — delegate a task
- `review(opts)` — review an agent's work
- `artifact(opts)` — attach a file/document
- `activity(opts)` — log an action (searching, browsing, etc.)
- `capabilities(opts)` — announce agent skills
- `envelope(agentId, runId, type, payload)` — wrap any payload in ACP envelope

### Client
- `new ACPClient({ agentId })` — create a client
- `client.emitMessage(msg)` — emit a message event
- `client.on('message', fn)` — listen for events
- `client.messages()` — get all message events
- `client.totalCost()` — get cumulative token/cost usage

### Stream
- `parseSSELine(line)` — parse one SSE line into an ACPEvent
- `streamToACPEvents(stream)` — convert ReadableStream to ACPEvent async iterator
- `connectToSSE(url, onEvent)` — connect to SSE endpoint

## License

MIT — [github.com/maia-sdk/maia](https://github.com/maia-sdk/maia)