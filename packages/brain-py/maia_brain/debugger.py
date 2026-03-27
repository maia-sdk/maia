from __future__ import annotations

from pydantic import BaseModel, Field

from maia_acp import ACPDecision, ACPEvent


class DecisionTimelineNode(BaseModel):
    decision: ACPDecision
    event: ACPEvent
    before_event_ids: list[str] = Field(default_factory=list)
    after_event_ids: list[str] = Field(default_factory=list)


class RunDebugger(BaseModel):
    run_id: str = ""
    decisions: list[DecisionTimelineNode] = Field(default_factory=list)
    events: list[ACPEvent] = Field(default_factory=list)


def _synthetic_event_id(event: ACPEvent, index: int) -> str:
    return f"{event.run_id}_{event.sequence or index}_{event.event_type}"


def build_run_debugger(events: list[ACPEvent]) -> RunDebugger:
    decorated = [
        {"event": event, "event_id": _synthetic_event_id(event, index)}
        for index, event in enumerate(events)
    ]
    decisions: list[DecisionTimelineNode] = []
    for index, item in enumerate(decorated):
        event = item["event"]
        if event.event_type != "decision":
            continue
        decisions.append(
            DecisionTimelineNode(
                decision=event.as_decision(),
                event=event,
                before_event_ids=[entry["event_id"] for entry in decorated[:index]],
                after_event_ids=[entry["event_id"] for entry in decorated[index + 1 :]],
            )
        )

    return RunDebugger(
        run_id=events[-1].run_id if events else "",
        decisions=decisions,
        events=events,
    )


def get_decision_at(events: list[ACPEvent], decision_id: str) -> DecisionTimelineNode | None:
    debugger = build_run_debugger(events)
    for node in debugger.decisions:
        if node.decision.decision_id == decision_id:
            return node
    return None
