import type { ACPDecision, ACPEvent } from "@maia/acp";
import {
  buildBranchGraph,
  buildRunDebugger,
  compareBranchRun,
  createBranchPlanEvent,
  createBranchRunEvent,
  executeBranchRun,
} from "@maia/brain";

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

export interface DebuggerBranchRun {
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

export interface DebuggerBranchRunComparison {
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
  branchStatus: DebuggerBranchRun["status"];
  originalChosenOptionId?: string;
  branchChosenOptionId?: string;
  divergenceSummary: string;
}

export interface DebuggerBranchExecution {
  branchRun: DebuggerBranchRun;
  lineageEvents: ACPEvent[];
  branchEvents: ACPEvent[];
  comparison: DebuggerBranchRunComparison;
}

export interface DebuggerBranchGraphNode {
  nodeId: string;
  kind: "source_run" | "branch_plan" | "branch_run";
  runId?: string;
  branchId?: string;
  label: string;
  status: string;
  eventCount?: number;
  decisionCount?: number;
}

export interface DebuggerBranchGraphEdge {
  edgeId: string;
  fromNodeId: string;
  toNodeId: string;
  label: string;
}

export interface DebuggerBranchGraph {
  rootRunId: string;
  nodes: DebuggerBranchGraphNode[];
  edges: DebuggerBranchGraphEdge[];
}

export interface DebuggerState {
  runId: string;
  decisions: DebuggerDecisionNode[];
  events: ACPEvent[];
  branchPlans: DebuggerBranchPlan[];
  branchRuns: DebuggerBranchRun[];
  branchGraph: DebuggerBranchGraph;
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
  const debuggerState = buildRunDebugger(events);
  const branchGraph = buildBranchGraph(events);
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
    branchRuns: debuggerState.branchRuns.map((branchRun) => ({
      branchRunId: branchRun.branchRunId,
      sourceRunId: branchRun.sourceRunId,
      branchId: branchRun.branchId,
      branchedRunId: branchRun.branchedRunId,
      status: branchRun.status,
      summary: branchRun.summary,
      requestedByAgentId: branchRun.requestedByAgentId,
      sourceDecisionId: branchRun.sourceDecisionId,
      sourceStepIndex: branchRun.sourceStepIndex,
      branchEventCount: branchRun.branchEventCount,
      replayedSourceEventCount: branchRun.replayedSourceEventCount,
      outcomeSummary: branchRun.outcomeSummary,
      notes: branchRun.notes,
      createdAt: branchRun.createdAt,
    })),
    branchGraph: {
      rootRunId: branchGraph.rootRunId,
      nodes: branchGraph.nodes.map((node) => ({
        nodeId: node.nodeId,
        kind: node.kind,
        runId: node.runId,
        branchId: node.branchId,
        label: node.label,
        status: node.status,
        eventCount: node.eventCount,
        decisionCount: node.decisionCount,
      })),
      edges: branchGraph.edges.map((edge) => ({
        edgeId: edge.edgeId,
        fromNodeId: edge.fromNodeId,
        toNodeId: edge.toNodeId,
        label: edge.label,
      })),
    },
  };
}

export function deriveDebuggerBranchGraph(events: ACPEvent[]): DebuggerBranchGraph {
  return deriveDebuggerState(events).branchGraph;
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
  return createBranchPlanEvent(events, {
    agentId: options.agentId,
    sourceDecisionId: options.decisionId,
    parentEventId: options.parentEventId,
    overrides: options.overrides,
  }) as ACPEvent<Record<string, unknown>> | undefined;
}

export function createDebuggerBranchRunEvent(
  events: ACPEvent[],
  options: {
    agentId: string;
    branchId: string;
    parentEventId?: string;
    branchedRunId?: string;
    notes?: string[];
  },
): ACPEvent<Record<string, unknown>> | undefined {
  return createBranchRunEvent(events, {
    agentId: options.agentId,
    branchId: options.branchId,
    parentEventId: options.parentEventId,
    branchedRunId: options.branchedRunId,
    notes: options.notes,
  }) as ACPEvent<Record<string, unknown>> | undefined;
}

