export { eventMetadataString, findRecentMetadataString, sampleFilmstripEvents, tabForEventType } from "./activityMeta";
export type { ActivityEventLike, PreviewTab } from "./types";
export { EMAIL_SCENE_EVENT_TYPES, readEventIndex } from "./deriveHelpers";
export { desktopStatusForEventType } from "./labels";
export { readNumberField, readStringField } from "./valueReaders";
export {
  agentColorFromEvent,
  agentEventTypeFromEvent,
  agentLabelFromEvent,
  cursorFromEvent,
  cursorLabelFromSemantics,
  eventTab,
  interactionActionFromEvent,
  interactionActionPhaseFromEvent,
  interactionActionStatusFromEvent,
  isApiRuntimeEvent,
  roleColorFromKey,
  roleKeyFromEvent,
  roleLabelFromKey,
  roleNarrativeFromSemantics,
  sceneSurfaceFromEvent,
  surfaceLabelForSceneKey,
  tabForSceneSurface,
} from "./interactionSemantics";
export { deriveSurfaceCommit } from "./surfaceCommitDerivation";
export type { SurfaceCommit } from "./surfaceCommitDerivation";
