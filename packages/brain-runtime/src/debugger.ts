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
  status: "created" | "running" | "completed" | "failed";
  summary: string;
  requestedByAgentId: string;
  sourceDecisionId?: string;
  sourceStepIndex?: number;
  branchEventCount?: number;
  replayedSourceEventCount?: number;
  outcomeSummary?: string;
  notes: string[];
  createdAt: string;
}

export interface BranchRunComparison {
  branchRunId: string;
  branchId: string;
  sourceRunId: string;
  branchedRunId: string;
  sourceDecisionId?: string;
  sourceDecisionSummary?: string;
  branchDecisionSummary?: string;
  sourceEventCount: number;
  sourceTailCount: number;
  branchEventCount: number;
  inheritedPrefixCount: number;
  replayedTailCount: number;
  branchStatus: BranchRun["status"];
  originalChosenOptionId?: string;
  branchChosenOptionId?: string;
  divergenceSummary: string;
}

export interface BranchExecutionResult {
  branchRun: BranchRun;
  lineageEvents: ACPEvent<ACPBranchRunPayload>[];
  branchEvents: ACPEvent[];
  comparison: BranchRunComparison;
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

export interface ExecuteBranchRunOptions extends CreateBranchRunEventOptions {
  branchRunId?: string;
  replaySourceTail?: boolean;
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
  status: "created" | "running" | "completed" | "failed";
  summary: string;
  requested_by_agent_id: string;
  source_decision_id?: string;
  source_step_index?: number;
  branch_event_count?: number;
  replayed_source_event_count?: number;
  outcome_summary?: string;
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

function clonePayload<T>(payload: T): T {
  return JSON.parse(JSON.stringify(payload)) as T;
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

function toBranchRun(payload: ACPBranchRunPayload): BranchRun {
  return {
    branchRunId: payload.branch_run_id,
    sourceRunId: payload.source_run_id,
    branchId: payload.branch_id,
    branchedRunId: payload.branched_run_id,
    status: payload.status,
    summary: payload.summary,
    requestedByAgentId: payload.requested_by_agent_id,
    sourceDecisionId: payload.source_decision_id,
    sourceStepIndex: payload.source_step_index,
    branchEventCount: payload.branch_event_count,
    replayedSourceEventCount: payload.replayed_source_event_count,
    outcomeSummary: payload.outcome_summary,
    notes: payload.notes ?? [],
    createdAt: payload.created_at,
  };
}

function toBranchPlan(payload: ACPBranchPlanPayload): BranchPlan {
  return {
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
  };
}

function latestBranchRuns(events: ACPEvent[]): BranchRun[] {
  const latest = new Map<string, BranchRun>();
  for (const event of events) {
    if ((event.event_type as string) !== "branch_run") {
      continue;
    }
    const payload = event.payload as ACPBranchRunPayload;
    latest.set(payload.branch_run_id, toBranchRun(payload));
  }
  return [...latest.values()];
}

function cloneEventToRun(event: ACPEvent, runId: string): ACPEvent {
  return ACP.envelope(
    event.agent_id,
    runId,
    event.event_type,
    clonePayload(event.payload),
  );
}

function buildBranchDecision(plan: BranchPlan, sourceDecision: ACPDecision, branchedRunId: string): ACPEvent<ACPDecision> {
  const overrideFragments = [
    plan.overrides.chosenOptionId ? `chosen option -> ${plan.overrides.chosenOptionId}` : null,
    plan.overrides.agentId ? `agent -> ${plan.overrides.agentId}` : null,
    plan.overrides.model ? `model -> ${plan.overrides.model}` : null,
  ].filter(Boolean) as string[];
  const overrideSummary = overrideFragments.length > 0 ? `Branch overrides: ${overrideFragments.join(", ")}.` : undefined;

  return ACP.envelope(
    plan.overrides.agentId ?? sourceDecision.agent_id,
    branchedRunId,
    "decision",
    ACP.decision({
      stepIndex: sourceDecision.step_index,
      agentId: plan.overrides.agentId ?? sourceDecision.agent_id,
      category: sourceDecision.category,
      summary: sourceDecision.summary,
      options: clonePayload(sourceDecision.options ?? []),
      chosenOptionId: plan.overrides.chosenOptionId ?? sourceDecision.chosen_option_id,
      reasoning: [sourceDecision.reasoning, overrideSummary, plan.overrides.note].filter(Boolean).join(" "),
      relatedEventIds: [
        ...(sourceDecision.related_event_ids ?? []),
        `branch_plan:${plan.branchId}`,
      ],
    }),
  );
}

function createBranchLifecycleEvent(
  plan: BranchPlan,
  branchRunId: string,
  branchedRunId: string,
  agentId: string,
  status: ACPBranchRunPayload["status"],
  summary: string,
  extras: {
    notes?: string[];
    branchEventCount?: number;
    replayedSourceEventCount?: number;
    outcomeSummary?: string;
    parentEventId?: string;
  } = {},
): ACPEvent<ACPBranchRunPayload> {
  return ACP.envelope(
    agentId,
    plan.runId,
    "branch_run",
    ACP.branchRun({
      branchRunId,
      sourceRunId: plan.runId,
      branchId: plan.branchId,
      branchedRunId,
      status,
      summary,
      requestedByAgentId: agentId,
      sourceDecisionId: plan.sourceDecisionId,
      sourceStepIndex: plan.sourceStepIndex,
      branchEventCount: extras.branchEventCount,
      replayedSourceEventCount: extras.replayedSourceEventCount,
      outcomeSummary: extras.outcomeSummary,
      notes: extras.notes,
    }),
    extras.parentEventId,
  );
}

export function buildRunDebugger(events: ACPEvent[]): RunDebugger {
  const decorated = events.map((event, index) => ({
    event,
    eventId: syntheticEventId(event, index),
  }));

  const decisions: DecisionTimelineNode[] = [];
  const branchPlans: BranchPlan[] = [];

  decorated.forEach((item, index) => {
    if ((item.event.event_type as string) === "branch_plan") {
      const payload = item.event.payload as ACPBranchPlanPayload;
      branchPlans.push(toBranchPlan(payload));
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
    branchRuns: latestBranchRuns(events),
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
  return createBranchLifecycleEvent(
    plan,
    `branch_run_${uid()}`,
    branchedRunId,
    options.agentId,
    "created",
    `Created branch run ${branchedRunId} from ${plan.branchId}.`,
    {
      notes: options.notes,
      parentEventId: options.parentEventId,
    },
  );
}

export function compareBranchRun(events: ACPEvent[], branchRunId: string): BranchRunComparison | undefined {
  const debuggerState = buildRunDebugger(events);
  const branchRun = debuggerState.branchRuns.find((entry) => entry.branchRunId === branchRunId);
  if (!branchRun) {
    return undefined;
  }

  const plan = debuggerState.branchPlans.find((entry) => entry.branchId === branchRun.branchId);
  const sourceEvents = events.filter((event) => event.run_id === branchRun.sourceRunId);
  const branchEvents = events.filter((event) => event.run_id === branchRun.branchedRunId);
  const sourceDecisionEvent = sourceEvents.find(
    (event) => event.event_type === "decision" && (event.payload as ACPDecision).decision_id === branchRun.sourceDecisionId,
  ) as ACPEvent<ACPDecision> | undefined;
  const branchDecisionEvent = branchEvents.find((event) => event.event_type === "decision") as ACPEvent<ACPDecision> | undefined;
  const sourceDecisionIndex = sourceDecisionEvent ? sourceEvents.indexOf(sourceDecisionEvent) : -1;
  const inheritedPrefixCount = sourceDecisionIndex >= 0 ? sourceDecisionIndex : 0;
  const sourceTailCount = sourceDecisionIndex >= 0 ? Math.max(0, sourceEvents.length - sourceDecisionIndex - 1) : 0;

  return {
    branchRunId: branchRun.branchRunId,
    branchId: branchRun.branchId,
    sourceRunId: branchRun.sourceRunId,
    branchedRunId: branchRun.branchedRunId,
    sourceDecisionId: branchRun.sourceDecisionId,
    sourceDecisionSummary: sourceDecisionEvent?.payload.summary ?? plan?.summary,
    branchDecisionSummary: branchDecisionEvent?.payload.summary,
    sourceEventCount: sourceEvents.length,
    sourceTailCount,
    branchEventCount: branchEvents.length,
    inheritedPrefixCount,
    replayedTailCount: branchRun.replayedSourceEventCount ?? 0,
    branchStatus: branchRun.status,
    originalChosenOptionId: sourceDecisionEvent?.payload.chosen_option_id,
    branchChosenOptionId: branchDecisionEvent?.payload.chosen_option_id,
    divergenceSummary: branchRun.outcomeSummary ?? branchRun.summary,
  };
}

export function executeBranchRun(
  events: ACPEvent[],
  options: ExecuteBranchRunOptions,
): BranchExecutionResult | undefined {
  const debuggerState = buildRunDebugger(events);
  const plan = debuggerState.branchPlans.find((entry) => entry.branchId === options.branchId);
  if (!plan) {
    return undefined;
  }

  const sourceEvents = events.filter((event) => event.run_id === plan.runId);
  const sourceDecisionEvent = sourceEvents.find(
    (event) => event.event_type === "decision" && (event.payload as ACPDecision).decision_id === plan.sourceDecisionId,
  ) as ACPEvent<ACPDecision> | undefined;
  if (!sourceDecisionEvent) {
    return undefined;
  }

  const sourceDecision = sourceDecisionEvent.payload;
  const sourceDecisionIndex = sourceEvents.indexOf(sourceDecisionEvent);
  const branchRunId = options.branchRunId ?? `branch_run_${uid()}`;
  const branchedRunId = options.branchedRunId ?? `${plan.runId}__${plan.branchId}`;
  const shouldReplaySourceTail = options.replaySourceTail
    ?? (!plan.overrides.agentId && !plan.overrides.chosenOptionId && !plan.overrides.model);

  const branchEvents: ACPEvent[] = [
    ACP.envelope(
      options.agentId,
      branchedRunId,
      "message",
      ACP.message({
        from: options.agentId,
        to: "agent://broadcast",
        intent: "propose",
        content: `Branch execution started from ${plan.sourceDecisionId}.`,
        threadId: `thread_${plan.branchId}`,
        taskId: plan.branchId,
        taskTitle: "Debugger branch execution",
      }),
    ),
    buildBranchDecision(plan, sourceDecision, branchedRunId),
  ];

  let replayedTailCount = 0;
  if (shouldReplaySourceTail) {
    const replayTail = sourceEvents.slice(sourceDecisionIndex + 1).map((event) => cloneEventToRun(event, branchedRunId));
    replayedTailCount = replayTail.length;
    branchEvents.push(...replayTail);
  } else {
    branchEvents.push(
      ACP.envelope(
        options.agentId,
        branchedRunId,
        "message",
        ACP.message({
          from: options.agentId,
          to: "agent://broadcast",
          intent: "summarize",
          content: "Branch diverged from the source decision. Source tail replay was skipped because overrides require re-execution.",
          threadId: `thread_${plan.branchId}`,
          taskId: plan.branchId,
          taskTitle: "Debugger branch execution",
        }),
      ),
    );
  }

  branchEvents.push(
    ACP.envelope(
      options.agentId,
      branchedRunId,
      "message",
      ACP.message({
        from: options.agentId,
        to: "agent://user",
        intent: "summarize",
        content: shouldReplaySourceTail
          ? `Branch run ${branchedRunId} completed by replaying ${replayedTailCount} downstream event(s).`
          : `Branch run ${branchedRunId} completed with an overridden decision and no downstream replay.`,
        threadId: `thread_${plan.branchId}`,
        taskId: plan.branchId,
        taskTitle: "Debugger branch execution",
      }),
    ),
  );

  const outcomeSummary = shouldReplaySourceTail
    ? `Replayed ${replayedTailCount} downstream event(s) into ${branchedRunId}.`
    : `Created ${branchedRunId} with a diverging branch decision and synthetic completion events.`;

  const lineageEvents: ACPEvent<ACPBranchRunPayload>[] = [
    createBranchLifecycleEvent(
      plan,
      branchRunId,
      branchedRunId,
      options.agentId,
      "created",
      `Created branch run ${branchedRunId} from ${plan.branchId}.`,
      { notes: options.notes, parentEventId: options.parentEventId },
    ),
    createBranchLifecycleEvent(
      plan,
      branchRunId,
      branchedRunId,
      options.agentId,
      "running",
      `Executing branch run ${branchedRunId}.`,
      { notes: options.notes },
    ),
    createBranchLifecycleEvent(
      plan,
      branchRunId,
      branchedRunId,
      options.agentId,
      "completed",
      `Completed branch run ${branchedRunId}.`,
      {
        notes: options.notes,
        branchEventCount: branchEvents.length,
        replayedSourceEventCount: replayedTailCount,
        outcomeSummary,
      },
    ),
  ];

  const combinedEvents = [...events, ...lineageEvents, ...branchEvents];
  const comparison = compareBranchRun(combinedEvents, branchRunId);
  const branchRun = buildRunDebugger(combinedEvents).branchRuns.find((entry) => entry.branchRunId === branchRunId);
  if (!comparison || !branchRun) {
    return undefined;
  }

  return {
    branchRun,
    lineageEvents,
    branchEvents,
    comparison,
  };
}