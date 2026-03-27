import type { ACPDecision, ACPEvent } from "@maia/acp";
import * as MaiaBrain from "@maia/brain";

export interface DebuggerDecisionNode {
  decision: ACPDecision;
  event: ACPEvent<ACPDecision>;
  beforeEventIds: string[];
  afterEventIds: string[];
  branchable: boolean;
  branchReasons: string[];
}

export interface DebuggerBranchPlanOverride {
  agentId?: string;
  model?: string;
  chosenOptionId?: string;
  note?: string;
}

export interface DebuggerBranchPlan {
  branchId: string;
  runId: string;
  sourceDecisionId: string;
  sourceStepIndex?: number;
  status: "planned";
  summary: string;
  assumptions: string[];
  previewEventIds: string[];
  overrides: DebuggerBranchPlanOverride;
  createdAt: string;
}

export interface DebuggerState {
  runId: string;
  decisions: DebuggerDecisionNode[];
  events: ACPEvent[];
  branchPlans: DebuggerBranchPlan[];
}

function now(): string {
  return new Date().toISOString();
}

function uid(): string {
  return `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function syntheticEventId(event: ACPEvent, index: number): string {
  return `${event.run_id}_${event.sequence ?? index}_${event.event_type}`;
}

export function deriveDebuggerState(events: ACPEvent[]): DebuggerState {
  const debuggerState = MaiaBrain.buildRunDebugger(events);
  return {
    runId: debuggerState.runId,
    decisions: debuggerState.decisions.map((node) => ({
      decision: node.decision,
      event: node.event,
      beforeEventIds: node.beforeEventIds,
      afterEventIds: node.afterEventIds,
      branchable: "branchable" in node ? Boolean(node.branchable) : false,
      branchReasons: "branchReasons" in node && Array.isArray(node.branchReasons) ? node.branchReasons : [],
    })),
    events: debuggerState.events,
    branchPlans: debuggerState.branchPlans.map((plan) => ({
      branchId: plan.branchId,
      runId: plan.runId,
      sourceDecisionId: plan.sourceDecisionId,
      sourceStepIndex: plan.sourceStepIndex,
      status: plan.status,
      summary: plan.summary,
      assumptions: plan.assumptions,
      previewEventIds: plan.previewEventIds,
      overrides: {
        agentId: plan.overrides.agentId,
        model: plan.overrides.model,
        chosenOptionId: plan.overrides.chosenOptionId,
        note: plan.overrides.note,
      },
      createdAt: plan.createdAt,
    })),
  };
}

export function planDebuggerBranch(
  events: ACPEvent[],
  decisionId: string,
  overrides: DebuggerBranchPlanOverride = {},
): DebuggerBranchPlan | undefined {
  const debuggerState = deriveDebuggerState(events);
  const node = debuggerState.decisions.find((entry) => entry.decision.decision_id === decisionId);
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

  const eventIndex = events.findIndex((event) => event === node.event);

  return {
    branchId: `branch_${uid()}`,
    runId: debuggerState.runId,
    sourceDecisionId: decisionId,
    sourceStepIndex: node.decision.step_index,
    status: "planned",
    summary: `Planned branch from ${node.decision.category} decision: ${node.decision.summary}`,
    assumptions,
    previewEventIds: [
      ...node.beforeEventIds.slice(-3),
      syntheticEventId(node.event, eventIndex >= 0 ? eventIndex : node.decision.step_index ?? 0),
      ...node.afterEventIds.slice(0, 3),
    ],
    overrides,
    createdAt: now(),
  };
}

export function createDebuggerBranchPlanEvent(
  events: ACPEvent[],
  options: {
    agentId: string;
    decisionId: string;
    parentEventId?: string;
    overrides?: DebuggerBranchPlanOverride;
  },
): ACPEvent<Record<string, unknown>> | undefined {
  return MaiaBrain.createBranchPlanEvent(events, {
    agentId: options.agentId,
    sourceDecisionId: options.decisionId,
    parentEventId: options.parentEventId,
    overrides: options.overrides,
  }) as ACPEvent<Record<string, unknown>> | undefined;
}

export function decisionLabel(decision: ACPDecision): string {
  return decision.category.replace(/_/g, " ");
}
