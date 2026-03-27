import type { ACPEvent, ACPDecision } from "@maia/acp";
import * as ACP from "@maia/acp";

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

export interface BranchRun {
  branchRunId: string;
  sourceRunId: string;
  branchId: string;
  branchedRunId: string;
  status: "created";
  summary: string;
  requestedByAgentId: string;
  sourceDecisionId?: string;
  sourceStepIndex?: number;
  notes: string[];
  createdAt: string;
}

export interface RunDebugger {
  runId: string;
  decisions: DecisionTimelineNode[];
  events: ACPEvent[];
  branchPlans: BranchPlan[];
  branchRuns: BranchRun[];
}

export interface CreateBranchPlanEventOptions {
  agentId: string;
  sourceDecisionId: string;
  overrides?: BranchPlanOverride;
  parentEventId?: string;
}

export interface CreateBranchRunEventOptions {
  agentId: string;
  branchId: string;
  parentEventId?: string;
  branchedRunId?: string;
  notes?: string[];
}

interface ACPBranchPlanPayload {
  branch_id: string;
  run_id: string;
  source_decision_id: string;
  source_step_index?: number;
  status: "planned";
  summary: string;
  assumptions: string[];
  preview_event_ids: string[];
  overrides: {
    agent_id?: string;
    model?: string;
    chosen_option_id?: string;
    note?: string;
  };
  created_at: string;
}

interface ACPBranchRunPayload {
  branch_run_id: string;
  source_run_id: string;
  branch_id: string;
  branched_run_id: string;
  status: "created";
  summary: string;
  requested_by_agent_id: string;
  source_decision_id?: string;
  source_step_index?: number;
  notes?: string[];
  created_at: string;
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
  const branchPlans: BranchPlan[] = [];
  const branchRuns: BranchRun[] = [];
  decorated.forEach((item, index) => {
    if ((item.event.event_type as string) === "branch_run") {
      const payload = item.event.payload as ACPBranchRunPayload;
      branchRuns.push({
        branchRunId: payload.branch_run_id,
        sourceRunId: payload.source_run_id,
        branchId: payload.branch_id,
        branchedRunId: payload.branched_run_id,
        status: payload.status,
        summary: payload.summary,
        requestedByAgentId: payload.requested_by_agent_id,
        sourceDecisionId: payload.source_decision_id,
        sourceStepIndex: payload.source_step_index,
        notes: payload.notes ?? [],
        createdAt: payload.created_at,
      });
      return;
    }
    if ((item.event.event_type as string) === "branch_plan") {
      const payload = item.event.payload as ACPBranchPlanPayload;
      branchPlans.push({
        branchId: payload.branch_id,
        runId: payload.run_id,
        sourceDecisionId: payload.source_decision_id,
        sourceStepIndex: payload.source_step_index,
        status: payload.status,
        summary: payload.summary,
        assumptions: payload.assumptions,
        previewEventIds: payload.preview_event_ids,
        overrides: {
          agentId: payload.overrides.agent_id,
          model: payload.overrides.model,
          chosenOptionId: payload.overrides.chosen_option_id,
          note: payload.overrides.note,
        },
        createdAt: payload.created_at,
      });
      return;
    }
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
    branchPlans,
    branchRuns,
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

export function createBranchPlanEvent(
  events: ACPEvent[],
  options: CreateBranchPlanEventOptions,
): ACPEvent<ACPBranchPlanPayload> | undefined {
  const plan = planBranchFromDecision(events, options.sourceDecisionId, options.overrides);
  if (!plan) {
    return undefined;
  }

  return ACP.envelope(
    options.agentId,
    plan.runId,
    "branch_plan",
    {
      branch_id: plan.branchId,
      run_id: plan.runId,
      source_decision_id: plan.sourceDecisionId,
      source_step_index: plan.sourceStepIndex,
      status: plan.status,
      summary: plan.summary,
      assumptions: plan.assumptions,
      preview_event_ids: plan.previewEventIds,
      overrides: {
        agent_id: plan.overrides.agentId,
        model: plan.overrides.model,
        chosen_option_id: plan.overrides.chosenOptionId,
        note: plan.overrides.note,
      },
      created_at: plan.createdAt,
    },
    options.parentEventId,
  );
}

export function createBranchRunEvent(
  events: ACPEvent[],
  options: CreateBranchRunEventOptions,
): ACPEvent<ACPBranchRunPayload> | undefined {
  const debuggerState = buildRunDebugger(events);
  const plan = debuggerState.branchPlans.find((entry) => entry.branchId === options.branchId);
  if (!plan) {
    return undefined;
  }

  const branchedRunId = options.branchedRunId ?? `${plan.runId}__${plan.branchId}`;
  return ACP.envelope(
    options.agentId,
    plan.runId,
    "branch_run",
    {
      branch_run_id: `branch_run_${uid()}`,
      source_run_id: plan.runId,
      branch_id: plan.branchId,
      branched_run_id: branchedRunId,
      status: "created",
      summary: `Created branch run ${branchedRunId} from ${plan.branchId}.`,
      requested_by_agent_id: options.agentId,
      source_decision_id: plan.sourceDecisionId,
      source_step_index: plan.sourceStepIndex,
      notes: options.notes ?? [],
      created_at: now(),
    },
    options.parentEventId,
  );
}
