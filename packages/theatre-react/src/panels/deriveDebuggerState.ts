import type { ACPDecision, ACPEvent } from "@maia/acp";
import * as MaiaBrain from "@maia/brain";

export interface DebuggerState {
  runId: string;
  decisions: MaiaBrain.DecisionTimelineNode[];
  events: ACPEvent[];
}

export function deriveDebuggerState(events: ACPEvent[]): DebuggerState {
  const debuggerState = MaiaBrain.buildRunDebugger(events);
  return {
    runId: debuggerState.runId,
    decisions: debuggerState.decisions,
    events: debuggerState.events,
  };
}

export function decisionLabel(decision: ACPDecision): string {
  return decision.category.replace(/_/g, " ");
}
