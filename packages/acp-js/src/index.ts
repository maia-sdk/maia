// ─── @maia/acp ──────────────────────────────────────────────────────────────
// Agent Collaboration Protocol — TypeScript/JavaScript client
//
// Quick start:
//   import { ACPClient, message } from '@maia/acp';
//
//   const client = new ACPClient({ agentId: 'agent://my-agent' });
//   client.connect('http://localhost:3000/acp/events');
//   client.on('message', (e) => console.log(e.payload.content));

// Types
export type {
  ACPVersion,
  MessageIntent,
  AgentMood,
  ActivityType,
  ReviewVerdict,
  ArtifactKind,
  EventType,
  ACPEvent,
  ACPMessage,
  ACPHandoff,
  ACPReview,
  ACPArtifact,
  ACPActivity,
  ACPCapabilities,
  ACPClientOptions,
  ACPEventMap,
  MessageContext,
  HandoffTask,
  PriorStep,
  ReviewIssue,
  ToolActivity,
  BrowserActivity,
  ProgressInfo,
  CostInfo,
  AgentPersonality,
  AgentSkill,
} from "./types";

// Client
export { ACPClient } from "./client";

// Builders
export {
  envelope,
  message,
  handoff,
  review,
  artifact,
  activity,
  capabilities,
} from "./builders";

// Stream utilities
export { parseSSELine, streamToACPEvents, connectToSSE } from "./stream";
