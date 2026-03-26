import {
  eventMetadataString,
  findRecentMetadataString,
  sampleFilmstripEvents,
} from "./activityMeta";
import {
  resolveBrowserUrl,
  resolveDocBodyHint,
  resolveEmailBodyHint,
  resolveEmailRecipient,
  resolveEmailSubject,
  resolveSheetBodyHint,
} from "./contentDerivation";
import { EMAIL_SCENE_EVENT_TYPES, readEventIndex } from "./deriveHelpers";
import { mergeLiveSceneData } from "./liveSceneData";
import { desktopStatusForEventType } from "./labels";
import { derivePlannedRoadmap } from "./roadmapDerivation";
import {
  extractSuggestionLayer,
  isInteractionSuggestionEvent,
  suggestionLookupKeyForEvent,
  type InteractionSuggestion,
} from "./interactionSuggestionMerge";
import { phaseForEvent } from "./phaseRouting";
import { deriveSurfaceCommit } from "./surfaceCommitDerivation";
import type { ActivityEventLike, PreviewTab } from "./types";
import { readNumberField, readStringField } from "./valueReaders";
import {
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
  roleKeyFromEvent,
  roleLabelFromKey,
  roleNarrativeFromSemantics,
  sceneSurfaceFromEvent,
  surfaceLabelForSceneKey,
  tabForSceneSurface,
} from "./interactionSemantics";

type StageAttachmentLike = {
  fileId?: string;
  name?: string;
};

type DeriveAgentActivityStateParams = {
  events: ActivityEventLike[];
  cursor: number;
  previewTab: PreviewTab;
  stageAttachment?: StageAttachmentLike;
  snapshotFailedEventId: string;
  streaming: boolean;
  resolveSceneSnapshotUrl?: (
    sceneEvent: ActivityEventLike | null,
    visibleEvents: ActivityEventLike[],
  ) => string;
  resolveStageFileUrl?: (fileId: string) => string;
};

function isConversationOnlySceneSignal(event: ActivityEventLike | null): boolean {
  if (!event) {
    return false;
  }
  const normalizedType = String(event.event_type || "").trim().toLowerCase();
  const sceneSurface = String(event.data?.["scene_surface"] ?? event.metadata?.["scene_surface"] ?? "")
    .trim()
    .toLowerCase();
  const sceneFamily = String(event.data?.["scene_family"] ?? event.metadata?.["scene_family"] ?? "")
    .trim()
    .toLowerCase();
  return (
    normalizedType === "team_chat_message" ||
    sceneSurface === "team_chat" ||
    sceneFamily === "chat"
  );
}

