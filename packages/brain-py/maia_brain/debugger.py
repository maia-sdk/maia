from __future__ import annotations

from copy import deepcopy
from pydantic import BaseModel, Field

from maia_acp import ACPBranchRun, ACPDecision, ACPEvent, branch_plan, branch_run, decision, envelope, message


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
    run_id: str
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
    branch_event_count: int | None = None
    replayed_source_event_count: int | None = None
    outcome_summary: str | None = None
    notes: list[str] = Field(default_factory=list)
    created_at: str


class BranchRunComparison(BaseModel):
    branch_run_id: str
    branch_id: str
    source_run_id: str
    branched_run_id: str
    source_decision_id: str | None = None
    source_decision_summary: str | None = None
    branch_decision_summary: str | None = None
    source_event_count: int
    source_tail_count: int
    branch_event_count: int
    inherited_prefix_count: int
    replayed_tail_count: int
    branch_status: str
    original_chosen_option_id: str | None = None
    branch_chosen_option_id: str | None = None
    divergence_summary: str


class BranchExecutionResult(BaseModel):
    branch_run: BranchRun
    lineage_events: list[ACPEvent] = Field(default_factory=list)
    branch_events: list[ACPEvent] = Field(default_factory=list)
    comparison: BranchRunComparison


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


class ExecuteBranchRunOptions(BaseModel):
    agent_id: str
    branch_id: str
    parent_event_id: str | None = None
    branch_run_id: str | None = None
    branched_run_id: str | None = None
    replay_source_tail: bool | None = None
    notes: list[str] = Field(default_factory=list)


def _synthetic_event_id(event: ACPEvent, index: int) -> str:
    return f"{event.run_id}_{event.sequence or index}_{event.event_type}"


def _now() -> str:
    from datetime import datetime, timezone

    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def _uid() -> str:
    import uuid

    return uuid.uuid4().hex[:12]


def _branch_reasons(decision_payload: ACPDecision) -> list[str]:
    reasons: list[str] = []
    if len(decision_payload.options) > 1:
        reasons.append("multiple options recorded")
    if decision_payload.category == "planning":
        reasons.append("plan can be rerouted")
    if decision_payload.category == "routing":
        reasons.append("agent routing can be changed")
    if decision_payload.category == "tool_selection":
        reasons.append("tool choice can be changed")
    if decision_payload.category == "source_selection":
        reasons.append("source choice can be changed")
    if decision_payload.category == "review":
        reasons.append("review outcome can be revisited")
    return reasons


def _to_branch_plan(payload: dict) -> BranchPlan:
    return BranchPlan(
        branch_id=payload["branch_id"],
        run_id=payload["run_id"],
        source_decision_id=payload["source_decision_id"],
        source_step_index=payload.get("source_step_index"),
        status=payload["status"],
        summary=payload["summary"],
        assumptions=payload.get("assumptions", []),
        preview_event_ids=payload.get("preview_event_ids", []),
        overrides=BranchPlanOverride(**payload.get("overrides", {})),
        created_at=payload["created_at"],
    )


def _to_branch_run(payload: ACPBranchRun) -> BranchRun:
    return BranchRun(
        branch_run_id=payload.branch_run_id,
        source_run_id=payload.source_run_id,
        branch_id=payload.branch_id,
        branched_run_id=payload.branched_run_id,
        status=payload.status,
        summary=payload.summary,
        requested_by_agent_id=payload.requested_by_agent_id,
        source_decision_id=payload.source_decision_id,
        source_step_index=payload.source_step_index,
        branch_event_count=payload.branch_event_count,
        replayed_source_event_count=payload.replayed_source_event_count,
        outcome_summary=payload.outcome_summary,
        notes=payload.notes,
        created_at=payload.created_at,
    )


def _clone_event_to_run(event: ACPEvent, run_id: str) -> ACPEvent:
    return envelope(
        event.agent_id,
        run_id,
        event.event_type,
        deepcopy(event.payload),
    )


