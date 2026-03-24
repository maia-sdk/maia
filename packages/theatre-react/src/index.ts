// ─── @maia/theatre ──────────────────────────────────────────────────────────
// Live agent visualization SDK
//
// Quick start:
//   import { Theatre } from '@maia/theatre';
//   <Theatre streamUrl="/acp/events" />

// Main component
export { Theatre } from "./components/Theatre";
export type { TheatreProps } from "./components/Theatre";

// Sub-components
export { TeamThread } from "./components/TeamThread";
export type { TeamThreadProps } from "./components/TeamThread";

export { ActivityTimeline } from "./components/ActivityTimeline";
export type { ActivityTimelineProps } from "./components/ActivityTimeline";

export { MessageBubble } from "./components/MessageBubble";
export type { MessageBubbleProps } from "./components/MessageBubble";

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
