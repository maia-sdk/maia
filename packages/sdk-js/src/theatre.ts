// ─── @maia/sdk/theatre ──────────────────────────────────────────────────────
//
// Theatre (actions) + TeamChat (conversations) + Surfaces (visual work).
//
// Usage:
//   import { Theatre, TeamChat, SurfaceRenderer } from '@maia/sdk/theatre';
//
//   <Theatre streamUrl="/acp/events" />
//   <TeamChat streamUrl="/acp/events" />

// ── Theatre (actions + surfaces) ─────────────────────────────────────────────

export { Theatre } from "@maia/theatre";
export type { TheatreProps } from "@maia/theatre";

export { ActivityTimeline } from "@maia/theatre";
export type { ActivityTimelineProps } from "@maia/theatre";

export { AgentAvatar } from "@maia/theatre";
export type { AgentAvatarProps } from "@maia/theatre";

export { CostBar } from "@maia/theatre";
export type { CostBarProps } from "@maia/theatre";

export { ReplayControls } from "@maia/theatre";
export type { ReplayControlsProps } from "@maia/theatre";

// Surfaces
export {
  SurfaceRenderer,
  BrowserSurface, DocumentSurface, EditorSurface,
  SearchSurface, EmailSurface, TerminalSurface,
  ChatSurface, DashboardSurface, KanbanSurface, DatabaseSurface,
  CRMSurface, DiffSurface, APISurface, CalendarSurface,
} from "@maia/theatre";
export type { SurfaceState, SurfaceType } from "@maia/theatre";

// Hooks
export { useACPStream } from "@maia/theatre";
export type { UseACPStreamOptions, ACPStreamState } from "@maia/theatre";

export { useReplay } from "@maia/theatre";
export type { UseReplayOptions, ReplayState } from "@maia/theatre";

// ── TeamChat (conversations) ─────────────────────────────────────────────────

export { TeamChat } from "@maia/teamchat";
export type { TeamChatProps } from "@maia/teamchat";

export { AgentBubble } from "@maia/teamchat";
export type { AgentBubbleProps } from "@maia/teamchat";

export { ReviewBadge } from "@maia/teamchat";
export type { ReviewBadgeProps } from "@maia/teamchat";

export { TypingIndicator } from "@maia/teamchat";
export type { TypingIndicatorProps } from "@maia/teamchat";

export { useConversationStream } from "@maia/teamchat";
export type { UseConversationStreamOptions, ConversationStreamState } from "@maia/teamchat";