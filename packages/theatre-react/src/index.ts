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

// Surfaces — visual work renderers (browser, document, editor, search, email, terminal)
export {
  SurfaceRenderer,
  BrowserSurface,
  DocumentSurface,
  EditorSurface,
  SearchSurface,
  EmailSurface,
  TerminalSurface,
} from "./surfaces/index";
export type {
  SurfaceState,
  SurfaceType,
  SurfaceRendererProps,
  SearchResult,
  EmailDraft,
} from "./surfaces/index";