def _build_branch_decision(plan: BranchPlan, source_decision: ACPDecision, branched_run_id: str) -> ACPEvent:
    fragments = []
    if plan.overrides.chosen_option_id:
        fragments.append(f"chosen option -> {plan.overrides.chosen_option_id}")
    if plan.overrides.agent_id:
        fragments.append(f"agent -> {plan.overrides.agent_id}")
    if plan.overrides.model:
        fragments.append(f"model -> {plan.overrides.model}")
    override_summary = f"Branch overrides: {', '.join(fragments)}." if fragments else None

    return envelope(
        plan.overrides.agent_id or source_decision.agent_id,
        branched_run_id,
        "decision",
        decision(
            agent_id=plan.overrides.agent_id or source_decision.agent_id,
            category=source_decision.category,
            summary=source_decision.summary,
            step_index=source_decision.step_index,
            options=[option.model_dump() for option in source_decision.options],
            chosen_option_id=plan.overrides.chosen_option_id or source_decision.chosen_option_id,
            reasoning=" ".join(part for part in [source_decision.reasoning, override_summary, plan.overrides.note] if part),
            related_event_ids=[*source_decision.related_event_ids, f"branch_plan:{plan.branch_id}"],
        ),
    )


def _create_branch_lifecycle_event(
    plan: BranchPlan,
    branch_run_id: str,
    branched_run_id: str,
    agent_id: str,
    status: str,
    summary: str,
    *,
    notes: list[str] | None = None,
    parent_event_id: str | None = None,
    branch_event_count: int | None = None,
    replayed_source_event_count: int | None = None,
    outcome_summary: str | None = None,
) -> ACPEvent:
    return envelope(
        agent_id,
        plan.run_id,
        "branch_run",
        branch_run(
            branch_run_id=branch_run_id,
            source_run_id=plan.run_id,
            branch_id=plan.branch_id,
            branched_run_id=branched_run_id,
            status=status,
            summary=summary,
            requested_by_agent_id=agent_id,
            source_decision_id=plan.source_decision_id,
            source_step_index=plan.source_step_index,
            branch_event_count=branch_event_count,
            replayed_source_event_count=replayed_source_event_count,
            outcome_summary=outcome_summary,
            notes=notes,
        ),
        parent_event_id,
    )


