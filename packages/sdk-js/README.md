# @maia/sdk

> The Maia SDK for agent communication, execution theatre, and Maia computer runtime integration.

## Install

```bash
npm install @maia/sdk
```

## Imports

```ts
import {
  ACPClient,
  message,
  handoff,
  review,
  activity,
  capabilities,
  executionActivity,
  executionEnvelope,
  suggestConversationMove,
  draftConversationMessage,
  summarizeConversationThread,
  createComputerUseClient,
} from "@maia/sdk";

import {
  Theatre,
  MaiaDesktop,
  TheatreDesktop,
  TeamThread,
  ActivityTimeline,
  useACPStream,
  useReplay,
} from "@maia/sdk/theatre";

import { ConversationPanel, TeamChat } from "@maia/sdk/teamchat";
```

## Design Rule

Every Maia SDK entrypoint takes a structured object with many named fields.

- Good: `message({ from, to, intent, content, threadId })`
- Bad: `message("send this to analyst")`

That gives you stable tool calling, validation, optional fields, and backward-compatible extension.

## Quick Start

### ACP message

```ts
import { envelope, message } from "@maia/sdk";

const event = envelope(
  "agent://researcher",
  "run_123",
  "message",
  message({
    from: "agent://researcher",
    to: "agent://analyst",
    intent: "ask",
    content: "Validate the Q2 growth calculation.",
    threadId: "thread_growth",
    taskId: "task_growth_review",
    taskTitle: "Review Q2 growth",
    requiresAck: true,
    mentions: ["agent://analyst"],
  }),
);
```

### Theatre

```tsx
import { Theatre } from "@maia/sdk/theatre";

export function App() {
  return <Theatre streamUrl="/acp/events" budgetUsd={5} showThinking />;
}
```

### Team chat

```tsx
import { ConversationPanel } from "@maia/sdk/teamchat";

export function App({ rows }: { rows: unknown[] }) {
  return <ConversationPanel rows={rows as never[]} loading={false} />;
}
```

### Maia desktop

```tsx
import { MaiaDesktop } from "@maia/sdk/theatre";

export function App() {
  return (
    <MaiaDesktop
      viewer={<div>Scene viewer</div>}
      phaseTimeline={[]}
      streaming={false}
      visibleEvents={[]}
      orderedEvents={[]}
      activeEvent={null}
      plannedRoadmapSteps={[]}
      roadmapActiveIndex={-1}
    />
  );
}
```

### Maia computer runtime

```ts
import { createComputerUseClient } from "@maia/sdk";

const computer = createComputerUseClient({
  apiBase: "http://localhost:8000",
  userId: "demo-user",
});

const session = await computer.startSession({
  url: "https://example.com",
  requestId: "req_123",
});
```

## API Reference

## ACP builders

### `message(options)`

Used for agent-to-agent conversation.

| Field | Required | Type | Notes |
| --- | --- | --- | --- |
| `from` | yes | `string` | Sender agent id |
| `to` | yes | `string` | Recipient agent id |
| `intent` | yes | `MessageIntent` | Example: `ask`, `challenge`, `summarize`, `review` |
| `content` | yes | `string` | Main message body |
| `thinking` | no | `string` | Optional reasoning preview |
| `mood` | no | `AgentMood` | Optional conversational tone |
| `messageId` | no | `string` | Stable message identifier |
| `threadId` | no | `string` | Conversation thread id |
| `inReplyTo` | no | `string` | Parent message id |
| `taskId` | no | `string` | Related task id |
| `taskTitle` | no | `string` | Human-readable task title |
| `handoffId` | no | `string` | Linked handoff id |
| `reviewId` | no | `string` | Linked review id |
| `channel` | no | `string` | Optional channel label |
| `mentions` | no | `string[]` | Mentioned agent ids |
| `requiresAck` | no | `boolean` | Whether recipient should acknowledge |
| `deliveryStatus` | no | `DeliveryStatus` | `queued`, `sent`, `delivered`, `failed`, `acknowledged` |
| `ackedBy` | no | `string[]` | Agents who acknowledged |
| `artifacts` | no | `ACPArtifact[]` | Attached artifacts |

### `handoff(options)`

Used to transfer work ownership between agents.

