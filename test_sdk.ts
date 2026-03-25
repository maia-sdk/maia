/**
 * Full test suite for Maia TypeScript SDK.
 *
 * Consumer-style imports: these reference package names, not source paths,
 * so the test validates the same import surface that end-users see.
 *
 * Run with:  npm run build && npx tsx test_sdk.ts
 *   (build first so workspace resolution + dist artifacts exist)
 * Or with source paths via tsconfig paths if using --no-build dev mode.
 */

// Consumer-style imports via workspace package names
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
  streamToACPEvents,
} from "@maia/acp";

import type {
  ACPEvent,
  ACPMessage,
  ACPHandoff,
  ACPReview,
  ACPArtifact,
  ACPActivity,
  ACPCapabilities,
  MessageIntent,
  ReviewVerdict,
  ActivityType,
  ArtifactKind,
  AgentMood,
  CostInfo,
} from "@maia/acp";

let passed = 0;
let failed = 0;
const failures: string[] = [];

function test(name: string, fn: () => void) {
  try {
    fn();
    passed++;
    console.log(`  PASS  ${name}`);
  } catch (e: any) {
    failed++;
    const msg = e?.message ?? String(e);
    failures.push(`${name}: ${msg}`);
    console.log(`  FAIL  ${name}: ${msg}`);
  }
}

function assert(condition: boolean, msg = "assertion failed") {
  if (!condition) throw new Error(msg);
}

function assertEq(a: any, b: any, msg = "") {
  if (a !== b) throw new Error(`${msg} expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`);
}

// ── Builders ────────────────────────────────────────────────────
console.log("\n--- Builders ---");

test("message() builder", () => {
  const m = message({
    from: "agent://researcher",
    to: "agent://analyst",
    intent: "challenge",
    content: "Verify this data",
    thinking: "The number seems high",
    mood: "concerned",
    threadId: "t1",
    inReplyTo: "prev_1",
  });
  assertEq(m.from, "agent://researcher");
  assertEq(m.to, "agent://analyst");
  assertEq(m.intent, "challenge");
  assertEq(m.content, "Verify this data");
  assertEq(m.thinking, "The number seems high");
  assertEq(m.mood, "concerned");
  assertEq(m.context?.thread_id, "t1");
  assertEq(m.context?.in_reply_to, "prev_1");
  assert(Array.isArray(m.artifacts), "artifacts should be array");
});

test("message() defaults", () => {
  const m = message({ from: "agent://a", to: "agent://b", intent: "propose", content: "hi" });
  assertEq(m.thinking, undefined);
  assertEq(m.mood, undefined);
  assert(m.artifacts!.length === 0, "default artifacts should be empty");
});

test("handoff() with string task", () => {
  const h = handoff({ from: "agent://brain", to: "agent://writer", task: "Write the report" });
  assertEq(h.from, "agent://brain");
  assertEq(h.to, "agent://writer");
  assertEq(h.task.description, "Write the report");
  assertEq(h.task.priority, "normal");
});

test("handoff() with full task object", () => {
  const h = handoff({
    from: "agent://brain",
    to: "agent://writer",
    task: { description: "Write report", constraints: ["max 500 words"], definition_of_done: "Client-ready", deadline_seconds: 60, priority: "high" },
    context: { prior: "data" },
  });
  assertEq(h.task.priority, "high");
  assertEq(h.task.constraints![0], "max 500 words");
  assertEq(h.context?.prior, "data");
});

test("review() builder", () => {
  const r = review({
    reviewer: "agent://brain",
    author: "agent://writer",
    verdict: "revise",
    feedback: "Missing segment data",
    score: 0.75,
    revisionInstructions: "Add Enterprise vs SMB split",
    strengths: ["Clear writing"],
    issues: [{ severity: "major", description: "Missing data" }],
    round: 2,
  });
  assertEq(r.verdict, "revise");
  assertEq(r.score, 0.75);
  assertEq(r.round, 2);
  assertEq(r.max_rounds, 3);
  assertEq(r.strengths![0], "Clear writing");
  assertEq(r.issues![0].severity, "major");
});

test("artifact() builder", () => {
  const a = artifact({ kind: "markdown", title: "Q4 Report", content: "# Report" });
  assert(a.artifact_id.startsWith("artifact_"), "should have artifact_ prefix");
  assertEq(a.kind, "markdown");
  assertEq(a.title, "Q4 Report");
  assertEq(a.version, 1);
});

