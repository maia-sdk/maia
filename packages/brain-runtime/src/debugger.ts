import type { ACPDecision, ACPEvent } from "@maia/acp";

export interface DecisionTimelineNode {
  decision: ACPDecision;
  event: ACPEvent<ACPDecision>;
  beforeEventIds: string[];
  afterEventIds: string[];
}

export interface RunDebugger {
  runId: string;
  decisions: DecisionTimelineNode[];
  events: ACPEvent[];
}

function syntheticEventId(event: ACPEvent, index: number): string {
  return `${event.run_id}_${event.sequence ?? index}_${event.event_type}`;
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
    decisions.push({
      decision: payload,
      event: item.event as ACPEvent<ACPDecision>,
      beforeEventIds: decorated.slice(0, index).map((entry) => entry.eventId),
      afterEventIds: decorated.slice(index + 1).map((entry) => entry.eventId),
    });
  });

  return {
    runId: events.at(-1)?.run_id ?? "",
    decisions,
    events,
  };
}

export function getDecisionAt(events: ACPEvent[], decisionId: string): DecisionTimelineNode | undefined {
  return buildRunDebugger(events).decisions.find((node) => node.decision.decision_id === decisionId);
}