export function compareDebuggerBranchRun(
  events: ACPEvent[],
  branchRunId: string,
): DebuggerBranchRunComparison | undefined {
  const comparison = compareBranchRun(events, branchRunId);
  if (!comparison) {
    return undefined;
  }

  return {
    branchRunId: comparison.branchRunId,
    branchId: comparison.branchId,
    sourceRunId: comparison.sourceRunId,
    branchedRunId: comparison.branchedRunId,
    sourceDecisionId: comparison.sourceDecisionId,
    sourceDecisionSummary: comparison.sourceDecisionSummary,
    branchDecisionSummary: comparison.branchDecisionSummary,
    sourceEventCount: comparison.sourceEventCount,
    sourceTailCount: comparison.sourceTailCount,
    branchEventCount: comparison.branchEventCount,
    inheritedPrefixCount: comparison.inheritedPrefixCount,
    replayedTailCount: comparison.replayedTailCount,
    branchStatus: comparison.branchStatus,
    originalChosenOptionId: comparison.originalChosenOptionId,
    branchChosenOptionId: comparison.branchChosenOptionId,
    divergenceSummary: comparison.divergenceSummary,
  };
}

export function executeDebuggerBranchRun(
  events: ACPEvent[],
  options: {
    agentId: string;
    branchId: string;
    parentEventId?: string;
    branchRunId?: string;
    branchedRunId?: string;
    replaySourceTail?: boolean;
    notes?: string[];
  },
): DebuggerBranchExecution | undefined {
  const execution = executeBranchRun(events, {
    agentId: options.agentId,
    branchId: options.branchId,
    parentEventId: options.parentEventId,
    branchRunId: options.branchRunId,
    branchedRunId: options.branchedRunId,
    replaySourceTail: options.replaySourceTail,
    notes: options.notes,
  });
  if (!execution) {
    return undefined;
  }

  return {
    branchRun: {
      branchRunId: execution.branchRun.branchRunId,
      sourceRunId: execution.branchRun.sourceRunId,
      branchId: execution.branchRun.branchId,
      branchedRunId: execution.branchRun.branchedRunId,
      status: execution.branchRun.status,
      summary: execution.branchRun.summary,
      requestedByAgentId: execution.branchRun.requestedByAgentId,
      sourceDecisionId: execution.branchRun.sourceDecisionId,
      sourceStepIndex: execution.branchRun.sourceStepIndex,
      branchEventCount: execution.branchRun.branchEventCount,
      replayedSourceEventCount: execution.branchRun.replayedSourceEventCount,
      outcomeSummary: execution.branchRun.outcomeSummary,
      notes: execution.branchRun.notes,
      createdAt: execution.branchRun.createdAt,
    },
    lineageEvents: execution.lineageEvents as ACPEvent[],
    branchEvents: execution.branchEvents as ACPEvent[],
    comparison: {
      branchRunId: execution.comparison.branchRunId,
      branchId: execution.comparison.branchId,
      sourceRunId: execution.comparison.sourceRunId,
      branchedRunId: execution.comparison.branchedRunId,
      sourceDecisionId: execution.comparison.sourceDecisionId,
      sourceDecisionSummary: execution.comparison.sourceDecisionSummary,
      branchDecisionSummary: execution.comparison.branchDecisionSummary,
      sourceEventCount: execution.comparison.sourceEventCount,
      sourceTailCount: execution.comparison.sourceTailCount,
      branchEventCount: execution.comparison.branchEventCount,
      inheritedPrefixCount: execution.comparison.inheritedPrefixCount,
      replayedTailCount: execution.comparison.replayedTailCount,
      branchStatus: execution.comparison.branchStatus,
      originalChosenOptionId: execution.comparison.originalChosenOptionId,
      branchChosenOptionId: execution.comparison.branchChosenOptionId,
      divergenceSummary: execution.comparison.divergenceSummary,
    },
  };
}

export function decisionLabel(decision: ACPDecision): string {
  return decision.category.replace(/_/g, " ");
}
