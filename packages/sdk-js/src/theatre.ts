// ─── @maia/sdk/theatre ──────────────────────────────────────────────────────
//
// Live agent visualization + conversation UI.
// Import from '@maia/sdk/theatre' for React components.
//
// Usage:
//   import { Theatre, TeamChat, useACPStream } from '@maia/sdk/theatre';
//
//   <Theatre streamUrl="/acp/events" />
//   <TeamChat streamUrl="/acp/events" />
//
// ─────────────────────────────────────────────────────────────────────────────

// Main components
export { Theatre } from "@maia/theatre";
export type { TheatreProps } from "@maia/theatre";

// TeamChat — re-exported so `@maia/sdk/theatre` is a single import for all UI
export { TeamChat } from "@maia/teamchat";
export type { TeamChatProps } from "@maia/teamchat";

// Sub-components
export { TeamThread } from "@maia/theatre";
export type { TeamThreadProps } from "@maia/theatre";

export { ActivityTimeline } from "@maia/theatre";
export type { ActivityTimelineProps } from "@maia/theatre";

export { AgentAvatar } from "@maia/theatre";
export type { AgentAvatarProps } from "@maia/theatre";

export { CostBar } from "@maia/theatre";
export type { CostBarProps } from "@maia/theatre";

export { ReplayControls } from "@maia/theatre";
export type { ReplayControlsProps } from "@maia/theatre";

// Hooks
export { useACPStream } from "@maia/theatre";
export type { UseACPStreamOptions, ACPStreamState } from "@maia/theatre";

export { useReplay } from "@maia/theatre";
export type { UseReplayOptions, ReplayState } from "@maia/theatre";
