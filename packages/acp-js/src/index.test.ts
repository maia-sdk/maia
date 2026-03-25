import { describe, it, expect } from "vitest";
import {
  ACPClient,
  message,
  handoff,
  review,
  artifact,
  activity,
  capabilities,
  envelope,
  parseSSELine,
} from "./index";

describe("builders", () => {
  it("message() sets all fields", () => {
    const m = message({ from: "agent://a", to: "agent://b", intent: "propose", content: "hello", thinking: "hmm", mood: "confident" });
    expect(m.from).toBe("agent://a");
    expect(m.intent).toBe("propose");
    expect(m.thinking).toBe("hmm");
    expect(m.mood).toBe("confident");
    expect(m.artifacts).toEqual([]);
  });

  it("handoff() accepts string task", () => {
    const h = handoff({ from: "agent://brain", to: "agent://writer", task: "Write report" });
    expect(h.task.description).toBe("Write report");
    expect(h.task.priority).toBe("normal");
  });

  it("handoff() accepts full task object", () => {
    const h = handoff({ from: "a", to: "b", task: { description: "Do it", priority: "high", constraints: ["max 500 words"] } });
    expect(h.task.priority).toBe("high");
    expect(h.task.constraints).toContain("max 500 words");
  });

  it("review() sets verdict, score, round", () => {
    const r = review({ reviewer: "a", author: "b", verdict: "revise", score: 0.75, round: 2 });
    expect(r.verdict).toBe("revise");
    expect(r.score).toBe(0.75);
    expect(r.round).toBe(2);
    expect(r.max_rounds).toBe(3);
  });

  it("artifact() generates ID with prefix", () => {
    const a = artifact({ kind: "markdown", title: "Report", content: "# Hello" });
    expect(a.artifact_id).toMatch(/^artifact_/);
    expect(a.version).toBe(1);
  });

  it("activity() sets agent and type", () => {
    const a = activity({ agentId: "agent://r", activity: "searching", detail: "Google", cost: { tokens_used: 100, cost_usd: 0.001, model: "gpt-4o" } });
    expect(a.agent_id).toBe("agent://r");
    expect(a.activity).toBe("searching");
    expect(a.cost!.tokens_used).toBe(100);
  });

  it("capabilities() sets name, role, skills", () => {
    const c = capabilities({ agentId: "agent://r", name: "Researcher", role: "research", skills: [{ skill_id: "web", description: "Search web" }] });
    expect(c.name).toBe("Researcher");
    expect(c.skills).toHaveLength(1);
  });

  it("envelope() wraps payload with metadata", () => {
    const msg = message({ from: "a", to: "b", intent: "propose", content: "hi" });
    const e = envelope("agent://a", "run_1", "message", msg);
    expect(e.acp_version).toBe("1.0");
    expect(e.run_id).toBe("run_1");
    expect(e.event_type).toBe("message");
    expect(typeof e.sequence).toBe("number");
    expect(typeof e.timestamp).toBe("string");
  });
});

describe("stream parser", () => {
  it("parses native ACP event", () => {
    const line = 'data: {"acp_version":"1.0","run_id":"r1","agent_id":"agent://a","event_type":"message","timestamp":"2026-01-01T00:00:00Z","payload":{}}';
    const e = parseSSELine(line);
    expect(e).not.toBeNull();
    expect(e!.acp_version).toBe("1.0");
    expect(e!.event_type).toBe("message");
  });

  it("wraps non-ACP JSON into envelope", () => {
    const line = 'data: {"agent":"researcher","content":"found data","run_id":"r1"}';
    const e = parseSSELine(line);
    expect(e).not.toBeNull();
    expect(e!.agent_id).toBe("agent://researcher");
  });

  it("returns null for [DONE]", () => {
    expect(parseSSELine("data: [DONE]")).toBeNull();
  });

  it("returns null for keepalive/empty", () => {
    expect(parseSSELine("")).toBeNull();
    expect(parseSSELine(": keepalive")).toBeNull();
  });

  it("returns null for invalid JSON", () => {
    expect(parseSSELine("data: not json")).toBeNull();
  });
});

describe("ACPClient", () => {
  it("creates with agentId", () => {
    const c = new ACPClient({ agentId: "agent://test" });
    expect(c.agentId).toBe("agent://test");
    expect(c.connected).toBe(false);
  });

  it("emitMessage creates envelope", () => {
    const c = new ACPClient({ agentId: "agent://test" });
    const msg = message({ from: "agent://test", to: "agent://b", intent: "propose", content: "hello" });
    const e = c.emitMessage(msg);
    expect(e.event_type).toBe("message");
    expect(e.agent_id).toBe("agent://test");
  });

  it("tracks cost across events", () => {
    const c = new ACPClient({ agentId: "agent://test" });
    (c as any)._handleEvent({ acp_version: "1.0", run_id: "r1", agent_id: "a", event_type: "event", timestamp: new Date().toISOString(), payload: { cost: { tokens_used: 100, cost_usd: 0.005 } } });
    (c as any)._handleEvent({ acp_version: "1.0", run_id: "r1", agent_id: "a", event_type: "event", timestamp: new Date().toISOString(), payload: { cost: { tokens_used: 200, cost_usd: 0.010 } } });
    const cost = c.totalCost();
    expect(cost.tokens).toBe(300);
    expect(cost.usd).toBeCloseTo(0.015);
  });

  it("filters messages()", () => {
    const c = new ACPClient({ agentId: "agent://test" });
    (c as any)._handleEvent({ acp_version: "1.0", run_id: "r1", agent_id: "a", event_type: "message", timestamp: "t", payload: {} });
    (c as any)._handleEvent({ acp_version: "1.0", run_id: "r1", agent_id: "a", event_type: "event", timestamp: "t", payload: {} });
    expect(c.messages()).toHaveLength(1);
    expect(c.events).toHaveLength(2);
  });

  it("clearBuffer empties events", () => {
    const c = new ACPClient({ agentId: "agent://test" });
    (c as any)._handleEvent({ acp_version: "1.0", run_id: "r1", agent_id: "a", event_type: "message", timestamp: "t", payload: {} });
    expect(c.events).toHaveLength(1);
    c.clearBuffer();
    expect(c.events).toHaveLength(0);
  });

  it("JSON roundtrip preserves structure", () => {
    const msg = message({ from: "a", to: "b", intent: "propose", content: "hi" });
    const e = envelope("a", "r1", "message", msg);
    const parsed = JSON.parse(JSON.stringify(e));
    expect(parsed.acp_version).toBe("1.0");
    expect(parsed.payload.content).toBe("hi");
  });
});