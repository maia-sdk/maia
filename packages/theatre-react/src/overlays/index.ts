/**
 * @maia/theatre/overlays — visual overlay components for Theatre surfaces.
 *
 * All components are tree-shakeable — import only what you need:
 *
 *   import { GhostCursor, ClickRipple } from '@maia/theatre';
 *
 * Or import nothing and get a clean Theatre without overlays.
 */

// ── Core interaction overlays ────────────────────────────────────────────
export { GhostCursor } from "./GhostCursor";
export { ClickRipple } from "./ClickRipple";
export type { ClickRippleEntry } from "./ClickRipple";
export { ThoughtBubble } from "./ThoughtBubble";
export { InteractionTrace } from "./InteractionTrace";
export type { TracePoint } from "./InteractionTrace";
export { InteractionOverlay } from "./InteractionOverlay";

// ── Browser panel components ─────────────────────────────────────────────
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
} from "./BrowserPanels";

// ── Scene event derivation ───────────────────────────────────────────────
export { overlayForInteractionEvent } from "./sceneEvents";
export type { SceneOverlayState } from "./sceneEvents";

// ── Types ────────────────────────────────────────────────────────────────
export type {
  HighlightColor,
  HighlightRegion,
  HighlightPalette,
  ZoomHistoryEntry,
  BrowserFindState,
} from "./types";

// ── Helpers ──────────────────────────────────────────────────────────────
export { highlightPalette } from "./helpers";