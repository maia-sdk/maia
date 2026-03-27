// @maia/theatre
// Live agent visualization SDK with Maia desktop defaults.

// Main component
export { Theatre } from "./components/Theatre";
export type { TheatreProps } from "./components/Theatre";

// Core sub-components
export { TeamThread } from "./components/TeamThread";
export type { TeamThreadProps } from "./components/TeamThread";
export { ActivityTimeline } from "./components/ActivityTimeline";
export type { ActivityTimelineProps } from "./components/ActivityTimeline";
export { AgentHandoffRelay } from "./components/AgentHandoffRelay";
export type { AgentHandoffRelayProps } from "./components/AgentHandoffRelay";
export { ApprovalGateCard } from "./components/ApprovalGateCard";
export type { ApprovalGateCardProps } from "./components/ApprovalGateCard";
export { AssemblyProgressPanel } from "./components/AssemblyProgressPanel";
export type { AssemblyProgressEvent, AssemblyProgressPanelProps } from "./components/AssemblyProgressPanel";
export { BrainReviewPanel } from "./components/BrainReviewPanel";
export type { BrainReviewEvent, BrainReviewPanelProps } from "./components/BrainReviewPanel";
export { DiffViewer } from "./components/DiffViewer";
export type { DiffViewerProps } from "./components/DiffViewer";
export { DoneStageOverlay } from "./components/DoneStageOverlay";
export type { DoneStageOverlayProps } from "./components/DoneStageOverlay";
export { FullscreenViewerOverlay } from "./components/FullscreenViewerOverlay";
export type {
  FullscreenTimelineItem,
  FullscreenViewerOverlayProps,
} from "./components/FullscreenViewerOverlay";
export { InteractionSuggestionsPanel } from "./components/InteractionSuggestionsPanel";
export type {
  InteractionSuggestion,
  InteractionSuggestionsPanelProps,
} from "./components/InteractionSuggestionsPanel";
export { PhaseTimeline } from "./components/PhaseTimeline";
export type { ActivityPhaseRow, PhaseTimelineProps } from "./components/PhaseTimeline";
export { ResearchTodoList } from "./components/ResearchTodoList";
export type { ResearchTodoListProps, RoadmapStep, TodoEvent } from "./components/ResearchTodoList";
export { MessageBubble } from "./components/MessageBubble";
export type { MessageBubbleProps } from "./components/MessageBubble";
export { ProvenancePanel } from "./components/ProvenancePanel";
export type { ProvenancePanelProps } from "./components/ProvenancePanel";
export { ClaimCard } from "./components/ClaimCard";
export type { ClaimCardProps } from "./components/ClaimCard";
export { ContradictionBanner } from "./components/ContradictionBanner";
export type { ContradictionBannerProps } from "./components/ContradictionBanner";
export { DecisionTimeline } from "./components/DecisionTimeline";
export type { DecisionTimelineProps } from "./components/DecisionTimeline";
export { DecisionInspector } from "./components/DecisionInspector";
export type { DecisionInspectorProps } from "./components/DecisionInspector";
export { BranchPlanList } from "./components/BranchPlanList";
export type { BranchPlanListProps } from "./components/BranchPlanList";
export { AgentAvatar } from "./components/AgentAvatar";
export type { AgentAvatarProps } from "./components/AgentAvatar";
export { CostBar } from "./components/CostBar";
export type { CostBarProps } from "./components/CostBar";
export { ReplayControls } from "./components/ReplayControls";
export type { ReplayControlsProps } from "./components/ReplayControls";

// Maia desktop shell
export { DesktopSceneRouter } from "./components/DesktopSceneRouter";
export type { DesktopSceneRouterProps } from "./components/DesktopSceneRouter";
export { TheatreDesktop } from "./components/TheatreDesktop";
export type { TheatreDesktopProps } from "./components/TheatreDesktop";
export { TheatreDesktopViewer } from "./components/TheatreDesktopViewer";
export type { TheatreDesktopViewerProps } from "./components/TheatreDesktopViewer";
export { MaiaDesktop } from "./components/MaiaDesktop";
export type { MaiaDesktopProps } from "./components/MaiaDesktop";

