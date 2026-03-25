"""Full test suite for Maia Python SDK.

Consumer-style imports: uses installed package names, not sys.path hacks.

Run with:
  pip install -e packages/acp-py -e packages/sdk-py -e packages/cli-py
  python test_sdk.py
"""
import json
import sys
import os

results = []

def test(name, fn):
    try:
        fn()
        results.append(("PASS", name))
        print(f"  PASS  {name}")
    except Exception as e:
        results.append(("FAIL", name, str(e)))
        print(f"  FAIL  {name}: {e}")

# ── Types ────────────────────────────────────────────────────────
print("\n--- Types ---")

def t1():
    from maia_acp.types import ACPEvent
    e = ACPEvent(run_id="r1", agent_id="agent://test", event_type="message", payload={"from": "agent://a", "to": "agent://b", "intent": "propose", "content": "hi"})
    assert e.acp_version == "1.0"
    assert e.event_type == "message"
test("ACPEvent creation", t1)

def t2():
    from maia_acp.types import ACPMessage
    m = ACPMessage.model_validate({"from": "agent://a", "to": "agent://b", "intent": "challenge", "content": "verify"})
    assert m.from_agent == "agent://a"
    assert m.intent == "challenge"
test("ACPMessage with from alias", t2)

def t3():
    from maia_acp.types import ACPHandoff
    h = ACPHandoff.model_validate({"from": "agent://brain", "to": "agent://writer", "task": {"description": "write"}})
    assert h.from_agent == "agent://brain"
    assert h.task.description == "write"
test("ACPHandoff with from alias", t3)

def t4():
    from maia_acp.types import ACPReview
    r = ACPReview(reviewer="agent://brain", author="agent://w", verdict="revise", score=0.75, round=2)
    assert r.verdict == "revise"
    assert r.max_rounds == 3
test("ACPReview defaults", t4)

def t5():
    from maia_acp.types import ACPActivity, ToolActivity, CostInfo
    a = ACPActivity(agent_id="agent://r", activity="searching", tool=ToolActivity(tool_id="search", status="running"), cost=CostInfo(tokens_used=100, cost_usd=0.001))
    assert a.tool.tool_id == "search"
    assert a.cost.tokens_used == 100
test("ACPActivity with tool+cost", t5)

def t6():
    from maia_acp.types import ACPCapabilities, AgentSkill, AgentPersonality
    c = ACPCapabilities(agent_id="agent://r", name="R", skills=[AgentSkill(skill_id="s", description="d")], personality=AgentPersonality(style="detailed", traits=["curious"]))
    assert c.personality.style == "detailed"
test("ACPCapabilities with personality", t6)

def t7():
    from maia_acp.types import ACPEvent
    e = ACPEvent(run_id="r1", agent_id="agent://a", event_type="message", payload={"from": "agent://a", "to": "agent://b", "intent": "propose", "content": "hello"})
    m = e.as_message()
    assert m.content == "hello"
    assert m.from_agent == "agent://a"
test("ACPEvent.as_message()", t7)

def t8():
    from maia_acp.types import ACPEvent
    e = ACPEvent(run_id="r1", agent_id="agent://brain", event_type="review", payload={"reviewer": "agent://brain", "author": "agent://w", "verdict": "approve", "score": 0.9})
    r = e.as_review()
    assert r.verdict == "approve"
    assert r.score == 0.9
test("ACPEvent.as_review()", t8)

def t9():
    from maia_acp.types import ACPEvent
    e = ACPEvent(run_id="r1", agent_id="agent://a", event_type="event", payload={"agent_id": "agent://a", "activity": "thinking"})
    a = e.as_activity()
    assert a.activity == "thinking"
test("ACPEvent.as_activity()", t9)

# ── Builders ─────────────────────────────────────────────────────
print("\n--- Builders ---")

def t10():
    from maia_acp.builders import message
    m = message(from_agent="agent://a", to="agent://b", intent="challenge", content="verify", thinking="hmm", mood="concerned")
    assert m["from"] == "agent://a"
    assert m["thinking"] == "hmm"
    assert m["mood"] == "concerned"
test("message() builder", t10)

def t11():
    from maia_acp.builders import handoff
    h = handoff(from_agent="agent://brain", to="agent://w", description="write", constraints=["max 500"], priority="high")
    assert h["task"]["priority"] == "high"
    assert h["task"]["constraints"] == ["max 500"]
test("handoff() builder", t11)