| Field | Required | Type | Notes |
| --- | --- | --- | --- |
| `from` | yes | `string` | Sender agent id |
| `to` | yes | `string` | Recipient agent id |
| `task` | yes | `HandoffTask` | Task payload and lifecycle |
| `handoffId` | no | `string` | Stable handoff id |
| `status` | no | `TaskLifecycleStatus` | Task state |
| `requiresAck` | no | `boolean` | Whether recipient must accept |
| `acceptedBy` | no | `string` | Accepting agent |
| `declinedReason` | no | `string` | Reason for decline |
| `context` | no | `Record<string, unknown>` | Extra context |
| `artifacts` | no | `ACPArtifact[]` | Supporting artifacts |

### `review(options)`

Used for approval, rejection, and revision loops.

| Field | Required | Type | Notes |
| --- | --- | --- | --- |
| `reviewer` | yes | `string` | Reviewing agent id |
| `author` | yes | `string` | Author agent id |
| `verdict` | yes | `ReviewVerdict` | Example: `approved`, `changes_requested` |
| `feedback` | no | `string` | Review summary |
| `score` | no | `number` | Numeric confidence/quality |
| `revisionInstructions` | no | `string` | Concrete requested changes |
| `strengths` | no | `string[]` | Positive points |
| `issues` | no | `ReviewIssue[]` | Structured issues |
| `round` | no | `number` | Review round number |

### `artifact(options)`

Used to attach files or generated outputs.

| Field | Required | Type | Notes |
| --- | --- | --- | --- |
| `kind` | yes | `ArtifactKind` | Example: `document`, `image`, `json` |
| `title` | yes | `string` | Display label |
| `content` | yes | `string` | Artifact payload |
| `mimeType` | no | `string` | MIME type |
| `metadata` | no | `Record<string, unknown>` | Extra metadata |

### `activity(options)`

Used for operational activity traces.

| Field | Required | Type | Notes |
| --- | --- | --- | --- |
| `agentId` | yes | `string` | Agent id |
| `activity` | yes | `ActivityType` | Example: `tool_call`, `browser_action`, `progress` |
| `detail` | no | `string` | Human-readable detail |
| `tool` | no | `ToolActivity` | Tool metadata |
| `browser` | no | `BrowserActivity` | Browser metadata |
| `progress` | no | `ProgressInfo` | Progress status |
| `cost` | no | `CostInfo` | Cost tracking |

### `capabilities(options)`

Used to describe what an agent can do and whether it is available.

| Field | Required | Type | Notes |
| --- | --- | --- | --- |
| `agentId` | yes | `string` | Agent id |
| `name` | yes | `string` | Display name |
| `skills` | yes | `AgentSkill[]` | Skills list |
| `description` | no | `string` | Agent description |
| `role` | no | `string` | Role label |
| `personality` | no | `AgentPersonality` | Personality metadata |
| `connectors` | no | `string[]` | Connected tools/systems |
| `acceptsIntents` | no | `MessageIntent[]` | Intents the agent handles |
| `maxConcurrentTasks` | no | `number` | Concurrency limit |
| `presence` | no | `AgentPresence` | Live availability and focus |

### `executionActivity(options)`

Used to enrich ACP events with Theatre execution metadata.

| Field | Required | Type | Notes |
| --- | --- | --- | --- |
| `agentId` | yes | `string` | Agent id |
| `activity` | yes | `ActivityType` | Base activity type |
| `detail` | no | `string` | Detail text |
| `tool` | no | `ToolActivity` | Tool metadata |
| `browser` | no | `BrowserActivity` | Browser metadata |
| `progress` | no | `ProgressInfo` | Progress metadata |
| `cost` | no | `CostInfo` | Cost metadata |
| `execution` | no | `ExecutionExtension` | Maia execution extension with stage/surface metadata |

### `envelope(agentId, runId, eventType, payload, parentEventId?)`

Wraps an ACP payload into a top-level event.

| Parameter | Required | Type |
| --- | --- | --- |
| `agentId` | yes | `string` |
| `runId` | yes | `string` |
| `eventType` | yes | `EventType` |
| `payload` | yes | `unknown` |
| `parentEventId` | no | `string` |

### `executionEnvelope(agentId, runId, payload, parentEventId?)`

Convenience wrapper for execution events.

| Parameter | Required | Type |
| --- | --- | --- |
| `agentId` | yes | `string` |
| `runId` | yes | `string` |
| `payload` | yes | `ACPExecutionActivity` |
| `parentEventId` | no | `string` |