test("activity() builder", () => {
  const a = activity({
    agentId: "agent://researcher",
    activity: "searching",
    detail: "Google search for pricing data",
    cost: { tokens_used: 100, cost_usd: 0.001, model: "gpt-4o" },
  });
  assertEq(a.agent_id, "agent://researcher");
  assertEq(a.activity, "searching");
  assertEq(a.cost!.tokens_used, 100);
});

test("capabilities() builder", () => {
  const c = capabilities({
    agentId: "agent://researcher",
    name: "Researcher",
    role: "research",
    personality: { style: "detailed", traits: ["curious"], avatar_color: "#3B82F6", avatar_emoji: "\uD83D\uDD0D" },
    skills: [{ skill_id: "web_search", description: "Search the web" }],
    connectors: ["brave_search"],
  });
  assertEq(c.name, "Researcher");
  assertEq(c.role, "research");
  assertEq(c.personality!.style, "detailed");
  assertEq(c.skills.length, 1);
  assertEq(c.connectors![0], "brave_search");
});

test("envelope() builder", () => {
  const msg = message({ from: "agent://a", to: "agent://b", intent: "propose", content: "hello" });
  const e = envelope("agent://a", "run_1", "message", msg);
  assertEq(e.acp_version, "1.0");
  assertEq(e.run_id, "run_1");
  assertEq(e.agent_id, "agent://a");
  assertEq(e.event_type, "message");
  assert(typeof e.sequence === "number", "should have sequence");
  assert(typeof e.timestamp === "string", "should have timestamp");
  assertEq((e.payload as any).content, "hello");
});

// ── Stream Parser ───────────────────────────────────────────────
console.log("\n--- Stream Parser ---");

test("parseSSELine — native ACP event", () => {
  const line = 'data: {"acp_version":"1.0","run_id":"r1","agent_id":"agent://a","event_type":"message","timestamp":"2026-01-01T00:00:00Z","payload":{"from":"agent://a","to":"agent://b","intent":"propose","content":"hi"}}';
  const e = parseSSELine(line);
  assert(e !== null, "should parse");
  assertEq(e!.acp_version, "1.0");
  assertEq(e!.event_type, "message");
});

test("parseSSELine — non-ACP wrapping", () => {
  const line = 'data: {"agent":"researcher","content":"found data","run_id":"r1"}';
  const e = parseSSELine(line);
  assert(e !== null, "should wrap");
  assertEq(e!.agent_id, "agent://researcher");
  assertEq(e!.event_type, "message");
});

test("parseSSELine — [DONE]", () => {
  assertEq(parseSSELine("data: [DONE]"), null);
});

test("parseSSELine — empty/keepalive", () => {
  assertEq(parseSSELine(""), null);
  assertEq(parseSSELine(": keepalive"), null);
  assertEq(parseSSELine("event: ping"), null);
});

test("parseSSELine — invalid JSON", () => {
  assertEq(parseSSELine("data: not json"), null);
});

test("parseSSELine — tool call wrapping", () => {
  const line = 'data: {"tool_call":{"name":"search"},"agent_id":"agent://r"}';
  const e = parseSSELine(line);
  assert(e !== null, "should wrap tool call");
  assertEq(e!.event_type, "event");
});

// ── Client ──────────────────────────────────────────────────────
console.log("\n--- Client ---");

test("ACPClient creation", () => {
  const c = new ACPClient({ agentId: "agent://test" });
  assertEq(c.agentId, "agent://test");
  assertEq(c.name, "test");
  assertEq(c.connected, false);
});

test("ACPClient creation with options", () => {
  const c = new ACPClient({ agentId: "agent://researcher", name: "Researcher", role: "research" });
  assertEq(c.name, "Researcher");
  assertEq(c.role, "research");
});

test("ACPClient emitMessage", () => {
  const c = new ACPClient({ agentId: "agent://test" });
  const msg = message({ from: "agent://test", to: "agent://b", intent: "propose", content: "hello" });
  const e = c.emitMessage(msg);
  assertEq(e.agent_id, "agent://test");
  assertEq(e.event_type, "message");
  assertEq((e.payload as any).content, "hello");
});

