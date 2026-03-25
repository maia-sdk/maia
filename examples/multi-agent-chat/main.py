"""
Multi-Agent Chat — pure Python, no LLM key needed.
====================================================
Simulates a 4-agent collaboration using only maia-acp.
Outputs ACP events that can be replayed in Theatre + TeamChat.

Usage:
    pip install maia-acp
    python main.py
"""

import json
import time

from maia_acp import envelope, message, handoff, review, activity, capabilities, artifact

RUN_ID = "multi_chat_001"


def emit(event):
    """Print and save an ACP event."""
    d = event.model_dump() if hasattr(event, "model_dump") else vars(event)
    etype = d.get("event_type", "?")
    agent = d.get("agent_id", "").split("://")[-1]
    payload = d.get("payload", {})

    if etype == "capabilities":
        print(f"  [+] {payload.get('name', '')} joined")
    elif etype == "message":
        src = payload.get("from", "").split("://")[-1]
        print(f"  [{src}] {payload.get('content', '')[:100]}")
    elif etype == "handoff":
        src = payload.get("from", "").split("://")[-1]
        dst = payload.get("to", "").split("://")[-1]
        print(f"  [handoff] {src} → {dst}")
    elif etype == "event":
        print(f"  [{payload.get('activity', '')}] {payload.get('detail', '')[:80]}")
    elif etype == "review":
        print(f"  [review] {payload.get('verdict', '')} ({payload.get('score', '')}) — {payload.get('feedback', '')[:60]}")
    elif etype == "artifact":
        print(f"  [artifact] {payload.get('title', '')}")

    with open("events.jsonl", "a") as f:
        f.write(json.dumps(d) + "\n")


print("=" * 60)
print("Multi-Agent Chat Demo (no LLM needed)")
print("=" * 60)
print()

# ── 1. Agents announce capabilities ─────────────────────────────────────────

agents = [
    ("agent://pm", "Project Manager", "project_manager"),
    ("agent://researcher", "Researcher", "researcher"),
    ("agent://analyst", "Analyst", "analyst"),
    ("agent://writer", "Writer", "writer"),
]

for aid, name, role in agents:
    emit(envelope(aid, RUN_ID, "capabilities", capabilities(
        agent_id=aid, name=name, role=role,
        skills=[{"skill_id": role, "description": f"{name} capabilities"}],
    )))

print()

# ── 2. PM kicks off the project ─────────────────────────────────────────────

emit(envelope("agent://pm", RUN_ID, "message", message(
    from_agent="agent://pm", to="agent://researcher",
    intent="delegate",
    content="Team, we need a competitive analysis of AI agent frameworks. Researcher — start by mapping the landscape. Analyst — stand by for data. Writer — prepare for a 2-page brief.",
    mood="energetic",
)))

time.sleep(0.3)

# ── 3. PM hands off to researcher ───────────────────────────────────────────

emit(envelope("agent://pm", RUN_ID, "handoff", handoff(
    from_agent="agent://pm", to="agent://researcher",
    description="Map the AI agent framework landscape: LangChain, CrewAI, AutoGen, Maia. Key dimensions: pricing, features, community size.",
    priority="high",
)))

time.sleep(0.3)

# ── 4. Researcher works ─────────────────────────────────────────────────────

emit(envelope("agent://researcher", RUN_ID, "event", activity(
    agent_id="agent://researcher",
    activity_type="searching",
    detail="Scanning GitHub stars, npm downloads, and documentation quality",
)))

time.sleep(0.3)

emit(envelope("agent://researcher", RUN_ID, "event", activity(
    agent_id="agent://researcher",
    activity_type="browsing",
    detail="Reading LangChain vs CrewAI comparison on blog.langchain.dev",
    browser={"url": "https://blog.langchain.dev/comparison", "title": "Framework Comparison"},
)))

time.sleep(0.3)