// Hooks
export { useACPStream } from "./hooks/useACPStream";
export type { UseACPStreamOptions, ACPStreamState } from "./hooks/useACPStream";
export { useReplay } from "./hooks/useReplay";
export type { UseReplayOptions, ReplayState } from "./hooks/useReplay";

// Surfaces
export { SurfaceRenderer } from "./surfaces/SurfaceRenderer";
export type { SurfaceRendererProps } from "./surfaces/SurfaceRenderer";
export type { SurfaceType, SurfaceState } from "./surfaces/types";

// Connector skins
export { ConnectorSkinComponent as ConnectorSkin } from "./skins";
export type { ConnectorSkinProps, SkinPalette, SkinDescriptor } from "./skins";
export { getConnectorSkin, hasConnectorSkin, getSkinnedConnectorIds } from "./skins";

// Overlays
export { GhostCursor } from "./overlays/GhostCursor";
export { ClickRipple } from "./overlays/ClickRipple";
export { ThoughtBubble } from "./overlays/ThoughtBubble";
export { InteractionTrace } from "./overlays/InteractionTrace";
export { InteractionOverlay } from "./overlays/InteractionOverlay";
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
export { overlayForInteractionEvent } from "./overlays/sceneEvents";
export type { ClickRippleEntry, TracePoint, SceneOverlayState } from "./overlays";
export type {
  HighlightColor,
  HighlightRegion,
  HighlightPalette,
  ZoomHistoryEntry,
  BrowserFindState,
} from "./overlays/types";
export { highlightPalette } from "./overlays/helpers";

// Panels
export { MultiAgentTheatre } from "./panels/MultiAgentTheatre";
export type { MultiAgentColumn, MultiAgentEvent } from "./panels/MultiAgentTheatre";
export { deriveTheatreStage, desiredPreviewTabForStage } from "./panels/deriveTheatreStage";
export type { TheatreStage } from "./panels/deriveTheatreStage";
export { compactNarrative, buildSceneNarrative } from "./panels/sceneNarrative";
export { resolveStagedTheatreEnabled } from "./panels/theatreFeatureFlags";
export {
  EMAIL_SCENE_EVENT_TYPES,
  agentColorFromEvent,
  agentEventTypeFromEvent,
  agentLabelFromEvent,
  cursorFromEvent,
  cursorLabelFromSemantics,
  deriveSurfaceCommit,
  desktopStatusForEventType,
  deriveAgentActivityState,
  eventMetadataString,
  eventTab,
  findRecentMetadataString,
  extractSuggestionLayer,
  derivePhaseTimeline,
  phaseForEvent,
  interactionActionFromEvent,
  interactionActionPhaseFromEvent,
  interactionActionStatusFromEvent,
  isApiRuntimeEvent,
  isInteractionSuggestionEvent,
  readBooleanField,
  readEventIndex,
  readObjectListField,
  readNumberField,
  readStringField,
  readStringListField,
  mergeLiveSceneData,
  resolveEventSourceUrl,
  resolveBrowserUrl,
  resolveDocBodyHint,
  resolveEmailBodyHint,
  resolveEmailRecipient,
  resolveEmailSubject,
  resolveSheetBodyHint,
  derivePlannedRoadmap,
  suggestionLookupKeyForEvent,
  roleColorFromKey,
  roleKeyFromEvent,
  roleLabelFromKey,
  roleNarrativeFromSemantics,
  sampleFilmstripEvents,
  sceneSurfaceFromEvent,
  surfaceLabelForSceneKey,
  tabForEventType,
  tabForSceneSurface,
  URL_PATTERN,
  isConversationOnlySceneSignal,
} from "./panels/agentActivity";
export { deriveProvenanceState } from "./panels/deriveProvenanceState";
export type { ProvenanceState } from "./panels/deriveProvenanceState";
export { createDebuggerBranchPlanEvent, deriveDebuggerState, planDebuggerBranch, decisionLabel } from "./panels/deriveDebuggerState";
export type { DebuggerState } from "./panels/deriveDebuggerState";
export type {
  ActivityEventLike,
  ActivityPhaseKey as AgentActivityPhaseKey,
  ActivityPhaseRow as AgentActivityPhaseRow,
  ActivityPhaseState as AgentActivityPhaseState,
  PreviewTab as ActivityPreviewTab,
  RoadmapStep as ActivityRoadmapStep,
  SurfaceCommit,
  InteractionSuggestion as AgentActivityInteractionSuggestion,
  InteractionSuggestionRejectReason as AgentActivityInteractionSuggestionRejectReason,
  MergedInteractionSource as AgentActivityMergedInteractionSource,
  MergedInteractionState as AgentActivityMergedInteractionState,
  ZoomHistoryEntry as AgentActivityZoomHistoryEntry,
  DeriveAgentActivityStateParams as AgentActivityDeriveStateParams,
  StageAttachmentLike as AgentActivityStageAttachmentLike,
} from "./panels/agentActivity";

