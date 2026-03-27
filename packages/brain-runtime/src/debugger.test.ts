import { describe, expect, it } from "vitest";
import { decision, envelope, message } from "@maia/acp";
import { buildRunDebugger, createBranchPlanEvent, getDecisionAt, planBranchFromDecision } from "./debugger";

describe("debugger", () => {
  it("builds a decision timeline from ACP events", () => {
    const events = [
      envelope("agent://brain", "run_1", "message", message({
        from: "agent://brain",
        to: "agent://broadcast",
        intent: "propose",
        content: "Starting run.",
      })),
      envelope("agent://brain", "run_1", "decision", decision({
        agentId: "agent://brain",
        category: "planning",
        summary: "Use researcher then analyst.",
        chosenOptionId: "plan_a",
      })),
    ];

    const debuggerState = buildRunDebugger(events);
    expect(debuggerState.decisions).toHaveLength(1);
    expect(debuggerState.decisions[0].decision.category).toBe("planning");
    expect(debuggerState.decisions[0].branchable).toBe(true);
    expect(getDecisionAt(events, debuggerState.decisions[0].decision.decision_id)?.decision.summary).toContain("Use researcher");
  });

  it("creates a planned branch preview from a branchable decision", () => {
    const decisionPayload = decision({
      agentId: "agent://brain",
      category: "routing",
      summary: "Route analysis to analyst.",
      options: [
        { option_id: "analyst", label: "analyst" },
        { option_id: "finance", label: "finance" },
      ],
      chosenOptionId: "analyst",
    });
    const events = [
      envelope("agent://brain", "run_1", "decision", decisionPayload),
    ];

    const plan = planBranchFromDecision(events, decisionPayload.decision_id, {
      chosenOptionId: "finance",
      note: "Try finance-first path.",
    });

    expect(plan?.status).toBe("planned");
    expect(plan?.overrides.chosenOptionId).toBe("finance");
    expect(plan?.previewEventIds.length).toBeGreaterThan(0);
  });

  it("creates and rehydrates a persisted branch plan event", () => {
    const decisionPayload = decision({
      agentId: "agent://brain",
      category: "routing",
      summary: "Route analysis to analyst.",
      options: [
        { option_id: "analyst", label: "analyst" },
        { option_id: "finance", label: "finance" },
      ],
      chosenOptionId: "analyst",
    });
    const events = [
      envelope("agent://brain", "run_1", "decision", decisionPayload),
    ];

    const branchEvent = createBranchPlanEvent(events, {
      agentId: "agent://brain",
      sourceDecisionId: decisionPayload.decision_id,
      overrides: { chosenOptionId: "finance" },
    });

    expect(branchEvent?.event_type).toBe("branch_plan");

    const debuggerState = buildRunDebugger([...events, branchEvent!]);
    expect(debuggerState.branchPlans).toHaveLength(1);
    expect(debuggerState.branchPlans[0].sourceDecisionId).toBe(decisionPayload.decision_id);
  });
});
