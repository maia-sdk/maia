"""
LangChain + Maia ACP Demo
==========================
Wraps a LangChain agent with ACP event emission so you can
visualize it in Theatre or stream events to any ACP consumer.

Requirements:
    pip install maia-acp maia-adapters langchain-openai langchain

Usage:
    OPENAI_API_KEY=sk-... python main.py
"""

import os
import json

# ── 1. Build a LangChain agent ──────────────────────────────────────────────

from langchain_openai import ChatOpenAI
from langchain.agents import AgentExecutor, create_react_agent
from langchain.tools import tool
from langchain.prompts import PromptTemplate

@tool
def search_revenue(query: str) -> str:
    """Search for company revenue data."""
    # Stub — replace with real search
    return json.dumps({
        "company": "Acme Corp",
        "q4_revenue": "$42M",
        "yoy_growth": "18%",
        "source": "Annual Report 2025",
    })

@tool
def calculate(expression: str) -> str:
    """Evaluate a math expression."""
    try:
        return str(eval(expression, {"__builtins__": {}}, {}))
    except Exception as e:
        return f"Error: {e}"

llm = ChatOpenAI(
    model="gpt-4o-mini",
    api_key=os.environ.get("OPENAI_API_KEY", "sk-test"),
)

prompt = PromptTemplate.from_template(
    """You are a helpful financial analyst.

Available tools: {tools}
Tool names: {tool_names}

Question: {input}
{agent_scratchpad}"""
)

agent = create_react_agent(llm, [search_revenue, calculate], prompt)
executor = AgentExecutor(agent=agent, tools=[search_revenue, calculate], verbose=False)

# ── 2. Wrap with ACP adapter ────────────────────────────────────────────────

from maia_adapters.langchain.adapter import ACPLangChainAdapter

acp_agent = ACPLangChainAdapter(
    agent=executor,
    agent_id="agent://financial_analyst",
    name="Financial Analyst",
    role="analyst",
    skills=[
        {"skill_id": "search_revenue", "description": "Search revenue data"},
        {"skill_id": "calculate", "description": "Math calculations"},
    ],
)

# ── 3. Run and stream ACP events ────────────────────────────────────────────

print("=" * 60)
print("LangChain + Maia ACP Demo")
print("=" * 60)

query = "What was Acme Corp's Q4 revenue and what's 18% of $42M?"

print(f"\nQuery: {query}\n")
print("-" * 60)

for event in acp_agent.run(query):
    event_dict = event.model_dump() if hasattr(event, "model_dump") else vars(event)
    event_type = event_dict.get("event_type", "unknown")
    agent_id = event_dict.get("agent_id", "")
    payload = event_dict.get("payload", {})

    if event_type == "capabilities":
        name = payload.get("name", "")
        skills = [s.get("skill_id", "") for s in payload.get("skills", [])]
        print(f"  [{event_type}] {name} — skills: {', '.join(skills)}")

    elif event_type == "event":
        act = payload.get("activity", "")
        detail = payload.get("detail", "")
        tool_info = payload.get("tool", {})
        if tool_info:
            print(f"  [{act}] {tool_info.get('tool_name', '')} — {tool_info.get('input_summary', '')[:80]}")
        else:
            print(f"  [{act}] {detail[:80]}")

    elif event_type == "message":
        content = payload.get("content", "")
        print(f"\n  [result] {content[:200]}")

    # Save as JSONL — Theatre can replay this
    with open("events.jsonl", "a") as f:
        f.write(json.dumps(event_dict) + "\n")

print("\n" + "-" * 60)
print(f"Events saved to events.jsonl — replay with: maia replay events.jsonl")