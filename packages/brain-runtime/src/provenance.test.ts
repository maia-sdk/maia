import { describe, expect, it } from "vitest";
import { envelope, message } from "@maia/acp";
import { buildProvenanceGraph, detectContradictions, staleClaims } from "./provenance";

describe("provenance", () => {
  it("derives claims from ACP message events", () => {
    const events = [
      envelope("agent://researcher", "run_1", "message", message({
        from: "agent://researcher",
        to: "agent://analyst",
        intent: "clarify",
        content: "The market grew 34% in 2025 according to https://example.com/report. We should cite that figure carefully.",
        threadId: "thread_1",
      })),
    ];

    const graph = buildProvenanceGraph(events);
    expect(graph.claims.length).toBeGreaterThan(0);
    expect(graph.claims[0].source_refs.length).toBeGreaterThan(0);
    expect(["verified", "supported", "inferred"]).toContain(graph.claims[0].tier);
  });

  it("detects numeric contradictions with the same semantic template", () => {
    const graph = buildProvenanceGraph([
      envelope("agent://researcher", "run_1", "message", message({
        from: "agent://researcher",
        to: "agent://analyst",
        intent: "clarify",
        content: "The market grew 34% in 2025 according to https://example.com/a.",
      })),
      envelope("agent://analyst", "run_1", "message", message({
        from: "agent://analyst",
        to: "agent://researcher",
        intent: "challenge",
        content: "The market grew 22% in 2025 according to https://example.com/b.",
      })),
    ]);

    expect(graph.contradictions.length).toBe(1);
    expect(graph.claims.some((claim) => claim.contradicts.length > 0)).toBe(true);
    expect(detectContradictions(graph.claims).length).toBeGreaterThan(0);
  });

  it("flags stale claims using source timestamps", () => {
    const graph = {
      graph_id: "graph_1",
      run_id: "run_1",
      claims: [
        {
          claim_id: "claim_1",
          text: "A stale claim.",
          agent_id: "agent://researcher",
          tier: "supported" as const,
          confidence: 0.6,
          source_refs: [
            {
              source_id: "url_1",
              kind: "url" as const,
              accessed_at: "2020-01-01T00:00:00.000Z",
            },
          ],
          supports: [],
          contradicts: [],
        },
      ],
      contradictions: [],
    };

    expect(staleClaims(graph, 90)).toHaveLength(1);
  });
});