test("ACPClient emitHandoff", () => {
  const c = new ACPClient({ agentId: "agent://brain" });
  const h = handoff({ from: "agent://brain", to: "agent://w", task: "write" });
  const e = c.emitHandoff(h);
  assertEq(e.event_type, "handoff");
});

test("ACPClient emitReview", () => {
  const c = new ACPClient({ agentId: "agent://brain" });
  const r = review({ reviewer: "agent://brain", author: "agent://w", verdict: "approve" });
  const e = c.emitReview(r);
  assertEq(e.event_type, "review");
});

test("ACPClient emitActivity", () => {
  const c = new ACPClient({ agentId: "agent://r" });
  const a = activity({ agentId: "agent://r", activity: "searching", detail: "Google" });
  const e = c.emitActivity(a);
  assertEq(e.event_type, "event");
});

test("ACPClient on/off event listeners", () => {
  const c = new ACPClient({ agentId: "agent://test" });
  const received: ACPEvent[] = [];
  const unsub = c.on("message", (e) => received.push(e));

  // Simulate events via private _handleEvent
  (c as any)._handleEvent({ acp_version: "1.0", run_id: "r1", agent_id: "agent://a", event_type: "message", timestamp: new Date().toISOString(), payload: {} });
  (c as any)._handleEvent({ acp_version: "1.0", run_id: "r1", agent_id: "agent://a", event_type: "event", timestamp: new Date().toISOString(), payload: {} });

  assertEq(received.length, 1, "should only get message events");

  unsub();
  (c as any)._handleEvent({ acp_version: "1.0", run_id: "r1", agent_id: "agent://a", event_type: "message", timestamp: new Date().toISOString(), payload: {} });
  assertEq(received.length, 1, "should not get events after unsub");
});

test("ACPClient wildcard listener", () => {
  const c = new ACPClient({ agentId: "agent://test" });
  const received: ACPEvent[] = [];
  c.on("*", (e) => received.push(e));

  (c as any)._handleEvent({ acp_version: "1.0", run_id: "r1", agent_id: "agent://a", event_type: "message", timestamp: new Date().toISOString(), payload: {} });
  (c as any)._handleEvent({ acp_version: "1.0", run_id: "r1", agent_id: "agent://a", event_type: "event", timestamp: new Date().toISOString(), payload: {} });
  (c as any)._handleEvent({ acp_version: "1.0", run_id: "r1", agent_id: "agent://a", event_type: "review", timestamp: new Date().toISOString(), payload: {} });

  assertEq(received.length, 3, "wildcard should catch all");
});

test("ACPClient messages() filter", () => {
  const c = new ACPClient({ agentId: "agent://test" });
  (c as any)._handleEvent({ acp_version: "1.0", run_id: "r1", agent_id: "agent://a", event_type: "message", timestamp: "2026-01-01T00:00:00Z", sequence: 1, payload: {} });
  (c as any)._handleEvent({ acp_version: "1.0", run_id: "r1", agent_id: "agent://a", event_type: "event", timestamp: "2026-01-01T00:00:01Z", sequence: 2, payload: {} });
  (c as any)._handleEvent({ acp_version: "1.0", run_id: "r1", agent_id: "agent://b", event_type: "message", timestamp: "2026-01-01T00:00:02Z", sequence: 3, payload: {} });

  assertEq(c.messages().length, 2);
  assertEq(c.events.length, 3);
});

test("ACPClient totalCost", () => {
  const c = new ACPClient({ agentId: "agent://test" });
  (c as any)._handleEvent({ acp_version: "1.0", run_id: "r1", agent_id: "agent://a", event_type: "event", timestamp: new Date().toISOString(), payload: { cost: { tokens_used: 100, cost_usd: 0.005 } } });
  (c as any)._handleEvent({ acp_version: "1.0", run_id: "r1", agent_id: "agent://a", event_type: "event", timestamp: new Date().toISOString(), payload: { cost: { tokens_used: 200, cost_usd: 0.010 } } });

  const cost = c.totalCost();
  assertEq(cost.tokens, 300);
  assert(Math.abs(cost.usd - 0.015) < 0.0001, "cost should be 0.015");
});

