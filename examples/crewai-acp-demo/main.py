"""
CrewAI + Maia ACP Demo
=======================
Wraps a CrewAI Crew with ACP event emission so you can
visualize agent collaboration in Theatre.

Requirements:
    pip install maia-acp maia-adapters crewai crewai-tools

Usage:
    OPENAI_API_KEY=sk-... python main.py
"""

import os
import json

# ── 1. Build a CrewAI crew ──────────────────────────────────────────────────

from crewai import Agent, Task, Crew, Process

researcher = Agent(
    role="Market Researcher",
    goal="Find the latest SaaS pricing trends and competitive landscape",
    backstory="You are a senior market researcher with 10 years of experience in B2B SaaS.",
    verbose=False,
)

analyst = Agent(
    role="Data Analyst",
    goal="Analyze market data and extract actionable insights",
    backstory="You are a quantitative analyst who turns raw data into clear narratives.",
    verbose=False,
)

writer = Agent(
    role="Report Writer",
    goal="Write a clear, executive-ready summary",
    backstory="You are a business writer known for crisp, jargon-free summaries.",
    verbose=False,
)

research_task = Task(
    description="Research current SaaS pricing models: flat-rate, usage-based, hybrid, PLG. Find 3 recent examples.",
    expected_output="A bullet-point list of 3 SaaS pricing trends with examples.",
    agent=researcher,
)

analysis_task = Task(
    description="Analyze the research and identify which pricing model works best for which segment (SMB vs Enterprise).",
    expected_output="A comparison table with pros/cons for each segment.",
    agent=analyst,
)

report_task = Task(
    description="Write a 3-paragraph executive summary combining the research and analysis.",
    expected_output="A polished 3-paragraph summary suitable for a board deck.",
    agent=writer,
)

crew = Crew(
    agents=[researcher, analyst, writer],
    tasks=[research_task, analysis_task, report_task],
    process=Process.sequential,
    verbose=False,
)

# ── 2. Wrap with ACP adapter ────────────────────────────────────────────────

from maia_adapters.crewai.adapter import ACPCrewAIAdapter

acp_crew = ACPCrewAIAdapter(crew=crew, run_id="crewai_demo_001")

# ── 3. Run and stream ACP events ────────────────────────────────────────────

print("=" * 60)
print("CrewAI + Maia ACP Demo")
print("=" * 60)
print(f"\nAgents: {', '.join(a.role for a in crew.agents)}")
print(f"Tasks:  {len(crew.tasks)}")
print("-" * 60)

for event in acp_crew.run():
    event_dict = event.model_dump() if hasattr(event, "model_dump") else vars(event)
    event_type = event_dict.get("event_type", "unknown")
    payload = event_dict.get("payload", {})

    if event_type == "capabilities":
        name = payload.get("name", "")
        print(f"  [capabilities] {name} joined")

    elif event_type == "handoff":
        src = payload.get("from", "").split("://")[-1]
        dst = payload.get("to", "").split("://")[-1]
        desc = payload.get("task", {}).get("description", "")[:60]
        print(f"  [handoff] {src} → {dst}: {desc}")

    elif event_type == "event":
        act = payload.get("activity", "")
        detail = payload.get("detail", "")[:80]
        print(f"  [{act}] {detail}")

    elif event_type == "message":
        content = payload.get("content", "")
        print(f"\n  [result] {content[:300]}")

    with open("events.jsonl", "a") as f:
        f.write(json.dumps(event_dict) + "\n")

print("\n" + "-" * 60)
print("Events saved to events.jsonl — replay with: maia replay events.jsonl")