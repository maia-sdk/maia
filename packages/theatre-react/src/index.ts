// ─── @maia/theatre ──────────────────────────────────────────────────────────
// Live agent action visualization — tool calls, browsing, searching, cost.
//
// For agent conversations, use @maia/teamchat instead.
//
// Quick start:
//   import { Theatre } from '@maia/theatre';
//   <Theatre streamUrl="/acp/events" />

// Main component
export { Theatre } from "./components/Theatre";
export type { TheatreProps } from "./components/Theatre";

// Sub-components (actions only)
export { ActivityTimeline } from "./components/ActivityTimeline";
export type { ActivityTimelineProps } from "./components/ActivityTimeline";

export { AgentAvatar } from "./components/AgentAvatar";
export type { AgentAvatarProps } from "./components/AgentAvatar";

export { CostBar } from "./components/CostBar";
export type { CostBarProps } from "./components/CostBar";

export { ReplayControls } from "./components/ReplayControls";
export type { ReplayControlsProps } from "./components/ReplayControls";

// Hooks
export { useACPStream } from "./hooks/useACPStream";
export type { UseACPStreamOptions, ACPStreamState } from "./hooks/useACPStream";

export { useReplay } from "./hooks/useReplay";
export type { UseReplayOptions, ReplayState } from "./hooks/useReplay";

export { useChat } from "./hooks/useChat";
export type { UseChatOptions, UseChatReturn, ChatMessage as UseChatMessage } from "./hooks/useChat";

// Surfaces — 14 visual work renderers
export {
  SurfaceRenderer,
  BrowserSurface, DocumentSurface, EditorSurface,
  SearchSurface, EmailSurface, TerminalSurface,
  ChatSurface, DashboardSurface, KanbanSurface, DatabaseSurface,
  CRMSurface, DiffSurface, APISurface, CalendarSurface,
} from "./surfaces/index";
export type {
  SurfaceState, SurfaceType, SurfaceRendererProps,
  SearchResult, EmailDraft, TableData,
  ChatMessage, DashboardWidget,
  KanbanColumn, KanbanCard,
  CRMRecord, DiffHunk, APICall, CalendarEvent,
} from "./surfaces/index";