function deriveAgentActivityState({
  events,
  cursor,
  previewTab,
  stageAttachment,
  snapshotFailedEventId,
  streaming,
  resolveSceneSnapshotUrl,
  resolveStageFileUrl,
}: DeriveAgentActivityStateParams) {
  const interactionSuggestionLayer = extractSuggestionLayer(events);
  const primaryEvents = events.filter((event) => !isInteractionSuggestionEvent(event));
  const orderedEvents = [...primaryEvents]
    .map((event, index) => ({ event, index }))
    .sort((left, right) => {
      const leftEventIndex = readEventIndex(left.event, left.index + 1);
      const rightEventIndex = readEventIndex(right.event, right.index + 1);
      if (leftEventIndex !== rightEventIndex) {
        return leftEventIndex - rightEventIndex;
      }
      const leftSeq =
        typeof left.event.seq === "number" && Number.isFinite(left.event.seq)
          ? left.event.seq
          : Number.NaN;
      const rightSeq =
        typeof right.event.seq === "number" && Number.isFinite(right.event.seq)
          ? right.event.seq
          : Number.NaN;
      if (Number.isFinite(leftSeq) && Number.isFinite(rightSeq) && leftSeq !== rightSeq) {
        return leftSeq - rightSeq;
      }
      const leftTs = Date.parse(left.event.timestamp || left.event.ts || "");
      const rightTs = Date.parse(right.event.timestamp || right.event.ts || "");
      if (Number.isFinite(leftTs) && Number.isFinite(rightTs) && leftTs !== rightTs) {
        return leftTs - rightTs;
      }
      return left.index - right.index;
    })
    .map((item) => item.event);

  const safeCursor = Math.min(Math.max(0, cursor), Math.max(orderedEvents.length - 1, 0));
  const visibleEvents = orderedEvents.slice(0, safeCursor + 1);
  const filmstripEvents = sampleFilmstripEvents(orderedEvents, safeCursor);
  const activeEvent = orderedEvents[safeCursor] || null;
  const activeSuggestion: InteractionSuggestion[] | null = (() => {
    const key = suggestionLookupKeyForEvent(activeEvent);
    return key ? interactionSuggestionLayer.get(key) || null : null;
  })();
  const activeStepIndex = readNumberField(
    activeEvent?.metadata?.["step_index"] ??
      activeEvent?.data?.["step_index"] ??
      activeEvent?.metadata?.["event_index"] ??
      activeEvent?.data?.["event_index"],
  );
  const activeTab = eventTab(activeEvent);

  const sceneEvent = (() => {
    if (!activeEvent) {
      return null;
    }
    const activeIsConversationOnly = isConversationOnlySceneSignal(activeEvent);
    const hasDirectSceneSignal =
      !activeIsConversationOnly &&
      (Boolean(String(activeEvent.data?.["scene_surface"] ?? activeEvent.metadata?.["scene_surface"] ?? "").trim()) ||
        Boolean(String(activeEvent.data?.["scene_family"] ?? activeEvent.metadata?.["scene_family"] ?? "").trim()) ||
        Boolean(String(activeEvent.data?.["ui_target"] ?? activeEvent.metadata?.["ui_target"] ?? "").trim()));
    if (hasDirectSceneSignal) {
      return activeEvent;
    }
    const activeEventTab = eventTab(activeEvent);
    if (!activeIsConversationOnly && (activeEventTab !== "system" || isApiRuntimeEvent(activeEvent))) {
      return activeEvent;
    }
    for (let idx = visibleEvents.length - 1; idx >= 0; idx -= 1) {
      const candidate = visibleEvents[idx];
      if (isConversationOnlySceneSignal(candidate)) {
        continue;
      }
      if (eventTab(candidate) !== "system" || isApiRuntimeEvent(candidate)) {
        return candidate;
      }
    }
    return activeEvent;
  })();

  const sceneTab = eventTab(sceneEvent || activeEvent);
  const activePhase = phaseForEvent(activeEvent);
  const progressPercent =
    orderedEvents.length <= 1
      ? 100
      : Math.round((safeCursor / (orderedEvents.length - 1)) * 100);

  const browserEvents = visibleEvents.filter((event) => eventTab(event) === "browser");
  const documentEvents = visibleEvents.filter((event) => eventTab(event) === "document");
  const emailEvents = visibleEvents.filter((event) => eventTab(event) === "email");
  const systemEvents = visibleEvents.filter((event) => eventTab(event) === "system");

  const derivedFileId =
    stageAttachment?.fileId ||
    eventMetadataString(sceneEvent, "file_id") ||
    findRecentMetadataString(orderedEvents, "file_id");
  const derivedFileName =
    stageAttachment?.name ||
    eventMetadataString(sceneEvent, "file_name") ||
    eventMetadataString(sceneEvent, "document_name") ||
    findRecentMetadataString(orderedEvents, "file_name") ||
    findRecentMetadataString(orderedEvents, "document_name") ||
    "";

  const stageFileName = derivedFileName || "Working document";
  const isPdfStage = /\.pdf$/i.test(stageFileName);
  const stageFileUrl = derivedFileId && resolveStageFileUrl ? resolveStageFileUrl(derivedFileId) : "";
  const canRenderPdfFrame = Boolean(isPdfStage && stageFileUrl);

  const mergedSceneData = mergeLiveSceneData(visibleEvents, activeEvent);

  const sceneEventType = String(sceneEvent?.event_type || activeEvent?.event_type || "").toLowerCase();
  const isBrowserScene = previewTab === "browser";
  const hasEmailSceneSignal = visibleEvents.some((event) => {
    const eventType = String(event.event_type || "").toLowerCase();
    return EMAIL_SCENE_EVENT_TYPES.has(eventType) || tabForSceneSurface(sceneSurfaceFromEvent(event)) === "email";
  });
  const isEmailScene = previewTab === "email" && hasEmailSceneSignal;
  const isDocumentScene = previewTab === "document";
  const isSystemScene = previewTab === "system";
  const isApiScene = isApiRuntimeEvent(sceneEvent || activeEvent);

  const currentSceneSourceUrl =
    readStringField(sceneEvent?.data?.["source_url"]) ||
    readStringField(sceneEvent?.metadata?.["source_url"]) ||
    readStringField(sceneEvent?.data?.["url"]) ||
    readStringField(sceneEvent?.metadata?.["url"]);
  const sceneDocumentUrl =
    readStringField(sceneEvent?.data?.["document_url"]) ||
    readStringField(sceneEvent?.metadata?.["document_url"]) ||
    (currentSceneSourceUrl.includes("docs.google.com/document/") ? currentSceneSourceUrl : "");
  const sceneSpreadsheetUrl =
    readStringField(sceneEvent?.data?.["spreadsheet_url"]) ||
    readStringField(sceneEvent?.metadata?.["spreadsheet_url"]) ||
    (currentSceneSourceUrl.includes("docs.google.com/spreadsheets/") ? currentSceneSourceUrl : "");

  const hasSpreadsheetUrlSignal =
    sceneSpreadsheetUrl.length > 0 ||
    currentSceneSourceUrl.includes("docs.google.com/spreadsheets/");
  const hasDocumentUrlSignal =
    sceneDocumentUrl.length > 0 ||
    currentSceneSourceUrl.includes("docs.google.com/document/");
  const sceneSurface = sceneSurfaceFromEvent(sceneEvent).toLowerCase();
  const sceneShadowFlagRaw = sceneEvent?.data?.["shadow"] ?? sceneEvent?.metadata?.["shadow"];
  const isSceneShadowEvent =
    typeof sceneShadowFlagRaw === "boolean"
      ? sceneShadowFlagRaw
      : ["true", "1", "yes"].includes(String(sceneShadowFlagRaw ?? "").trim().toLowerCase());
  const isSheetsScene =
    isDocumentScene &&
    (sceneEventType.startsWith("sheet_") ||
      sceneEventType.startsWith("sheets.") ||
      sceneEventType === "drive.go_to_sheet" ||
      sceneSurface === "google_sheets" ||
      hasSpreadsheetUrlSignal);

  const mergedPdfPage = readNumberField(mergedSceneData["pdf_page"]);
  const mergedPdfTotal = readNumberField(mergedSceneData["pdf_total_pages"]);
  const hasPdfEventSignal = sceneEventType.startsWith("pdf_");
  const hasPdfDataSignal = mergedPdfPage !== null || mergedPdfTotal !== null;
  const isPdfScene =
    isDocumentScene &&
    canRenderPdfFrame &&
    !isSheetsScene &&
    !hasDocumentUrlSignal &&
    (hasPdfEventSignal || hasPdfDataSignal || !sceneSpreadsheetUrl);

  const docsExplicitlyRequested = (() => {
    for (let idx = visibleEvents.length - 1; idx >= 0; idx -= 1) {
      const event = visibleEvents[idx];
      const eventType = String(event.event_type || "").toLowerCase();
      if (eventType === "llm.task_contract_completed") {
        const requiredActions = Array.isArray(event.metadata?.["required_actions"])
          ? event.metadata["required_actions"]
          : Array.isArray(event.data?.["required_actions"])
            ? event.data["required_actions"]
            : [];
        if (requiredActions.some((item) => String(item || "").trim().toLowerCase() === "create_document")) {
          return true;
        }
      }
      if (eventType === "llm.intent_tags") {
        const tags = Array.isArray(event.metadata?.["intent_tags"])
          ? event.metadata["intent_tags"]
          : Array.isArray(event.data?.["intent_tags"])
            ? event.data["intent_tags"]
            : [];
        if (tags.some((item) => String(item || "").trim().toLowerCase() === "docs_write")) {
          return true;
        }
      }
    }
    return false;
  })();

  const hasDocsEventSignal =
    !isSceneShadowEvent &&
    (sceneEventType.startsWith("doc_") ||
      sceneEventType.startsWith("docs.") ||
      sceneEventType === "drive.go_to_doc") &&
    (sceneSurface === "google_docs" || sceneSurface === "docs" || hasDocumentUrlSignal);
  const isDocsScene =
    isDocumentScene && !isSheetsScene && !isPdfScene && hasDocsEventSignal && docsExplicitlyRequested;

  const sceneSurfaceKey = isBrowserScene
    ? "website"
    : isSheetsScene
      ? "google_sheets"
      : isPdfScene
        ? "document"
      : isDocsScene
        ? "google_docs"
        : isEmailScene
          ? "email"
          : isApiScene
            ? "api"
            : isSystemScene
              ? "system"
              : "workspace";
  const sceneSurfaceLabel = surfaceLabelForSceneKey(sceneSurfaceKey);

  const snapshotUrl = resolveSceneSnapshotUrl ? resolveSceneSnapshotUrl(sceneEvent, visibleEvents) : "";
  const effectiveSnapshotUrl =
    sceneEvent && snapshotFailedEventId === sceneEvent.event_id ? "" : snapshotUrl;

  const browserUrl = resolveBrowserUrl(visibleEvents);
  const surfaceCommit = deriveSurfaceCommit(visibleEvents);
  const emailRecipient = resolveEmailRecipient(visibleEvents);
  const emailSubject = resolveEmailSubject(visibleEvents);
  const emailBodyHint = resolveEmailBodyHint(visibleEvents);
  const docBodyHint = resolveDocBodyHint(visibleEvents);
  const sheetBodyHint = resolveSheetBodyHint(visibleEvents);
  const desktopStatus = desktopStatusForEventType(activeEvent?.event_type || "", streaming);

  const activeRoleKey =
    roleKeyFromEvent(sceneEvent) ||
    roleKeyFromEvent(activeEvent) ||
    roleKeyFromEvent(visibleEvents[visibleEvents.length - 1] || null);
  const activeRoleLabel =
    agentLabelFromEvent(sceneEvent) ||
    agentLabelFromEvent(activeEvent) ||
    roleLabelFromKey(activeRoleKey) ||
    "Agent";
  const activeRoleColor =
    agentColorFromEvent(sceneEvent) ||
    agentColorFromEvent(activeEvent) ||
    "#6b7280";
  const agentEventType =
    agentEventTypeFromEvent(sceneEvent) ||
    agentEventTypeFromEvent(activeEvent) ||
    "";

  const interactionAction =
    interactionActionFromEvent(sceneEvent) || interactionActionFromEvent(activeEvent);
  const interactionActionPhase =
    interactionActionPhaseFromEvent(sceneEvent) || interactionActionPhaseFromEvent(activeEvent);
  const interactionActionStatus =
    interactionActionStatusFromEvent(sceneEvent) || interactionActionStatusFromEvent(activeEvent);

  const cursorLabel = cursorLabelFromSemantics({
    action: interactionAction,
    actionStatus: interactionActionStatus,
    actionPhase: interactionActionPhase,
    sceneSurfaceLabel,
    roleLabel: activeRoleLabel,
    agentEventType,
  });

  const roleNarrative = roleNarrativeFromSemantics({
    roleLabel: activeRoleLabel,
    action: interactionAction,
    sceneSurfaceLabel,
    fallback: sceneEvent?.title || activeEvent?.title || "working",
    agentEventType,
  });

  const eventCursor = cursorFromEvent(activeEvent) || cursorFromEvent(sceneEvent);
  const { plannedRoadmapSteps, roadmapActiveIndex } = derivePlannedRoadmap(visibleEvents);

  return {
    activeEvent,
    activeRoleKey,
    activeRoleLabel,
    activeRoleColor,
    activePhase,
    activeSuggestion,
    activeStepIndex,
    activeTab,
    browserEvents,
    browserUrl,
    canRenderPdfFrame,
    cursorLabel,
    desktopStatus,
    docBodyHint,
    documentEvents,
    effectiveSnapshotUrl,
    emailBodyHint,
    emailEvents,
    emailRecipient,
    emailSubject,
    eventCursor,
    filmstripEvents,
    interactionAction,
    interactionActionPhase,
    interactionActionStatus,
    isApiScene,
    isBrowserScene,
    isDocsScene,
    isDocumentScene,
    isEmailScene,
    isPdfScene,
    isSheetsScene,
    isSystemScene,
    mergedSceneData,
    orderedEvents,
    plannedRoadmapSteps,
    progressPercent,
    roadmapActiveIndex,
    roleNarrative,
    safeCursor,
    sceneDocumentUrl,
    sceneEvent,
    sceneSpreadsheetUrl,
    sceneSurfaceKey,
    sceneSurfaceLabel,
    sceneTab,
    sheetBodyHint,
    stageFileName,
    stageFileUrl,
    surfaceCommit,
    systemEvents,
    visibleEvents,
  };
}

export { deriveAgentActivityState, isConversationOnlySceneSignal };
export type { DeriveAgentActivityStateParams, StageAttachmentLike };
