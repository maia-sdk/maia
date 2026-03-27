import type { ACPDecision, ACPEvent } from "@maia/acp";

export interface DecisionTimelineNode {
  decision: ACPDecision;
  event: ACPEvent<ACPDecision>;
  beforeEventIds: string[];
  afterEventIds: string[];
  branchable: boolean;
  branchReasons: string[];
}

export interface BranchPlanOverride {
  agentId?: string;
  model?: string;
  chosenOptionId?: string;
  note?: string;
}

export interface BranchPlan {
  branchId: string;
  runId: string;
  sourceDecisionId: string;
  sourceStepIndex?: number;
  status: "planned";
  summary: string;
  assumptions: string[];
  previewEventIds: string[];
  overrides: BranchPlanOverride;
  createdAt: string;
}

export interface RunDebugger {
  runId: string;
  decisions: DecisionTimelineNode[];
  events: ACPEvent[];
  branchPlans: BranchPlan[];
}

function syntheticEventId(event: ACPEvent, index: number): string {
  return `${event.run_id}_${event.sequence ?? index}_${event.event_type}`;
}

function now(): string {
  return new Date().toISOString();
}

function uid(): string {
  return `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function getBranchReasons(decision: ACPDecision): string[] {
  const reasons: string[] = [];
  if ((decision.options?.length ?? 0) > 1) {
    reasons.push("multiple options recorded");
  }
  if (decision.category === "planning") {
    reasons.push("plan can be rerouted");
  }
  if (decision.category === "routing") {
    reasons.push("agent routing can be changed");
  }
  if (decision.category === "tool_selection") {
    reasons.push("tool choice can be changed");
  }
  if (decision.category === "source_selection") {
    reasons.push("source choice can be changed");
  }
  if (decision.category === "review") {
    reasons.push("review outcome can be revisited");
  }
  return reasons;
}

export function buildRunDebugger(events: ACPEvent[]): RunDebugger {
  const decorated = events.map((event, index) => ({
    event,
    eventId: syntheticEventId(event, index),
  }));

  const decisions: DecisionTimelineNode[] = [];
  decorated.forEach((item, index) => {
    if (item.event.event_type !== "decision") {
      return;
    }
    const payload = item.event.payload as ACPDecision;
    const branchReasons = getBranchReasons(payload);
    decisions.push({
      decision: payload,
      event: item.event as ACPEvent<ACPDecision>,
      beforeEventIds: decorated.slice(0, index).map((entry) => entry.eventId),
      afterEventIds: decorated.slice(index + 1).map((entry) => entry.eventId),
      branchable: branchReasons.length > 0,
      branchReasons,
    });
  });

  return {
    runId: events.at(-1)?.run_id ?? "",
    decisions,
    events,
    branchPlans: [],
  };
}

export function getDecisionAt(events: ACPEvent[], decisionId: string): DecisionTimelineNode | undefined {
  return buildRunDebugger(events).decisions.find((node) => node.decision.decision_id === decisionId);
}

export function planBranchFromDecision(
  events: ACPEvent[],
  sourceDecisionId: string,
  overrides: BranchPlanOverride = {},
): BranchPlan | undefined {
  const debuggerState = buildRunDebugger(events);
  const node = debuggerState.decisions.find((decision) => decision.decision.decision_id === sourceDecisionId);
  if (!node || !node.branchable) {
    return undefined;
  }

  const assumptions = [
    `Replay stays anchored to decision ${node.decision.decision_id}.`,
    "Branch execution is not started automatically.",
    node.decision.chosen_option_id
      ? `Current chosen option is ${node.decision.chosen_option_id}.`
      : "No chosen option was captured for this decision.",
  ];
  if (overrides.chosenOptionId) {
    assumptions.push(`Planned override switches chosen option to ${overrides.chosenOptionId}.`);
  }
  if (overrides.agentId) {
    assumptions.push(`Planned override changes the acting agent to ${overrides.agentId}.`);
  }
  if (overrides.model) {
    assumptions.push(`Planned override changes the model to ${overrides.model}.`);
  }
  if (overrides.note) {
    assumptions.push(`Operator note: ${overrides.note}`);
  }

  return {
    branchId: `branch_${uid()}`,
    runId: debuggerState.runId,
    sourceDecisionId,
    sourceStepIndex: node.decision.step_index,
    status: "planned",
    summary: `Planned branch from ${node.decision.category} decision: ${node.decision.summary}`,
    assumptions,
    previewEventIds: [
      ...node.beforeEventIds.slice(-3),
      syntheticEventId(node.event, node.decision.step_index ?? 0),
      ...node.afterEventIds.slice(0, 3),
    ],
    overrides,
    createdAt: now(),
  };
}
