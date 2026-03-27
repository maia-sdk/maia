from __future__ import annotations

from pydantic import BaseModel, Field

from maia_acp import ACPBranchPlan, ACPBranchRun, ACPDecision, ACPEvent, branch_plan, branch_run, envelope


class DecisionTimelineNode(BaseModel):
    decision: ACPDecision
    event: ACPEvent
    before_event_ids: list[str] = Field(default_factory=list)
    after_event_ids: list[str] = Field(default_factory=list)
    branchable: bool = False
    branch_reasons: list[str] = Field(default_factory=list)


class BranchPlanOverride(BaseModel):
    agent_id: str | None = None
    model: str | None = None
    chosen_option_id: str | None = None
    note: str | None = None


class BranchPlan(BaseModel):
    branch_id: str
    run_id: str = ""
    source_decision_id: str
    source_step_index: int | None = None
    status: str = "planned"
    summary: str
    assumptions: list[str] = Field(default_factory=list)
    preview_event_ids: list[str] = Field(default_factory=list)
    overrides: BranchPlanOverride = Field(default_factory=BranchPlanOverride)
    created_at: str


class BranchRun(BaseModel):
    branch_run_id: str
    source_run_id: str = ""
    branch_id: str
    branched_run_id: str
    status: str = "created"
    summary: str
    requested_by_agent_id: str
    source_decision_id: str | None = None
    source_step_index: int | None = None
    notes: list[str] = Field(default_factory=list)
    created_at: str


class RunDebugger(BaseModel):
    run_id: str = ""
    decisions: list[DecisionTimelineNode] = Field(default_factory=list)
    events: list[ACPEvent] = Field(default_factory=list)
    branch_plans: list[BranchPlan] = Field(default_factory=list)
    branch_runs: list[BranchRun] = Field(default_factory=list)


class CreateBranchPlanEventOptions(BaseModel):
    agent_id: str
    source_decision_id: str
    overrides: BranchPlanOverride = Field(default_factory=BranchPlanOverride)
    parent_event_id: str | None = None


class CreateBranchRunEventOptions(BaseModel):
    agent_id: str
    branch_id: str
    parent_event_id: str | None = None
    branched_run_id: str | None = None
    notes: list[str] = Field(default_factory=list)


def _synthetic_event_id(event: ACPEvent, index: int) -> str:
    return f"{event.run_id}_{event.sequence or index}_{event.event_type}"


def _branch_reasons(decision: ACPDecision) -> list[str]:
    reasons: list[str] = []
    if len(decision.options or []) > 1:
        reasons.append("multiple options recorded")
    if decision.category == "planning":
        reasons.append("plan can be rerouted")
    if decision.category == "routing":
        reasons.append("agent routing can be changed")
    if decision.category == "tool_selection":
        reasons.append("tool choice can be changed")
    if decision.category == "source_selection":
        reasons.append("source choice can be changed")
    if decision.category == "review":
        reasons.append("review outcome can be revisited")
    return reasons


def build_run_debugger(events: list[ACPEvent]) -> RunDebugger:
    decorated = [
        {"event": event, "event_id": _synthetic_event_id(event, index)}
        for index, event in enumerate(events)
    ]
    decisions: list[DecisionTimelineNode] = []
    branch_plans: list[BranchPlan] = []
    branch_runs: list[BranchRun] = []
    for index, item in enumerate(decorated):
        event = item["event"]
        if event.event_type == "branch_run":
            payload = event.as_branch_run()
            branch_runs.append(
                BranchRun(
                    branch_run_id=payload.branch_run_id,
                    source_run_id=payload.source_run_id,
                    branch_id=payload.branch_id,
                    branched_run_id=payload.branched_run_id,
                    status=payload.status,
                    summary=payload.summary,
                    requested_by_agent_id=payload.requested_by_agent_id,
                    source_decision_id=payload.source_decision_id,
                    source_step_index=payload.source_step_index,
                    notes=payload.notes,
                    created_at=payload.created_at,
                )
            )
            continue
        if event.event_type == "branch_plan":
            payload = event.as_branch_plan()
            branch_plans.append(
                BranchPlan(
                    branch_id=payload.branch_id,
                    run_id=payload.run_id,
                    source_decision_id=payload.source_decision_id,
                    source_step_index=payload.source_step_index,
                    status=payload.status,
                    summary=payload.summary,
                    assumptions=payload.assumptions,
                    preview_event_ids=payload.preview_event_ids,
                    overrides=BranchPlanOverride(
                        agent_id=payload.overrides.agent_id,
                        model=payload.overrides.model,
                        chosen_option_id=payload.overrides.chosen_option_id,
                        note=payload.overrides.note,
                    ),
                    created_at=payload.created_at,
                )
            )
            continue
        if event.event_type != "decision":
            continue
        reasons = _branch_reasons(event.as_decision())
        decisions.append(
            DecisionTimelineNode(
                decision=event.as_decision(),
                event=event,
                before_event_ids=[entry["event_id"] for entry in decorated[:index]],
                after_event_ids=[entry["event_id"] for entry in decorated[index + 1 :]],
                branchable=bool(reasons),
                branch_reasons=reasons,
            )
        )

    return RunDebugger(
        run_id=events[-1].run_id if events else "",
        decisions=decisions,
        events=events,
        branch_plans=branch_plans,
        branch_runs=branch_runs,
    )