// Maia default theme
export { maiaTheme, resolveTheatreTheme } from "./theme";
export type { TheatreTheme, TheatreThemeOverride } from "./theme";

// Maia app event adapter
export { fromAgentActivityEvent, fromAgentActivityEvents } from "./adapters/fromAgentActivityEvent";
export type { AgentActivityEventLike } from "./adapters/fromAgentActivityEvent";

// Maia desktop scenes
export { EmailScene } from "./desktop-scenes/EmailScene";
export { DocsScene } from "./desktop-scenes/DocsScene";
export { SheetsScene } from "./desktop-scenes/SheetsScene";
export { BrowserScene } from "./desktop-scenes/BrowserScene";
export { ApiScene } from "./desktop-scenes/ApiScene";
export { AgentDesktopScene } from "./desktop-scenes/AgentDesktopScene";
export type { AgentDesktopSceneProps } from "./desktop-scenes/types";
export {
  asHttpUrl,
  compactValue,
  parseBrowserFindState,
  parseDocumentHighlights,
  parseHighlightRegions,
  parseLiveCopiedWords,
  parsePdfPlaybackState,
  parseScrollPercent,
  parseSemanticFindResults,
  parseSheetState,
  parseZoomHistory,
} from "./desktop-scenes/helpers";
export {
  buildRoadmapSteps,
  buildTargetRegion,
  looksLikePdfUrl,
  parseOpenedPages,
  parsePercent,
  shouldRenderTeamChatScene,
} from "./desktop-scenes/sceneRuntime";
export { useSceneAnimations } from "./desktop-scenes/useSceneAnimations";
export { useComputerUseBootstrap } from "./desktop-scenes/useComputerUseBootstrap";
export { useInteractionSceneState } from "./desktop-scenes/useInteractionSceneState";
export { sanitizeComputerUseText } from "./desktop-scenes/text";
export { TeamChatSkin } from "./desktop-scenes/team-chat/TeamChatSkin";
export type { TeamChatMessage } from "./desktop-scenes/team-chat/TeamChatSkin";
export { DocumentFallbackScene, DocumentPdfScene } from "./desktop-scenes/DocumentScenes";
export { SnapshotScene } from "./desktop-scenes/SnapshotScene";
export { DefaultScene, SystemScene } from "./desktop-scenes/SystemFallbackScenes";
export { parseApiSceneState } from "./desktop-scenes/api/api_scene_state";
export type {
  ApiFieldDiff,
  ApiSceneState,
  ApiValidationCheck,
} from "./desktop-scenes/api/api_scene_state";
export type {
  InteractionSuggestion as DesktopInteractionSuggestion,
  InteractionSuggestionRejectReason as DesktopInteractionSuggestionRejectReason,
  MergedInteractionSource as DesktopMergedInteractionSource,
  MergedInteractionState as DesktopMergedInteractionState,
} from "./desktop-scenes/interactionSuggestionMerge";
export { useComputerUseStream } from "./desktop-scenes/useComputerUseStream";
export type { UseComputerUseStreamOptions } from "./desktop-scenes/useComputerUseStream";
export type {
  DocumentHighlight,
  HighlightColor as DesktopHighlightColor,
  HighlightRegion as DesktopHighlightRegion,
  PdfPlaybackState,
  SceneAnimationState,
  ZoomHistoryEntry as DesktopZoomHistoryEntry,
} from "./desktop-scenes/types";