def t12():
    from maia_acp.builders import review
    r = review(reviewer="agent://brain", author="agent://w", verdict="revise", feedback="needs data", score=0.6, round=2)
    assert r["score"] == 0.6
    assert r["round"] == 2
    assert r["max_rounds"] == 3
test("review() builder", t12)

def t13():
    from maia_acp.builders import artifact
    a = artifact(kind="markdown", title="Report", content="# Hello")
    assert a["artifact_id"].startswith("artifact_")
    assert a["version"] == 1
test("artifact() builder", t13)

def t14():
    from maia_acp.builders import activity
    a = activity(agent_id="agent://r", activity_type="searching", detail="Google", cost={"tokens_used": 50, "cost_usd": 0.001})
    assert a["activity"] == "searching"
    assert a["cost"]["tokens_used"] == 50
test("activity() builder", t14)

def t15():
    from maia_acp.builders import envelope, message
    msg = message(from_agent="agent://a", to="agent://b", intent="propose", content="hi")
    e = envelope("agent://a", "run_1", "message", msg)
    assert e.acp_version == "1.0"
    assert e.run_id == "run_1"
    assert e.sequence is not None
test("envelope() builder", t15)

# ── Stream Parser ────────────────────────────────────────────────
print("\n--- Stream ---")

def t16():
    from maia_acp.stream import parse_sse_line
    line = 'data: {"acp_version":"1.0","run_id":"r1","agent_id":"agent://a","event_type":"message","timestamp":"2026-01-01T00:00:00Z","payload":{"from":"agent://a","to":"agent://b","intent":"propose","content":"hi"}}'
    e = parse_sse_line(line)
    assert e is not None
    assert e.event_type == "message"
test("parse_sse_line native ACP", t16)

def t17():
    from maia_acp.stream import parse_sse_line
    line = 'data: {"agent":"researcher","content":"found data","run_id":"r1"}'
    e = parse_sse_line(line)
    assert e is not None
    assert e.agent_id == "agent://researcher"
    assert e.event_type == "message"
test("parse_sse_line non-ACP wrapping", t17)

def t18():
    from maia_acp.stream import parse_sse_line
    assert parse_sse_line("") is None
    assert parse_sse_line("data: [DONE]") is None
    assert parse_sse_line(": keepalive") is None
    assert parse_sse_line("data: not json") is None
test("parse_sse_line edge cases", t18)

def t19():
    from maia_acp.stream import stream_events
    lines = [
        'data: {"acp_version":"1.0","run_id":"r1","agent_id":"agent://a","event_type":"message","timestamp":"2026-01-01T00:00:00Z","payload":{}}',
        '',
        'data: {"acp_version":"1.0","run_id":"r1","agent_id":"agent://b","event_type":"event","timestamp":"2026-01-01T00:00:01Z","payload":{}}',
        'data: [DONE]',
    ]
    events = list(stream_events(iter(lines)))
    assert len(events) == 2
test("stream_events generator", t19)

# ── Client ───────────────────────────────────────────────────────
print("\n--- Client ---")

def t20():
    from maia_acp.client import ACPClient
    c = ACPClient(agent_id="agent://test", name="Tester", role="qa")
    assert c.agent_id == "agent://test"
    assert c.name == "Tester"
    assert not c.connected
test("ACPClient creation", t20)

def t21():
    from maia_acp.client import ACPClient
    from maia_acp.builders import message
    c = ACPClient(agent_id="agent://test")
    e = c.emit_message(message(from_agent="agent://test", to="agent://b", intent="propose", content="hi"))
    assert e.event_type == "message"
    assert e.payload["content"] == "hi"
test("ACPClient emit_message", t21)

def t22():
    from maia_acp.client import ACPClient
    from maia_acp.types import ACPEvent
    c = ACPClient(agent_id="agent://test")
    received = []
    @c.on("message")
    def handler(event):
        received.append(event)
    c._handle_event(ACPEvent(run_id="r1", agent_id="agent://a", event_type="message", payload={}))
    c._handle_event(ACPEvent(run_id="r1", agent_id="agent://a", event_type="event", payload={}))
    assert len(received) == 1
test("ACPClient @on decorator", t22)

def t23():
    from maia_acp.client import ACPClient
    from maia_acp.types import ACPEvent
    c = ACPClient(agent_id="agent://test")
    c._handle_event(ACPEvent(run_id="r1", agent_id="agent://a", event_type="event", payload={"cost": {"tokens_used": 100, "cost_usd": 0.005}}))
    c._handle_event(ACPEvent(run_id="r1", agent_id="agent://a", event_type="event", payload={"cost": {"tokens_used": 200, "cost_usd": 0.010}}))
    cost = c.total_cost()
    assert cost["tokens"] == 300
    assert abs(cost["usd"] - 0.015) < 0.0001
