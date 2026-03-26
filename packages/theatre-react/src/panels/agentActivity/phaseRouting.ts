import type { ActivityEventLike } from "./types";

const PHASE_ORDER = [
  "understanding",
  "contract",
  "clarification",
  "planning",
  "execution",
  "verification",
  "delivery",
] as const;

type ActivityPhaseKey = (typeof PHASE_ORDER)[number];
type ActivityPhaseState = "pending" | "active" | "completed";

type ActivityPhaseRow = {
  key: ActivityPhaseKey;
  label: string;
  state: ActivityPhaseState;
  latestEventId: string;
  latestEventTitle: string;
};

const PHASE_LABELS: Record<ActivityPhaseKey, string> = {
  understanding: "Understanding your request",
  contract: "Confirming scope",
  clarification: "Waiting for your input",
  planning: "Planning the approach",
  execution: "Doing the work",
  verification: "Checking quality",
  delivery: "Delivering result",
};

function normalizeToken(value: unknown): string {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^\w.-]+/g, "_");
}

function humanizeEventLabel(event: ActivityEventLike | null): string {
  if (!event) {
    return "";
  }
  const rawType = String(event.event_type || "").trim();
  const rawTitle = String(event.title || "").trim();
  const primary = rawTitle || rawType;
  if (!primary) {
    return "";
  }
  let text = primary;
  const normalizedTitle = normalizeToken(rawTitle);
  const normalizedType = normalizeToken(rawType);
  if (!rawTitle || (normalizedTitle && normalizedTitle === normalizedType)) {
    text = rawType;
  }

  text = text
    .replace(/[._-]+/g, " ")
    .replace(/\bllm\b/gi, "Brain")
    .replace(/\bassembly\b/gi, "team setup")
    .replace(/\bpreflight\b/gi, "readiness check")
    .replace(/\bworkflow\b/gi, "workflow")
    .replace(/\bverification\b/gi, "quality review")
    .replace(/\bstarted\b/gi, "started")
    .replace(/\bcompleted\b/gi, "completed")
    .replace(/\s+/g, " ")
    .trim();

  return text ? `${text.charAt(0).toUpperCase()}${text.slice(1)}` : "";
}

function mapStageTokenToPhase(token: string): ActivityPhaseKey | null {
  const normalized = normalizeToken(token);
  if (!normalized) {
    return null;
  }
  if (normalized.includes("understand") || normalized.includes("preflight")) return "understanding";
  if (normalized.includes("contract")) return "contract";
  if (normalized.includes("clarif")) return "clarification";
  if (normalized.includes("plan") || normalized.includes("assembly")) return "planning";
  if (normalized.includes("exec") || normalized.includes("run") || normalized.includes("work")) return "execution";
  if (normalized.includes("verif") || normalized.includes("review") || normalized.includes("approve") || normalized.includes("qa")) return "verification";
  if (normalized.includes("deliver") || normalized.includes("final") || normalized.includes("publish")) return "delivery";
  if (normalized === "workflow") return "execution";
  return null;
}

function extractPhaseCandidates(event: ActivityEventLike): string[] {
  return [
    event.stage,
    event.data?.["stage"],
    event.metadata?.["stage"],
    event.data?.["action_phase"],
    event.metadata?.["action_phase"],
    event.event_family,
    event.data?.["event_family"],
    event.metadata?.["event_family"],
    event.event_type,
    event.type,
    event.title,
  ]
    .map((value) => normalizeToken(value))
    .filter(Boolean);
}

function phaseForEvent(event: ActivityEventLike | null): ActivityPhaseKey | null {
  if (!event) {
    return null;
  }
  if (normalizeToken(event.event_type || event.type) === "interaction_suggestion") {
    return null;
  }
  for (const candidate of extractPhaseCandidates(event)) {
    const phase = mapStageTokenToPhase(candidate);
    if (phase) {
      return phase;
    }
  }
  return null;
}

function derivePhaseTimeline(
  visibleEvents: ActivityEventLike[],
  activeEvent: ActivityEventLike | null,
): ActivityPhaseRow[] {
  const activePhaseRaw = phaseForEvent(activeEvent);
  const hasClarificationSignals =
    activePhaseRaw === "clarification" ||
    visibleEvents.some((event) => phaseForEvent(event) === "clarification");
  const phaseOrder = hasClarificationSignals
    ? PHASE_ORDER
    : PHASE_ORDER.filter((phase): phase is ActivityPhaseKey => phase !== "clarification");

  const latestByPhase: Record<ActivityPhaseKey, ActivityEventLike | null> = {
    understanding: null,
    contract: null,
    clarification: null,
    planning: null,
    execution: null,
    verification: null,
    delivery: null,
  };

  for (const event of visibleEvents) {
    const phase = phaseForEvent(event);
    if (phase) {
      latestByPhase[phase] = event;
    }
  }

  let furthestSeenPhaseIndex = -1;
  for (let index = 0; index < phaseOrder.length; index += 1) {
    if (latestByPhase[phaseOrder[index]]) {
      furthestSeenPhaseIndex = index;
    }
  }
  const activePhaseIndex = Math.max(
    activePhaseRaw ? phaseOrder.indexOf(activePhaseRaw) : -1,
    furthestSeenPhaseIndex,
  );
  const activePhase =
    activePhaseIndex >= 0 && activePhaseIndex < phaseOrder.length ? phaseOrder[activePhaseIndex] : null;

  return phaseOrder.map((phase) => {
    const latest = latestByPhase[phase];
    let state: ActivityPhaseState = latest ? "completed" : "pending";
    if (activePhase === phase) {
      state = "active";
    }
    return {
      key: phase,
      label: PHASE_LABELS[phase],
      state,
      latestEventId: String(latest?.event_id || ""),
      latestEventTitle: humanizeEventLabel(latest),
    };
  });
}

export { derivePhaseTimeline, phaseForEvent };
export type { ActivityPhaseKey, ActivityPhaseRow, ActivityPhaseState };
