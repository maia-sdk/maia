# Theatre

Watch AI agents collaborate in real-time. Theatre is a React SDK that visualizes ACP events as a live team chat, activity timeline, and cost tracker.

## Basic usage

```tsx
import { Theatre } from '@maia/sdk/theatre';

// Live mode — connect to any SSE stream
<Theatre streamUrl="http://localhost:8000/acp/events" />
```

That's it. One line. Theatre connects, parses events, and renders.

## Works with any SSE stream

Theatre doesn't require ACP-native events. Point it at **any** SSE endpoint:

```tsx
// Your existing agent's SSE stream — no changes needed
<Theatre streamUrl="http://localhost:3000/my-agent/stream" />
```

Theatre intelligently wraps non-ACP events. If the JSON has `content`, `message`, or `text` fields, it renders as a chat message. Everything else appears as activity events.

## Features

### Team chat
Agents talk to each other in a Slack-like interface with avatars, intent badges (Proposes, Challenges, Agrees), and timestamps.

### Thinking bubbles
When `showThinking` is enabled, agents' reasoning appears as yellow callouts above their messages.

### Activity timeline
Tool calls, browser actions, file reads, and searches appear as a vertical timeline with icons and progress bars.

### Live cost counter
Shows running token count and USD cost per agent and total. Optional budget bar with warning when approaching the limit.

### Replay mode (DVR)
Feed recorded events and scrub through them at variable speed (0.25x to 8x).

```tsx
<Theatre recordedEvents={savedEvents} />
```

## All props

```tsx
<Theatre
  streamUrl="/acp/events"      // SSE endpoint (live mode)
  recordedEvents={events}      // Pre-recorded events (replay mode)
  budgetUsd={5.00}             // Show budget bar
  showThinking={true}          // Show agent reasoning
  defaultTab="chat"            // "chat" or "activity"
  compact={false}              // Smaller bubbles, no avatars
  height="600px"               // Container height
  onEvent={(e) => log(e)}      // Event callback
/>
```

## Individual components

Use sub-components for custom layouts:

```tsx
import {
  TeamThread,
  ActivityTimeline,
  CostBar,
  ReplayControls,
  AgentAvatar,
  MessageBubble,
  useACPStream,
  useReplay,
} from '@maia/sdk/theatre';

function CustomTheatre() {
  const { events, messages, agents, cost, connected } = useACPStream({
    url: "/acp/events",
  });

  return (
    <div className="flex">
      <TeamThread messages={messages} agents={agents} showThinking />
      <ActivityTimeline events={events} />
      <CostBar events={events} budgetUsd={10} />
    </div>
  );
}
```

## Hooks

### useACPStream

```tsx
const {
  events,      // All events
  messages,    // Just message events
  agents,      // Known agent capabilities
  cost,        // { tokens, usd }
  connected,   // Boolean
  runId,       // Current run ID
  connect,     // Manual connect
  disconnect,  // Manual disconnect
  clear,       // Clear buffer
} = useACPStream({ url: "/acp/events" });
```

### useReplay

```tsx
const {
  visibleEvents,  // Events played so far
  position,       // Current position
  playing,        // Is playing
  speed,          // Current speed
  total,          // Total events
  progress,       // 0-100
  play, pause, reset, setSpeed, scrubTo, stepForward, stepBackward,
} = useReplay({ events: recordedEvents, speed: 2 });
```