import { describe, expect, it } from "vitest";
import { decision, envelope, message } from "@maia/acp";
import {
  buildBranchGraph,
  buildRunDebugger,
  compareBranchRun,
  createBranchPlanEvent,
  createBranchRunEvent,
  executeBranchRun,
  getDecisionAt,
  planBranchFromDecision,
} from "./debugger";

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

  it("creates and rehydrates a persisted branch run record", () => {
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

    const branchPlanEvent = createBranchPlanEvent(events, {
      agentId: "agent://brain",
      sourceDecisionId: decisionPayload.decision_id,
      overrides: { chosenOptionId: "finance" },
    });
    const branchRunEvent = createBranchRunEvent([...events, branchPlanEvent!], {
      agentId: "agent://brain",
      branchId: (branchPlanEvent!.payload as { branch_id: string }).branch_id,
    });

    expect(branchRunEvent?.event_type).toBe("branch_run");

    const debuggerState = buildRunDebugger([...events, branchPlanEvent!, branchRunEvent!]);
    expect(debuggerState.branchRuns).toHaveLength(1);
    expect(debuggerState.branchRuns[0].branchId).toBe((branchPlanEvent!.payload as { branch_id: string }).branch_id);
  });

  it("executes a branch run and derives a comparison", () => {
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
      envelope("agent://brain", "run_1", "message", message({
        from: "agent://brain",
        to: "agent://broadcast",
        intent: "propose",
        content: "Start run.",
      })),
      envelope("agent://brain", "run_1", "decision", decisionPayload),
      envelope("agent://analyst", "run_1", "message", message({
        from: "agent://analyst",
        to: "agent://brain",
        intent: "summarize",
        content: "Analysis completed.",
      })),
    ];

    const branchPlanEvent = createBranchPlanEvent(events, {
      agentId: "agent://brain",
      sourceDecisionId: decisionPayload.decision_id,
      overrides: { chosenOptionId: "finance" },
    });

    const execution = executeBranchRun([...events, branchPlanEvent!], {
      agentId: "agent://brain",
      branchId: (branchPlanEvent!.payload as { branch_id: string }).branch_id,
    });

    expect(execution).toBeDefined();
    expect(execution?.branchRun.status).toBe("completed");
    expect(execution?.branchEvents.some((event) => event.run_id === execution.branchRun.branchedRunId)).toBe(true);

    const comparison = compareBranchRun(
      [...events, branchPlanEvent!, ...execution!.lineageEvents, ...execution!.branchEvents],
      execution!.branchRun.branchRunId,
    );
    expect(comparison?.branchChosenOptionId).toBe("finance");
    expect(comparison?.originalChosenOptionId).toBe("analyst");
    expect(comparison?.branchStatus).toBe("completed");
  });

  it("builds a branch graph from persisted plans and runs", () => {
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
      envelope("agent://brain", "run_1", "message", message({
        from: "agent://brain",
        to: "agent://broadcast",
        intent: "propose",
        content: "Start run.",
      })),
      envelope("agent://brain", "run_1", "decision", decisionPayload),
    ];

    const branchPlanEvent = createBranchPlanEvent(events, {
      agentId: "agent://brain",
      sourceDecisionId: decisionPayload.decision_id,
      overrides: { chosenOptionId: "finance" },
    });
    const execution = executeBranchRun([...events, branchPlanEvent!], {
      agentId: "agent://brain",
      branchId: (branchPlanEvent!.payload as { branch_id: string }).branch_id,
    });

    const graph = buildBranchGraph([...events, branchPlanEvent!, ...execution!.lineageEvents, ...execution!.branchEvents]);
    expect(graph.rootRunId).toBe("run_1");
    expect(graph.nodes.some((node) => node.kind === "source_run" && node.runId === "run_1")).toBe(true);
    expect(graph.nodes.some((node) => node.kind === "branch_plan")).toBe(true);
    expect(graph.nodes.some((node) => node.kind === "branch_run" && node.runId === execution!.branchRun.branchedRunId)).toBe(true);
    expect(graph.edges).toHaveLength(2);
  });
});
