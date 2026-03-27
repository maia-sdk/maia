from maia_acp.builders import decision, envelope
from maia_brain.debugger import (
    build_branch_graph,
    CreateBranchPlanEventOptions,
    CreateBranchRunEventOptions,
    ExecuteBranchRunOptions,
    build_run_debugger,
    compare_branch_run,
    create_branch_plan_event,
    create_branch_run_event,
    execute_branch_run,
    plan_branch_from_decision,
)


def test_build_run_debugger_marks_branchable_decisions() -> None:
    decision_payload = decision(
        agent_id="agent://brain",
        category="planning",
        summary="Use researcher then analyst.",
        options=[
            {"option_id": "plan_a", "label": "plan_a"},
            {"option_id": "plan_b", "label": "plan_b"},
        ],
        chosen_option_id="plan_a",
    )
    events = [envelope("agent://brain", "run_1", "decision", decision_payload)]

    debugger = build_run_debugger(events)

    assert len(debugger.decisions) == 1
    assert debugger.decisions[0].branchable is True
    assert "multiple options recorded" in debugger.decisions[0].branch_reasons


def test_plan_branch_from_decision_returns_plan_only_preview() -> None:
    decision_payload = decision(
        agent_id="agent://brain",
        category="routing",
        summary="Route verification to analyst.",
        options=[
            {"option_id": "analyst", "label": "analyst"},
            {"option_id": "finance", "label": "finance"},
        ],
        chosen_option_id="analyst",
    )
    events = [envelope("agent://brain", "run_1", "decision", decision_payload)]

    plan = plan_branch_from_decision(
        events,
        decision_payload["decision_id"],
    )

    assert plan is not None
    assert plan.status == "planned"
    assert plan.source_decision_id == decision_payload["decision_id"]
    assert len(plan.preview_event_ids) > 0


def test_create_branch_plan_event_persists_branch_plan() -> None:
    decision_payload = decision(
        agent_id="agent://brain",
        category="routing",
        summary="Route verification to analyst.",
        options=[
            {"option_id": "analyst", "label": "analyst"},
            {"option_id": "finance", "label": "finance"},
        ],
        chosen_option_id="analyst",
    )
    events = [envelope("agent://brain", "run_1", "decision", decision_payload)]

    branch_event = create_branch_plan_event(
        events,
        CreateBranchPlanEventOptions(
            agent_id="agent://brain",
            source_decision_id=decision_payload["decision_id"],
            overrides={"chosen_option_id": "finance"},
        ),
    )

    assert branch_event is not None
    assert branch_event.event_type == "branch_plan"

    debugger = build_run_debugger(events + [branch_event])
    assert len(debugger.branch_plans) == 1
    assert debugger.branch_plans[0].source_decision_id == decision_payload["decision_id"]


def test_create_branch_run_event_persists_branch_run() -> None:
    decision_payload = decision(
        agent_id="agent://brain",
        category="routing",
        summary="Route verification to analyst.",
        options=[
            {"option_id": "analyst", "label": "analyst"},
            {"option_id": "finance", "label": "finance"},
        ],
        chosen_option_id="analyst",
    )
    events = [envelope("agent://brain", "run_1", "decision", decision_payload)]

    branch_event = create_branch_plan_event(
        events,
        CreateBranchPlanEventOptions(
            agent_id="agent://brain",
            source_decision_id=decision_payload["decision_id"],
            overrides={"chosen_option_id": "finance"},
        ),
    )
    assert branch_event is not None

    branch_run_event = create_branch_run_event(
        events + [branch_event],
        CreateBranchRunEventOptions(
            agent_id="agent://brain",
            branch_id=branch_event.payload["branch_id"],
        ),
    )
    assert branch_run_event is not None
    assert branch_run_event.event_type == "branch_run"

    debugger = build_run_debugger(events + [branch_event, branch_run_event])
    assert len(debugger.branch_runs) == 1
    assert debugger.branch_runs[0].branch_id == branch_event.payload["branch_id"]


def test_execute_branch_run_builds_descendant_run_and_comparison() -> None:
    decision_payload = decision(
        agent_id="agent://brain",
        category="routing",
        summary="Route verification to analyst.",
        options=[
            {"option_id": "analyst", "label": "analyst"},
            {"option_id": "finance", "label": "finance"},
        ],
        chosen_option_id="analyst",
    )
    events = [envelope("agent://brain", "run_1", "decision", decision_payload)]

    branch_event = create_branch_plan_event(
        events,
        CreateBranchPlanEventOptions(
            agent_id="agent://brain",
            source_decision_id=decision_payload["decision_id"],
            overrides={"chosen_option_id": "finance"},
        ),
    )
    assert branch_event is not None

    execution = execute_branch_run(
        events + [branch_event],
        ExecuteBranchRunOptions(
            agent_id="agent://brain",
            branch_id=branch_event.payload["branch_id"],
        ),
    )
    assert execution is not None
    assert execution.branch_run.status == "completed"
    assert execution.comparison.branch_chosen_option_id == "finance"

    comparison = compare_branch_run(
        events + [branch_event] + execution.lineage_events + execution.branch_events,
        execution.branch_run.branch_run_id,
    )
    assert comparison is not None
    assert comparison.original_chosen_option_id == "analyst"
    assert comparison.branch_chosen_option_id == "finance"


def test_build_branch_graph_from_persisted_branch_records() -> None:
    decision_payload = decision(
        agent_id="agent://brain",
        category="routing",
        summary="Route verification to analyst.",
        options=[
            {"option_id": "analyst", "label": "analyst"},
            {"option_id": "finance", "label": "finance"},
        ],
        chosen_option_id="analyst",
    )
    events = [envelope("agent://brain", "run_1", "decision", decision_payload)]

    branch_event = create_branch_plan_event(
        events,
        CreateBranchPlanEventOptions(
            agent_id="agent://brain",
            source_decision_id=decision_payload["decision_id"],
            overrides={"chosen_option_id": "finance"},
        ),
    )
    assert branch_event is not None

    execution = execute_branch_run(
        events + [branch_event],
        ExecuteBranchRunOptions(
            agent_id="agent://brain",
            branch_id=branch_event.payload["branch_id"],
        ),
    )
    assert execution is not None

    graph = build_branch_graph(events + [branch_event] + execution.lineage_events + execution.branch_events)
    assert graph.root_run_id == "run_1"
    assert any(node.kind == "source_run" and node.run_id == "run_1" for node in graph.nodes)
    assert any(node.kind == "branch_plan" for node in graph.nodes)
    assert any(node.kind == "branch_run" and node.run_id == execution.branch_run.branched_run_id for node in graph.nodes)
    assert len(graph.edges) == 2
