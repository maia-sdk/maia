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

// Surfaces
export { SurfaceRenderer } from "./surfaces/SurfaceRenderer";
export type { SurfaceRendererProps } from "./surfaces/SurfaceRenderer";
export type { SurfaceType, SurfaceState } from "./surfaces/types";

// Connector Skins — branded visual wrapping for 49 connectors
export { ConnectorSkinComponent as ConnectorSkin } from "./skins";
export type { ConnectorSkinProps, SkinPalette, SkinDescriptor } from "./skins";
export { getConnectorSkin, hasConnectorSkin, getSkinnedConnectorIds } from "./skins";

// ── Overlays — visual interaction feedback (all tree-shakeable) ──────────
// Core overlays: cursor tracking, click feedback, narration, breadcrumbs
export { GhostCursor } from "./overlays/GhostCursor";
export { ClickRipple } from "./overlays/ClickRipple";
export { ThoughtBubble } from "./overlays/ThoughtBubble";
export { InteractionTrace } from "./overlays/InteractionTrace";
export { InteractionOverlay } from "./overlays/InteractionOverlay";

// Browser panel components: scroll, zoom, find, highlights, roadmap
export {
  BrowserMiniMap,
  ComparePanel,
  CopyPulse,
  ExecutionRoadmapOverlay,
  FindOverlay,
  HighlightOverlay,
  SceneFooter,
  ScrollMeter,
  TargetFocusRing,
  OpenedPagesRail,
  VerifierConflictBadge,
  ZoomBadge,
  ZoomHistoryPanel,
} from "./overlays/BrowserPanels";

// Scene event derivation
export { overlayForInteractionEvent } from "./overlays/sceneEvents";

// Overlay types (tree-shakeable — only imported if used)
export type { ClickRippleEntry, TracePoint, SceneOverlayState } from "./overlays";
export type { HighlightColor, HighlightRegion, HighlightPalette, ZoomHistoryEntry, BrowserFindState } from "./overlays/types";
export { highlightPalette } from "./overlays/helpers";

// ── Activity panels — orchestration & stage visualization ────────────────
export { MultiAgentTheatre } from "./panels/MultiAgentTheatre";
export type { MultiAgentColumn, MultiAgentEvent } from "./panels/MultiAgentTheatre";
export { PhaseTimeline } from "./panels/PhaseTimeline";
export { DiffViewer } from "./panels/DiffViewer";
export { DoneStageOverlay } from "./panels/DoneStageOverlay";
// AgentHandoffRelay, AssemblyProgressPanel, BrainReviewPanel available
// in src/panels/ for advanced platform-specific integration.

// Stage derivation — state machine for Theatre stages
export { deriveTheatreStage, desiredPreviewTabForStage } from "./panels/deriveTheatreStage";
export type { TheatreStage } from "./panels/deriveTheatreStage";

// Narrative & feature flags
export { compactNarrative, buildSceneNarrative } from "./panels/sceneNarrative";
export { resolveStagedTheatreEnabled } from "./panels/theatreFeatureFlags";

// ── Full scenes (advanced) ────────────────────────────────────────────────
// Complete page-level visualizations from the Maia platform are available
// in src/scenes/ for advanced users who want to import and adapt them.
// They require additional import path setup — see scenes/README.md.
// For most users, the surfaces + overlays above provide full functionality.
