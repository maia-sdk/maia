"""
Python Quickstart — use the Maia SDK in Python.

Usage:
    pip install maia-sdk
    python main.py
"""

from maia_acp import (
    ACPClient,
    message,
    handoff,
    review,
    artifact,
    activity,
    capabilities,
)

# Create a client
client = ACPClient(agent_id="agent://researcher")
print(f"Agent: {client.agent_id}")

# Build ACP messages
msg = message(
    from_agent="agent://researcher",
    to="agent://analyst",
    intent="propose",
    content="I found 3 key pricing trends in the SaaS market.",
)
print(f"\nMessage: {msg.content}")
print(f"  From: {msg.from_agent}")
print(f"  Intent: {msg.intent}")

# Build a handoff
h = handoff(
    from_agent="agent://brain",
    to="agent://writer",
    task="Write a client-ready report on SaaS pricing trends",
)
print(f"\nHandoff: {h.task.description}")

# Build a review
r = review(
    reviewer="agent://brain",
    author="agent://writer",
    verdict="revise",
    feedback="Add Enterprise vs SMB segment split",
    score=0.75,
)
print(f"\nReview: {r.verdict} (score: {r.score})")
print(f"  Feedback: {r.feedback}")

# Use framework adapters
print("\n--- Framework Adapters ---")
try:
    from maia_sdk.adapters.langchain import ACPLangChainAdapter
    print("LangChain adapter: available")
except ImportError:
    print("LangChain adapter: install langchain-core to use")

try:
    from maia_sdk.adapters.crewai import ACPCrewAIAdapter
    print("CrewAI adapter: available")
except ImportError:
    print("CrewAI adapter: install crewai to use")

print("\nDone!")