## ACP client

### `new ACPClient(options)`

| Field | Required | Type | Notes |
| --- | --- | --- | --- |
| `agentId` | yes | `string` | Agent id |
| `name` | no | `string` | Display name |
| `role` | no | `string` | Role label |
| `personality` | no | `AgentPersonality` | Personality metadata |
| `streamUrl` | no | `string` | SSE endpoint |
| `transport` | no | `ACPTransport` | Custom delivery implementation |
| `registry` | no | `ACPRegistryLike` | Agent registry |
| `onEvent` | no | `(event) => void` | Event callback |
| `onError` | no | `(error) => void` | Error callback |

### Client methods

| Method | Parameters |
| --- | --- |
| `connect(streamUrl)` | `streamUrl: string` |
| `sendMessage(message, options?)` | `message: ACPMessage`, `options?: { timeoutMs?: number }` |
| `sendHandoff(handoff, options?)` | `handoff: ACPHandoff`, `options?: { timeoutMs?: number }` |
| `sendReview(review, options?)` | `review: ACPReview`, `options?: { recipient?: string; timeoutMs?: number }` |

## Brain collaboration helpers

### `suggestConversationMove(llm, context)`

| Field | Required | Type | Notes |
| --- | --- | --- | --- |
| `llm` | yes | `LLMConfig` | Provider/model configuration |
| `context.objective` | yes | `string` | Current goal |
| `context.currentAgentId` | yes | `string` | Active agent |
| `context.participants` | yes | `CollaborationParticipant[]` | Available teammates |
| `context.events` | yes | `ACPEvent[]` | Current thread or run events |
| `context.threadId` | no | `string` | Thread id |
| `context.taskId` | no | `string` | Task id |
| `context.taskTitle` | no | `string` | Task title |
| `context.maxWords` | no | `number` | Draft brevity limit |

### `draftConversationMessage(llm, context, move)`

| Parameter | Required | Type |
| --- | --- | --- |
| `llm` | yes | `LLMConfig` |
| `context` | yes | `CollaborationContext` |
| `move` | yes | `ConversationMove` |

### `summarizeConversationThread(llm, context)`

| Parameter | Required | Type |
| --- | --- | --- |
| `llm` | yes | `LLMConfig` |
| `context` | yes | `CollaborationContext` |

### `LLMConfig`

| Field | Required | Type |
| --- | --- | --- |
| `provider` | yes | `string` |
| `model` | yes | `string` |
| `apiKey` | yes | `string` |
| `baseUrl` | no | `string` |
| `headers` | no | `Record<string, string>` |

## Maia computer runtime

### `createComputerUseClient(config?)`

| Field | Required | Type | Notes |
| --- | --- | --- | --- |
| `apiBase` | no | `string` | Maia API base URL |
| `userId` | no | `string` | User/session identity |
| `headers` | no | `Record<string, string>` | Extra headers |
| `fetch` | no | `typeof fetch` | Custom fetch implementation |
| `eventSource` | no | `typeof EventSource` | Custom SSE constructor |

### `startComputerUseSession(input)`

| Field | Required | Type |
| --- | --- | --- |
| `url` | yes | `string` |
| `requestId` | no | `string` |

### `streamComputerUseSession(sessionId, options)`

| Field | Required | Type | Notes |
| --- | --- | --- | --- |
| `sessionId` | yes | `string` | Active session id |
| `task` | yes | `string` | Instruction to execute |
| `model` | no | `string` | Runtime model |
| `maxIterations` | no | `number` | Iteration limit |
| `runId` | no | `string` | Correlated run id |
| `onEvent` | no | `(event) => void` | Stream callback |
| `onDone` | no | `() => void` | Completion callback |
| `onError` | no | `(error) => void` | Error callback |

### Other runtime helpers

| Method | Parameters |
| --- | --- |
| `getComputerUseSession(sessionId)` | `sessionId: string` |
| `listComputerUseSessions()` | none |
| `navigateComputerUseSession(sessionId, url)` | `sessionId: string`, `url: string` |
| `cancelComputerUseSession(sessionId)` | `sessionId: string` |
| `getComputerUseActiveModel()` | none |
| `getComputerUsePolicy()` | none |
| `getComputerUseSLOSummary(windowSeconds?)` | `windowSeconds?: number` |

## Theatre

### `Theatre(props)`

Default live ACP viewer.

