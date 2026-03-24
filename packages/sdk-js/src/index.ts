// ─── @maia/sdk ──────────────────────────────────────────────────────────────
//
// The collaboration and observability layer for AI agents.
// One import, everything you need.
//
// Usage:
//
//   // Protocol — agent-to-agent communication
//   import { ACPClient, message, handoff, review } from '@maia/sdk';
//
//   // Visualization — watch agents work live
//   import { Theatre, useACPStream } from '@maia/sdk/theatre';
//
// ─────────────────────────────────────────────────────────────────────────────

// ── ACP Protocol ─────────────────────────────────────────────────────────────
// Everything for agent-to-agent communication.

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
} from "@maia/acp";

// Client
export { ACPClient } from "@maia/acp";

// Builders
export {
  envelope,
  message,
  handoff,
  review,
  artifact,
  activity,
  capabilities,
} from "@maia/acp";

// Stream utilities
export { parseSSELine, streamToACPEvents, connectToSSE } from "@maia/acp";
