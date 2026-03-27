from maia_acp.builders import decision, envelope
from maia_brain.debugger import build_run_debugger, plan_branch_from_decision


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