test("ACPClient total_cost", t23)

def t24():
    from maia_acp.client import ACPClient
    from maia_acp.types import ACPEvent
    c = ACPClient(agent_id="agent://test")
    c._handle_event(ACPEvent(run_id="r1", agent_id="agent://a", event_type="message", payload={}))
    c._handle_event(ACPEvent(run_id="r1", agent_id="agent://b", event_type="message", payload={}))
    assert len(c.messages()) == 2
    c.clear_buffer()
    assert len(c.events) == 0
test("ACPClient buffer + clear", t24)

# ── SDK Bundle ───────────────────────────────────────────────────
print("\n--- SDK Bundle ---")

def t25():
    from maia_sdk import ACPEvent, ACPClient, message, handoff, review, envelope, connect_sse
    assert ACPEvent is not None
    assert ACPClient is not None
test("maia_sdk re-exports", t25)

def t26():
    import maia_sdk
    assert maia_sdk.__version__ == "0.1.0"
test("maia_sdk version", t26)

# ── CLI ──────────────────────────────────────────────────────────
print("\n--- CLI ---")

def t27():
    from maia_cli.render import render_event
    event = {"event_type": "message", "agent_id": "agent://researcher", "timestamp": "2026-01-01T10:30:00Z", "payload": {"from": "agent://researcher", "to": "agent://analyst", "intent": "challenge", "content": "Verify this"}}
    out = render_event(event)
    assert "researcher" in out
    assert "challenge" in out
test("CLI render message", t27)

def t28():
    from maia_cli.render import render_event
    event = {"event_type": "event", "agent_id": "agent://r", "timestamp": "2026-01-01T10:30:00Z", "payload": {"agent_id": "agent://r", "activity": "searching", "detail": "Google"}}
    out = render_event(event)
    assert "searching" in out
test("CLI render activity", t28)

def t29():
    from maia_cli.render import render_event
    event = {"event_type": "review", "agent_id": "agent://brain", "timestamp": "2026-01-01T10:30:00Z", "payload": {"reviewer": "agent://brain", "author": "agent://w", "verdict": "approve"}}
    out = render_event(event)
    assert "approve" in out
test("CLI render review", t29)

def t30():
    from maia_cli.render import render_event
    event = {"event_type": "capabilities", "agent_id": "agent://r", "timestamp": "2026-01-01T10:30:00Z", "payload": {"agent_id": "agent://r", "name": "Researcher", "role": "research", "skills": []}}
    out = render_event(event)
    assert "Researcher" in out
    assert "joined" in out
test("CLI render capabilities", t30)

# ── Serialization ────────────────────────────────────────────────
print("\n--- Serialization ---")

def t31():
    from maia_acp.types import ACPEvent
    e = ACPEvent(run_id="r1", agent_id="agent://a", event_type="message", payload={"content": "hello"})
    j = e.model_dump_json()
    e2 = ACPEvent.model_validate_json(j)
    assert e2.payload["content"] == "hello"
test("ACPEvent JSON roundtrip", t31)

def t32():
    from maia_acp.types import ACPMessage
    m = ACPMessage.model_validate({"from": "agent://a", "to": "agent://b", "intent": "propose", "content": "hi"})
    j = m.model_dump_json(by_alias=True)
    parsed = json.loads(j)
    assert parsed["from"] == "agent://a"
    assert "from_agent" not in parsed
test("ACPMessage JSON alias", t32)

def t33():
    from maia_acp.types import ACPHandoff
    h = ACPHandoff.model_validate({"from": "agent://brain", "to": "agent://w", "task": {"description": "write"}})
    j = h.model_dump_json(by_alias=True)
    parsed = json.loads(j)
    assert parsed["from"] == "agent://brain"
test("ACPHandoff JSON alias", t33)

# ── Summary ──────────────────────────────────────────────────────
print("\n" + "=" * 60)
passed = sum(1 for r in results if r[0] == "PASS")
failed = sum(1 for r in results if r[0] == "FAIL")
print(f"RESULTS: {passed} passed, {failed} failed, {len(results)} total")
print("=" * 60)
if failed:
    print("\nFAILURES:")
    for r in results:
        if r[0] == "FAIL":
            print(f"  - {r[1]}: {r[2]}")
    sys.exit(1)