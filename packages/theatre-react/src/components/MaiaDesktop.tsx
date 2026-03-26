import React from "react";
import { AgentHandoffRelay } from "./AgentHandoffRelay";
import { AssemblyProgressPanel, type AssemblyProgressEvent } from "./AssemblyProgressPanel";
import { BrainReviewPanel } from "./BrainReviewPanel";
import { PhaseTimeline, type ActivityPhaseRow } from "./PhaseTimeline";
import { ResearchTodoList, type RoadmapStep, type TodoEvent } from "./ResearchTodoList";

type DesktopTab = "timeline" | "conversation";

type DesktopEvent = AssemblyProgressEvent &
  TodoEvent & {
    event_id?: string;
    detail?: string;
    data?: Record<string, unknown> | null;
    metadata?: Record<string, unknown> | null;
  };

export interface MaiaDesktopProps {
  viewer: React.ReactNode;
  phaseTimeline: ActivityPhaseRow[];
  streaming: boolean;
  eventCount?: number;
  visibleEvents: DesktopEvent[];
  orderedEvents: DesktopEvent[];
  activeEvent: DesktopEvent | null;
  plannedRoadmapSteps: RoadmapStep[];
  roadmapActiveIndex: number;
  showPlanningSecondaryPanels?: boolean;
  showReplayRail?: boolean;
  theatreStage?: string;
  needsHumanReview?: boolean;
  humanReviewNotes?: string | null;
  panelTab?: DesktopTab;
  onPanelTabChange?: (tab: DesktopTab) => void;
  timelinePanel?: React.ReactNode;
  conversationPanel?: React.ReactNode;
  fullscreenOverlay?: React.ReactNode;
  approvalGate?: React.ReactNode;
}

function renderReviewNotice(theatreStage: string, needsHumanReview: boolean, humanReviewNotes?: string | null) {
  if (theatreStage !== "review" && theatreStage !== "confirm") {
    return null;
  }
  return (
    <div className="mt-3 rounded-2xl border border-[#e3e5e8] bg-white px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#7a7a83]">
        {theatreStage === "confirm" ? "Confirmation Required" : "Review Required"}
      </p>
      <p className="mt-1 text-[13px] text-[#1f2937]">
        {theatreStage === "confirm"
          ? "An irreversible action is pending. Confirm before execution continues."
          : "Review generated output before final delivery."}
      </p>
      {needsHumanReview || humanReviewNotes ? (
        <p className="mt-1 text-[12px] text-[#6b7280]">
          {String(humanReviewNotes || "Human review requested for this run.")}
        </p>
      ) : null}
    </div>
  );
}

export function MaiaDesktop({
  viewer,
  phaseTimeline,
  streaming,
  eventCount,
  visibleEvents,
  orderedEvents,
  activeEvent,
  plannedRoadmapSteps,
  roadmapActiveIndex,
  showPlanningSecondaryPanels = true,
  showReplayRail = true,
  theatreStage = "",
  needsHumanReview = false,
  humanReviewNotes = null,
  panelTab = "timeline",
  onPanelTabChange,
  timelinePanel = null,
  conversationPanel = null,
  fullscreenOverlay = null,
  approvalGate = null,
}: MaiaDesktopProps) {
  return (
    <>
      {viewer}

      {showPlanningSecondaryPanels ? (
        <PhaseTimeline phases={phaseTimeline} streaming={streaming} eventCount={eventCount} />
      ) : null}

      {showPlanningSecondaryPanels ? (
        <ResearchTodoList
          visibleEvents={visibleEvents}
          plannedRoadmapSteps={plannedRoadmapSteps}
          roadmapActiveIndex={roadmapActiveIndex}
          streaming={streaming}
        />
      ) : null}

      {showPlanningSecondaryPanels ? (
        <AssemblyProgressPanel events={orderedEvents} activeEvent={activeEvent} />
      ) : null}

      {showPlanningSecondaryPanels ? <BrainReviewPanel events={orderedEvents} /> : null}

      {renderReviewNotice(theatreStage, needsHumanReview, humanReviewNotes)}

      <AgentHandoffRelay event={activeEvent} />

      {showReplayRail && onPanelTabChange ? (
        <div className="mt-3 inline-flex rounded-full border border-[#e4e7ec] bg-white p-1">
          <button
            type="button"
            onClick={() => onPanelTabChange("timeline")}
            className={`rounded-full px-3 py-1 text-[11px] font-semibold transition ${
              panelTab === "timeline" ? "bg-[#111827] text-white" : "text-[#475467] hover:bg-[#f8fafc]"
            }`}
          >
            Timeline
          </button>
          <button
            type="button"
            onClick={() => onPanelTabChange("conversation")}
            className={`rounded-full px-3 py-1 text-[11px] font-semibold transition ${
              panelTab === "conversation" ? "bg-[#111827] text-white" : "text-[#475467] hover:bg-[#f8fafc]"
            }`}
          >
            Team conversation
          </button>
        </div>
      ) : null}

      {showReplayRail && panelTab === "timeline" ? timelinePanel : null}
      {showReplayRail && panelTab === "conversation" ? conversationPanel : null}

      {fullscreenOverlay}
      {approvalGate}
    </>
  );
}