# Researcher shares findings
emit(envelope("agent://researcher", RUN_ID, "message", message(
    from_agent="agent://researcher", to="agent://analyst",
    intent="propose",
    content="Landscape mapped. Key findings:\n- LangChain: 82k stars, broadest ecosystem, steep learning curve\n- CrewAI: 18k stars, role-based, growing fast\n- AutoGen: 29k stars, Microsoft-backed, conversation-centric\n- Maia: ACP protocol, theatre visualization, brain orchestration — unique observability angle",
    mood="confident",
)))

time.sleep(0.3)

# ── 5. Handoff to analyst ────────────────────────────────────────────────────

emit(envelope("agent://researcher", RUN_ID, "handoff", handoff(
    from_agent="agent://researcher", to="agent://analyst",
    description="Analyze the framework data and identify where Maia has competitive advantage",
)))

time.sleep(0.3)

# ── 6. Analyst works ─────────────────────────────────────────────────────────

emit(envelope("agent://analyst", RUN_ID, "event", activity(
    agent_id="agent://analyst",
    activity_type="thinking",
    detail="Cross-referencing features, community momentum, and unique selling points",
)))

time.sleep(0.3)

emit(envelope("agent://analyst", RUN_ID, "message", message(
    from_agent="agent://analyst", to="agent://pm",
    intent="challenge",
    content="The data shows Maia's differentiation is observability — Theatre + TeamChat. No other framework lets you WATCH agents work. But the ecosystem is smaller. Recommendation: position as 'the observability layer' that works WITH other frameworks, not against them.",
    mood="analytical",
)))

time.sleep(0.3)

# PM agrees
emit(envelope("agent://pm", RUN_ID, "message", message(
    from_agent="agent://pm", to="agent://analyst",
    intent="agree",
    content="Strong insight. The 'layer, not replacement' positioning aligns with our adapter strategy (LangChain, CrewAI, AutoGen adapters). Writer — take this angle.",
    mood="supportive",
)))

time.sleep(0.3)

# ── 7. Handoff to writer ────────────────────────────────────────────────────

emit(envelope("agent://pm", RUN_ID, "handoff", handoff(
    from_agent="agent://pm", to="agent://writer",
    description="Write a 2-page competitive brief positioning Maia as the observability layer for AI agents",
    definition_of_done="Executive-ready, data-backed, with clear competitive matrix",
)))

time.sleep(0.3)

# ── 8. Writer works ──────────────────────────────────────────────────────────

emit(envelope("agent://writer", RUN_ID, "event", activity(
    agent_id="agent://writer",
    activity_type="writing",
    detail="Drafting competitive brief with framework comparison matrix",
)))

time.sleep(0.3)

emit(envelope("agent://writer", RUN_ID, "artifact", artifact(
    kind="document",
    title="Competitive Brief: AI Agent Frameworks 2026",
    content="## Executive Summary\n\nThe AI agent framework market has consolidated around four key players...",
    mime_type="text/markdown",
)))

time.sleep(0.3)

emit(envelope("agent://writer", RUN_ID, "message", message(
    from_agent="agent://writer", to="agent://pm",
    intent="summarize",
    content="Brief complete. Key positioning: Maia is the collaboration and observability LAYER — it doesn't replace LangChain or CrewAI, it makes them visible. The adapter strategy (works with any framework) is the moat.",
    mood="confident",
)))

time.sleep(0.3)

# ── 9. PM reviews ────────────────────────────────────────────────────────────

emit(envelope("agent://pm", RUN_ID, "review", review(
    reviewer="agent://pm",
    author="agent://writer",
    verdict="approve",
    score=0.94,
    feedback="Excellent brief. The 'layer, not replacement' framing is exactly right. Ship it.",
    strengths=["Clear competitive matrix", "Data-backed positioning", "Actionable recommendations"],
)))

print()
print("-" * 60)
print(f"Done — events saved to events.jsonl")
print(f"Replay: maia replay events.jsonl")
print(f"Stream: maia serve events.jsonl  # then connect Theatre to localhost:8765")