def get_decision_at(events: list[ACPEvent], decision_id: str) -> DecisionTimelineNode | None:
    debugger = build_run_debugger(events)
    for node in debugger.decisions:
        if node.decision.decision_id == decision_id:
            return node
    return None


def plan_branch_from_decision(
    events: list[ACPEvent],
    decision_id: str,
    overrides: BranchPlanOverride | None = None,
) -> BranchPlan | None:
    debugger = build_run_debugger(events)
    node = next((entry for entry in debugger.decisions if entry.decision.decision_id == decision_id), None)
    if node is None or not node.branchable:
        return None

    branch_overrides = overrides or BranchPlanOverride()
    assumptions = [
        f"Replay stays anchored to decision {node.decision.decision_id}.",
        "Branch execution is not started automatically.",
        (
            f"Current chosen option is {node.decision.chosen_option_id}."
            if node.decision.chosen_option_id
            else "No chosen option was captured for this decision."
        ),
    ]
    if branch_overrides.chosen_option_id:
        assumptions.append(
            f"Planned override switches chosen option to {branch_overrides.chosen_option_id}."
        )
    if branch_overrides.agent_id:
        assumptions.append(
            f"Planned override changes the acting agent to {branch_overrides.agent_id}."
        )
    if branch_overrides.model:
        assumptions.append(
            f"Planned override changes the model to {branch_overrides.model}."
        )
    if branch_overrides.note:
        assumptions.append(f"Operator note: {branch_overrides.note}")

    import uuid
    from datetime import datetime, timezone

    return BranchPlan(
        branch_id=f"branch_{uuid.uuid4().hex[:12]}",
        run_id=debugger.run_id,
        source_decision_id=decision_id,
        source_step_index=node.decision.step_index,
        status="planned",
        summary=f"Planned branch from {node.decision.category} decision: {node.decision.summary}",
        assumptions=assumptions,
        preview_event_ids=[
            *node.before_event_ids[-3:],
            _synthetic_event_id(node.event, node.decision.step_index or 0),
            *node.after_event_ids[:3],
        ],
        overrides=branch_overrides,
        created_at=datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
    )


def create_branch_plan_event(
    events: list[ACPEvent],
    options: CreateBranchPlanEventOptions,
) -> ACPEvent | None:
    plan = plan_branch_from_decision(events, options.source_decision_id, options.overrides)
    if plan is None:
        return None

    return envelope(
        options.agent_id,
        plan.run_id,
        "branch_plan",
        branch_plan(
            branch_id=plan.branch_id,
            run_id=plan.run_id,
            source_decision_id=plan.source_decision_id,
            source_step_index=plan.source_step_index,
            status=plan.status,
            summary=plan.summary,
            assumptions=plan.assumptions,
            preview_event_ids=plan.preview_event_ids,
            overrides={
                "agent_id": plan.overrides.agent_id,
                "model": plan.overrides.model,
                "chosen_option_id": plan.overrides.chosen_option_id,
                "note": plan.overrides.note,
            },
            created_at=plan.created_at,
        ),
        options.parent_event_id,
    )


def create_branch_run_event(
    events: list[ACPEvent],
    options: CreateBranchRunEventOptions,
) -> ACPEvent | None:
    debugger = build_run_debugger(events)
    plan = next((entry for entry in debugger.branch_plans if entry.branch_id == options.branch_id), None)
    if plan is None:
        return None

    branched_run_id = options.branched_run_id or f"{plan.run_id}__{plan.branch_id}"
    return envelope(
        options.agent_id,
        plan.run_id,
        "branch_run",
        branch_run(
            source_run_id=plan.run_id,
            branch_id=plan.branch_id,
            branched_run_id=branched_run_id,
            summary=f"Created branch run {branched_run_id} from {plan.branch_id}.",
            requested_by_agent_id=options.agent_id,
            source_decision_id=plan.source_decision_id,
            source_step_index=plan.source_step_index,
            notes=options.notes,
        ),
        options.parent_event_id,
    )