test("ACPClient threads()", () => {
  const c = new ACPClient({ agentId: "agent://test" });
  (c as any)._handleEvent({ acp_version: "1.0", run_id: "r1", agent_id: "agent://a", event_type: "message", timestamp: new Date().toISOString(), payload: { from: "agent://a", to: "agent://b", intent: "propose", content: "hi", context: { thread_id: "t1" } } });
  (c as any)._handleEvent({ acp_version: "1.0", run_id: "r1", agent_id: "agent://b", event_type: "message", timestamp: new Date().toISOString(), payload: { from: "agent://b", to: "agent://a", intent: "agree", content: "ok", context: { thread_id: "t1" } } });
  (c as any)._handleEvent({ acp_version: "1.0", run_id: "r1", agent_id: "agent://c", event_type: "message", timestamp: new Date().toISOString(), payload: { from: "agent://c", to: "agent://a", intent: "propose", content: "other", context: { thread_id: "t2" } } });

  const threads = c.threads();
  assertEq(threads.size, 2);
  assertEq(threads.get("t1")!.length, 2);
  assertEq(threads.get("t2")!.length, 1);
});

test("ACPClient clearBuffer", () => {
  const c = new ACPClient({ agentId: "agent://test" });
  (c as any)._handleEvent({ acp_version: "1.0", run_id: "r1", agent_id: "agent://a", event_type: "message", timestamp: new Date().toISOString(), payload: {} });
  assertEq(c.events.length, 1);
  c.clearBuffer();
  assertEq(c.events.length, 0);
});

test("ACPClient runId tracking", () => {
  const c = new ACPClient({ agentId: "agent://test" });
  assertEq(c.runId, "");
  (c as any)._handleEvent({ acp_version: "1.0", run_id: "run_abc", agent_id: "agent://a", event_type: "message", timestamp: new Date().toISOString(), payload: {} });
  assertEq(c.runId, "run_abc");
});

// ── Type Safety ─────────────────────────────────────────────────
console.log("\n--- Type Safety ---");

test("MessageIntent type values", () => {
  const intents: MessageIntent[] = ["propose", "challenge", "clarify", "review", "handoff", "summarize", "agree", "escalate"];
  assertEq(intents.length, 8);
});

test("ReviewVerdict type values", () => {
  const verdicts: ReviewVerdict[] = ["approve", "revise", "reject", "escalate"];
  assertEq(verdicts.length, 4);
});

test("ActivityType type values", () => {
  const types: ActivityType[] = ["thinking", "searching", "reading", "writing", "browsing", "coding", "analyzing", "tool_calling", "waiting", "reviewing", "idle", "error"];
  assertEq(types.length, 12);
});

test("ArtifactKind type values", () => {
  const kinds: ArtifactKind[] = ["text", "markdown", "json", "csv", "html", "code", "image", "pdf", "url", "binary"];
  assertEq(kinds.length, 10);
});

test("AgentMood type values", () => {
  const moods: AgentMood[] = ["neutral", "confident", "uncertain", "excited", "concerned", "focused"];
  assertEq(moods.length, 6);
});

// ── JSON Serialization ──────────────────────────────────────────
console.log("\n--- Serialization ---");

test("envelope JSON roundtrip", () => {
  const msg = message({ from: "agent://a", to: "agent://b", intent: "propose", content: "hello" });
  const e = envelope("agent://a", "run_1", "message", msg);
  const json = JSON.stringify(e);
  const parsed = JSON.parse(json);
  assertEq(parsed.acp_version, "1.0");
  assertEq(parsed.run_id, "run_1");
  assertEq(parsed.payload.content, "hello");
});

test("all builders produce valid JSON", () => {
  const items = [
    message({ from: "a", to: "b", intent: "propose", content: "c" }),
    handoff({ from: "a", to: "b", task: "do it" }),
    review({ reviewer: "a", author: "b", verdict: "approve" }),
    artifact({ kind: "text", title: "t", content: "c" }),
    activity({ agentId: "a", activity: "thinking" }),
    capabilities({ agentId: "a", name: "A", skills: [] }),
  ];
  for (const item of items) {
    const json = JSON.stringify(item);
    const parsed = JSON.parse(json);
    assert(typeof parsed === "object", "should be parseable object");
  }
});

// ── Summary ─────────────────────────────────────────────────────
console.log("\n" + "=".repeat(60));
console.log(`RESULTS: ${passed} passed, ${failed} failed, ${passed + failed} total`);
console.log("=".repeat(60));

if (failures.length > 0) {
  console.log("\nFAILURES:");
  for (const f of failures) console.log(`  - ${f}`);
  process.exit(1);
}