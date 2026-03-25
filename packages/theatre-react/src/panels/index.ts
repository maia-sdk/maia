/**
 * @maia/theatre/panels — activity panel components for Theatre.
 *
 * All components are tree-shakeable — import only what you need:
 *
 *   import { MultiAgentTheatre, PhaseTimeline } from '@maia/theatre';
 */

// ── Multi-agent orchestration view ───────────────────────────────────────
export { MultiAgentTheatre } from "./MultiAgentTheatre";
export type { MultiAgentColumn, MultiAgentEvent } from "./MultiAgentTheatre";

// ── Phase progression timeline ───────────────────────────────────────────
export { PhaseTimeline } from "./PhaseTimeline";

// ── Diff viewer — before/after word-level diff ───────────────────────────
export { DiffViewer } from "./DiffViewer";

// ── Done stage overlay — completion screen ───────────────────────────────
export { DoneStageOverlay } from "./DoneStageOverlay";

// Advanced panels (AgentHandoffRelay, AssemblyProgressPanel, BrainReviewPanel)
// available in src/panels/ — require platform-specific event type wiring.

// ── Stage derivation — state machine for Theatre stages ──────────────────
export { deriveTheatreStage, desiredPreviewTabForStage } from "./deriveTheatreStage";
export type { TheatreStage } from "./deriveTheatreStage";

// ── Narrative — scene narration text builder ─────────────────────────────
export { compactNarrative } from "./sceneNarrative";

// ── Feature flags ────────────────────────────────────────────────────────
export { resolveStagedTheatreEnabled } from "./theatreFeatureFlags";