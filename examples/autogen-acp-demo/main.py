"""
AutoGen + Maia ACP Demo
========================
Wraps an AutoGen group chat with ACP event emission so you can
visualize multi-agent conversations in Theatre + TeamChat.

Requirements:
    pip install maia-acp maia-adapters pyautogen

Usage:
    OPENAI_API_KEY=sk-... python main.py
"""

import os
import json

# ── 1. Build an AutoGen group chat ──────────────────────────────────────────

from autogen import AssistantAgent, UserProxyAgent, GroupChat, GroupChatManager

config_list = [{"model": "gpt-4o-mini", "api_key": os.environ.get("OPENAI_API_KEY", "sk-test")}]
llm_config = {"config_list": config_list, "temperature": 0.7}

researcher = AssistantAgent(
    name="researcher",
    system_message="You are a market researcher. Find data and cite sources.",
    llm_config=llm_config,
)

analyst = AssistantAgent(
    name="analyst",
    system_message="You are a data analyst. Analyze findings and produce tables.",
    llm_config=llm_config,
)

writer = AssistantAgent(
    name="writer",
    system_message="You are an executive writer. Produce clear 3-paragraph summaries. Reply TERMINATE when done.",
    llm_config=llm_config,
)

user_proxy = UserProxyAgent(
    name="user",
    human_input_mode="NEVER",
    max_consecutive_auto_reply=0,
    code_execution_config=False,
)

group_chat = GroupChat(
    agents=[user_proxy, researcher, analyst, writer],
    messages=[],
    max_round=6,
)

manager = GroupChatManager(groupchat=group_chat, llm_config=llm_config)

# ── 2. Wrap with ACP adapter ────────────────────────────────────────────────

from maia_adapters.autogen.adapter import ACPAutoGenAdapter

acp_chat = ACPAutoGenAdapter(group_chat=manager, run_id="autogen_demo_001")

# ── 3. Run and stream ACP events ────────────────────────────────────────────

print("=" * 60)
print("AutoGen + Maia ACP Demo")
print("=" * 60)
print(f"\nAgents: researcher, analyst, writer")
print("-" * 60)

query = "Analyze the top 3 SaaS pricing trends for 2026 and write an executive summary."

for event in acp_chat.run(query):
    event_dict = event.model_dump() if hasattr(event, "model_dump") else vars(event)
    event_type = event_dict.get("event_type", "unknown")
    payload = event_dict.get("payload", {})

    if event_type == "capabilities":
        name = payload.get("name", "")
        print(f"  [capabilities] {name} joined")

    elif event_type == "event":
        act = payload.get("activity", "")
        detail = payload.get("detail", "")[:80]
        print(f"  [{act}] {detail}")

    elif event_type == "message":
        src = payload.get("from", "").split("://")[-1]
        content = payload.get("content", "")
        print(f"\n  [{src}] {content[:300]}")

    with open("events.jsonl", "a") as f:
        f.write(json.dumps(event_dict) + "\n")

print("\n" + "-" * 60)
print("Events saved to events.jsonl — replay with: maia replay events.jsonl")