def build_run_debugger(events: list[ACPEvent]) -> RunDebugger:
    decorated = [
        {"event": event, "event_id": _synthetic_event_id(event, index)}
        for index, event in enumerate(events)
    ]
    decisions: list[DecisionTimelineNode] = []
    branch_plans: list[BranchPlan] = []
    latest_branch_runs: dict[str, BranchRun] = {}
    for index, item in enumerate(decorated):
        event = item["event"]
        if event.event_type == "branch_run":
            latest_branch_runs[event.payload["branch_run_id"]] = _to_branch_run(event.as_branch_run())
            continue
        if event.event_type == "branch_plan":
            branch_plans.append(_to_branch_plan(event.as_branch_plan().model_dump()))
            continue
        if event.event_type != "decision":
            continue
        payload = event.as_decision()
        reasons = _branch_reasons(payload)
        decisions.append(
            DecisionTimelineNode(
                decision=payload,
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
        branch_runs=list(latest_branch_runs.values()),
    )


def get_decision_at(events: list[ACPEvent], decision_id: str) -> DecisionTimelineNode | None:
    return next(
        (entry for entry in build_run_debugger(events).decisions if entry.decision.decision_id == decision_id),
        None,
    )


def plan_branch_from_decision(
    events: list[ACPEvent],
    source_decision_id: str,
    overrides: BranchPlanOverride | None = None,
) -> BranchPlan | None:
    debugger = build_run_debugger(events)
    node = next((entry for entry in debugger.decisions if entry.decision.decision_id == source_decision_id), None)
    if node is None or not node.branchable:
        return None

    branch_overrides = overrides or BranchPlanOverride()
    assumptions = [
        f"Replay stays anchored to decision {node.decision.decision_id}.",
        "Branch execution is not started automatically.",
        f"Current chosen option is {node.decision.chosen_option_id}."
        if node.decision.chosen_option_id
        else "No chosen option was captured for this decision.",
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

    return BranchPlan(
        branch_id=f"branch_{_uid()}",
        run_id=debugger.run_id,
        source_decision_id=source_decision_id,
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
        created_at=_now(),
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
            run_id=plan.run_id,
            source_decision_id=plan.source_decision_id,
            summary=plan.summary,
            branch_id=plan.branch_id,
            source_step_index=plan.source_step_index,
            status=plan.status,
            assumptions=plan.assumptions,
            preview_event_ids=plan.preview_event_ids,
            overrides=plan.overrides.model_dump(exclude_none=True),
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
    return _create_branch_lifecycle_event(
        plan,
        f"branch_run_{_uid()}",
        branched_run_id,
        options.agent_id,
        "created",
        f"Created branch run {branched_run_id} from {plan.branch_id}.",
        notes=options.notes,
        parent_event_id=options.parent_event_id,
    )


def compare_branch_run(events: list[ACPEvent], branch_run_id: str) -> BranchRunComparison | None:
    debugger = build_run_debugger(events)
    branch_run = next((entry for entry in debugger.branch_runs if entry.branch_run_id == branch_run_id), None)
    if branch_run is None:
        return None

    plan = next((entry for entry in debugger.branch_plans if entry.branch_id == branch_run.branch_id), None)
    source_events = [event for event in events if event.run_id == branch_run.source_run_id]
    branch_events = [event for event in events if event.run_id == branch_run.branched_run_id]
    source_decision_event = next(
        (
            event
            for event in source_events
            if event.event_type == "decision" and event.payload["decision_id"] == branch_run.source_decision_id
        ),
        None,
    )
    branch_decision_event = next((event for event in branch_events if event.event_type == "decision"), None)
    source_decision_index = source_events.index(source_decision_event) if source_decision_event in source_events else -1
    inherited_prefix_count = source_decision_index if source_decision_index >= 0 else 0
    source_tail_count = max(0, len(source_events) - source_decision_index - 1) if source_decision_index >= 0 else 0

    source_decision = source_decision_event.as_decision() if source_decision_event is not None else None
    branch_decision = branch_decision_event.as_decision() if branch_decision_event is not None else None

    return BranchRunComparison(
        branch_run_id=branch_run.branch_run_id,
        branch_id=branch_run.branch_id,
        source_run_id=branch_run.source_run_id,
        branched_run_id=branch_run.branched_run_id,
        source_decision_id=branch_run.source_decision_id,
        source_decision_summary=source_decision.summary if source_decision is not None else (plan.summary if plan else None),
        branch_decision_summary=branch_decision.summary if branch_decision is not None else None,
        source_event_count=len(source_events),
        source_tail_count=source_tail_count,
        branch_event_count=len(branch_events),
        inherited_prefix_count=inherited_prefix_count,
        replayed_tail_count=branch_run.replayed_source_event_count or 0,
        branch_status=branch_run.status,
        original_chosen_option_id=source_decision.chosen_option_id if source_decision is not None else None,
        branch_chosen_option_id=branch_decision.chosen_option_id if branch_decision is not None else None,
        divergence_summary=branch_run.outcome_summary or branch_run.summary,
    )


def execute_branch_run(
    events: list[ACPEvent],
    options: ExecuteBranchRunOptions,
) -> BranchExecutionResult | None:
    debugger = build_run_debugger(events)
    plan = next((entry for entry in debugger.branch_plans if entry.branch_id == options.branch_id), None)
    if plan is None:
        return None

    source_events = [event for event in events if event.run_id == plan.run_id]
    source_decision_event = next(
        (
            event
            for event in source_events
            if event.event_type == "decision" and event.payload["decision_id"] == plan.source_decision_id
        ),
        None,
    )
    if source_decision_event is None:
        return None

    source_decision = source_decision_event.as_decision()
    source_decision_index = source_events.index(source_decision_event)
    branch_run_id = options.branch_run_id or f"branch_run_{_uid()}"
    branched_run_id = options.branched_run_id or f"{plan.run_id}__{plan.branch_id}"
    should_replay_source_tail = options.replay_source_tail
    if should_replay_source_tail is None:
        should_replay_source_tail = not any(
            [plan.overrides.agent_id, plan.overrides.chosen_option_id, plan.overrides.model]
        )

    branch_events = [
        envelope(
            options.agent_id,
            branched_run_id,
            "message",
            message(
                from_agent=options.agent_id,
                to="agent://broadcast",
                intent="propose",
                content=f"Branch execution started from {plan.source_decision_id}.",
                thread_id=f"thread_{plan.branch_id}",
                task_id=plan.branch_id,
                task_title="Debugger branch execution",
            ),
        ),
        _build_branch_decision(plan, source_decision, branched_run_id),
    ]

    replayed_tail_count = 0
    if should_replay_source_tail:
        replay_tail = [_clone_event_to_run(event, branched_run_id) for event in source_events[source_decision_index + 1 :]]
        replayed_tail_count = len(replay_tail)
        branch_events.extend(replay_tail)
    else:
        branch_events.append(
            envelope(
                options.agent_id,
                branched_run_id,
                "message",
                message(
                    from_agent=options.agent_id,
                    to="agent://broadcast",
                    intent="summarize",
                    content="Branch diverged from the source decision. Source tail replay was skipped because overrides require re-execution.",
                    thread_id=f"thread_{plan.branch_id}",
                    task_id=plan.branch_id,
                    task_title="Debugger branch execution",
                ),
            )
        )

    branch_events.append(
        envelope(
            options.agent_id,
            branched_run_id,
            "message",
            message(
                from_agent=options.agent_id,
                to="agent://user",
                intent="summarize",
                content=(
                    f"Branch run {branched_run_id} completed by replaying {replayed_tail_count} downstream event(s)."
                    if should_replay_source_tail
                    else f"Branch run {branched_run_id} completed with an overridden decision and no downstream replay."
                ),
                thread_id=f"thread_{plan.branch_id}",
                task_id=plan.branch_id,
                task_title="Debugger branch execution",
            ),
        )
    )

    outcome_summary = (
        f"Replayed {replayed_tail_count} downstream event(s) into {branched_run_id}."
        if should_replay_source_tail
        else f"Created {branched_run_id} with a diverging branch decision and synthetic completion events."
    )

    lineage_events = [
        _create_branch_lifecycle_event(
            plan,
            branch_run_id,
            branched_run_id,
            options.agent_id,
            "created",
            f"Created branch run {branched_run_id} from {plan.branch_id}.",
            notes=options.notes,
            parent_event_id=options.parent_event_id,
        ),
        _create_branch_lifecycle_event(
            plan,
            branch_run_id,
            branched_run_id,
            options.agent_id,
            "running",
            f"Executing branch run {branched_run_id}.",
            notes=options.notes,
        ),
        _create_branch_lifecycle_event(
            plan,
            branch_run_id,
            branched_run_id,
            options.agent_id,
            "completed",
            f"Completed branch run {branched_run_id}.",
            notes=options.notes,
            branch_event_count=len(branch_events),
            replayed_source_event_count=replayed_tail_count,
            outcome_summary=outcome_summary,
        ),
    ]

    comparison = compare_branch_run([*events, *lineage_events, *branch_events], branch_run_id)
    if comparison is None:
        return None
    branch_run = next(
        entry for entry in build_run_debugger([*events, *lineage_events, *branch_events]).branch_runs if entry.branch_run_id == branch_run_id
    )
    return BranchExecutionResult(
        branch_run=branch_run,
        lineage_events=lineage_events,
        branch_events=branch_events,
        comparison=comparison,
    )