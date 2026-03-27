import { describe, expect, it } from "vitest";
import { envelope, message } from "@maia/acp";
import { buildProvenanceGraph } from "./provenance";
import { challengeClaim, resolveChallenge } from "./challenge";

describe("challenge helpers", () => {
  it("creates a structured challenge event for a claim", () => {
    const graph = buildProvenanceGraph([
      envelope("agent://researcher", "run_1", "message", message({
        from: "agent://researcher",
        to: "agent://analyst",
        intent: "propose",
        content: "The market grew 34% in 2025 according to https://example.com/report.",
      })),
    ]);
    const event = challengeClaim({
      runId: "run_1",
      claimId: graph.claims[0].claim_id,
      challenger: "agent://analyst",
      reason: "That source may be stale.",
      graph,
    });
    expect(event.event_type).toBe("challenge");
    expect(event.payload.target_agent_id).toBe("agent://researcher");
    expect(event.payload.claim_excerpt).toContain("The market grew");
  });

  it("resolves unsupported claims by retracting them", async () => {
    const challengeEvent = challengeClaim({
      runId: "run_1",
      claimId: "claim_missing",
      challenger: "agent://analyst",
      targetAgentId: "agent://researcher",
      reason: "No evidence was attached.",
    });
    const result = await resolveChallenge({
      runId: "run_1",
      challenge: challengeEvent,
    });
    expect(result.resolution.event_type).toBe("challenge_resolution");
    expect(result.resolution.payload.outcome).toBe("retracted");
  });
});