| Field | Required | Type |
| --- | --- | --- |
| `streamUrl` | no | `string` |
| `recordedEvents` | no | `ACPEvent[]` |
| `budgetUsd` | no | `number` |
| `showThinking` | no | `boolean` |
| `defaultTab` | no | `string` |
| `compact` | no | `boolean` |
| `className` | no | `string` |
| `onEvent` | no | `(event) => void` |
| `height` | no | `number \| string` |
| `theme` | no | `TheatreThemeOverride` |

### `TheatreDesktop(props)`

Desktop frame and chrome.

| Field | Required | Type |
| --- | --- | --- |
| `children` | yes | `ReactNode` |
| `fullscreen` | no | `boolean` |
| `streaming` | no | `boolean` |
| `isTheaterView` | no | `boolean` |
| `isFocusMode` | no | `boolean` |
| `title` | no | `string` |
| `roleLabel` | no | `string` |
| `statusText` | no | `string` |
| `sceneTransitionLabel` | no | `string` |
| `className` | no | `string` |
| `showTheaterToggle` | no | `boolean` |
| `onToggleTheaterView` | no | `() => void` |
| `onToggleFocusMode` | no | `() => void` |
| `onOpenFullscreen` | no | `() => void` |
| `cursorPoint` | no | `{ x: number; y: number }` |
| `showCursor` | no | `boolean` |
| `viewportOverlay` | no | `ReactNode` |
| `footer` | no | `ReactNode` |
| `captionTitle` | no | `string` |
| `captionDetail` | no | `string` |
| `showCaption` | no | `boolean` |
| `theme` | no | `TheatreThemeOverride` |

### `MaiaDesktop(props)`

Default Maia desktop composition.

| Field | Required | Type |
| --- | --- | --- |
| `viewer` | yes | `ReactNode` |
| `phaseTimeline` | yes | `ActivityPhaseRow[]` |
| `streaming` | yes | `boolean` |
| `visibleEvents` | yes | `ACPEvent[]` |
| `orderedEvents` | yes | `ACPEvent[]` |
| `activeEvent` | yes | `ACPEvent \| null` |
| `plannedRoadmapSteps` | yes | `RoadmapStep[]` |
| `roadmapActiveIndex` | yes | `number` |
| `eventCount` | no | `number` |
| `showPlanningSecondaryPanels` | no | `boolean` |
| `showReplayRail` | no | `boolean` |
| `theatreStage` | no | `string` |
| `needsHumanReview` | no | `boolean` |
| `humanReviewNotes` | no | `string[]` |
| `panelTab` | no | `string` |
| `onPanelTabChange` | no | `(tab) => void` |
| `timelinePanel` | no | `ReactNode` |
| `conversationPanel` | no | `ReactNode` |
| `fullscreenOverlay` | no | `ReactNode` |
| `approvalGate` | no | `ReactNode` |

## Theatre hooks

### `useACPStream(options)`

| Field | Required | Type |
| --- | --- | --- |
| `url` | yes | `string` |
| `headers` | no | `Record<string, string>` |
| `maxBuffer` | no | `number` |
| `autoConnect` | no | `boolean` |
| `onEvent` | no | `(event) => void` |
| `onError` | no | `(error) => void` |

### `useReplay(options)`

| Field | Required | Type |
| --- | --- | --- |
| `events` | yes | `ACPEvent[]` |
| `speed` | no | `number` |
| `autoPlay` | no | `boolean` |

## Theme

```ts
import { maiaTheme, resolveTheatreTheme } from "@maia/sdk";

const theme = resolveTheatreTheme({
  ...maiaTheme,
  colors: {
    ...maiaTheme.colors,
    accent: "#0f766e",
  },
});
```

## Recommended usage pattern

1. Use ACP builders for messages, handoffs, reviews, and execution events.
2. Use `ACPClient` if you need a Maia-native transport layer.
3. Use `suggestConversationMove` and `draftConversationMessage` for LLM-native coordination.
4. Use `createComputerUseClient` for Maia computer runtime sessions.
5. Use `MaiaDesktop` if you want the default Maia Theatre experience.

## Works with any SSE stream

Theatre can wrap generic SSE/JSON streams, but ACP-native events are the recommended path if you want full Maia desktop semantics.

```tsx
<Theatre streamUrl="/my-existing-agent/events" />
```

## License

MIT

