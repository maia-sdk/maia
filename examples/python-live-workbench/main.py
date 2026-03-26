"""
Python live workbench demo for the Maia SDK.

What it shows:
- ACP event emission
- Python collaboration helpers
- Theatre server
- TeamChat server
- Maia computer runtime client when MAIA_API_BASE is configured

Usage:
    pip install -r requirements.txt
    python main.py

Optional environment:
    OPENAI_API_KEY=...
    MAIA_API_BASE=http://localhost:8000
    MAIA_COMPUTER_TASK="Inspect the pricing page and summarize the plans."
    OPEN_BROWSER=0
"""

from __future__ import annotations

import asyncio
import json
import os
import time
from pathlib import Path
from typing import Any

from maia_sdk import (
    ComputerUseClientConfig,
    LLMConfig,
    TeamChat,
    Theatre,
    activity,
    capabilities,
    create_computer_use_client,
    draft_conversation_message,
    envelope,
    handoff,
    message,
    review,
    suggest_conversation_move,
    summarize_conversation_thread,
)

RUN_ID = "python_live_workbench"
EVENTS_PATH = Path(__file__).with_name("events.jsonl")
DEFAULT_OBJECTIVE = "Prepare a short market update with one verified numerical claim."


class LiveWorkbench:
    def __init__(self) -> None:
        open_browser = os.getenv("OPEN_BROWSER", "1") not in {"0", "false", "False"}
        self.theatre = Theatre(port=8765, open_browser=open_browser)
        self.teamchat = TeamChat(port=8766, open_browser=open_browser)
        self.events: list[dict[str, Any]] = []

    def start(self) -> None:
        self.theatre.start()
        self.teamchat.start()

    def stop(self) -> None:
        self.theatre.stop()
        self.teamchat.stop()

    def emit(self, event: Any) -> None:
        payload = event.model_dump() if hasattr(event, "model_dump") else event
        self.events.append(payload)
        with EVENTS_PATH.open("a", encoding="utf-8") as handle:
            handle.write(json.dumps(payload) + "\n")
        self.theatre.push(payload)
        self.teamchat.push(payload)
        self._print_event(payload)

    @staticmethod
    def _print_event(event: dict[str, Any]) -> None:
        event_type = event.get("event_type", "?")
        payload = event.get("payload", {})
        if event_type == "message":
            print(f"[message] {payload.get('from', '')} -> {payload.get('to', '')}: {payload.get('content', '')}")
        elif event_type == "handoff":
            print(f"[handoff] {payload.get('from', '')} -> {payload.get('to', '')}: {payload.get('task', {}).get('description', '')}")
        elif event_type == "review":
            print(f"[review] {payload.get('reviewer', '')} -> {payload.get('author', '')}: {payload.get('verdict', '')}")
        elif event_type == "event":
            print(f"[activity] {payload.get('agent_id', '')}: {payload.get('activity', '')} - {payload.get('detail', '')}")
        elif event_type == "capabilities":
            print(f"[capabilities] {payload.get('name', '')} ready")


def _llm_config() -> LLMConfig | None:
    api_key = os.getenv("OPENAI_API_KEY", "").strip()
    if not api_key:
        return None
    return LLMConfig(api_key=api_key, model=os.getenv("OPENAI_MODEL", "gpt-4o-mini"))


def _base_context(events: list[dict[str, Any]]) -> dict[str, Any]:
    return {
        "objective": DEFAULT_OBJECTIVE,
        "currentAgentId": "agent://researcher",
        "threadId": "thread_market_update",
        "taskId": "task_market_update",
        "taskTitle": "Market update",
        "participants": [
            {
                "agentId": "agent://researcher",
                "name": "Researcher",
                "role": "Lead analyst",
                "skills": ["research", "synthesis"],
                "acceptsIntents": ["clarify", "summarize", "review"],
            },
            {
                "agentId": "agent://analyst",
                "name": "Analyst",
                "role": "Verifier",
                "skills": ["verification", "math"],
                "acceptsIntents": ["clarify", "review", "challenge"],
                "presence": {"availability": "available", "current_focus": "Fact checking", "active_task_count": 1},
            },
        ],
        "events": events,
    }


async def emit_initial_state(workbench: LiveWorkbench) -> None:
    for agent_id, name, role, skills in [
        ("agent://researcher", "Researcher", "lead_analyst", ["research", "synthesis"]),
        ("agent://analyst", "Analyst", "verifier", ["verification", "math"]),
    ]:
        workbench.emit(
            envelope(
                agent_id,
                RUN_ID,
                "capabilities",
                capabilities(
                    agent_id=agent_id,
                    name=name,
                    role=role,
                    skills=[{"skill_id": skill, "description": f"{name} skill: {skill}"} for skill in skills],
                    accepts_intents=["clarify", "review", "summarize"],
                    presence={"availability": "available", "active_task_count": 1},
                ),
            )
        )

    workbench.emit(
        envelope(
            "agent://researcher",
            RUN_ID,
            "message",
            message(
                from_agent="agent://researcher",
                to="agent://analyst",
                intent="clarify",
                content="We need one verified numerical claim for the market update. Can you validate the growth figure?",
                thread_id="thread_market_update",
                task_id="task_market_update",
                task_title="Market update",
                requires_ack=True,
                mentions=["agent://analyst"],
                delivery_status="sent",
            ),
        )
    )


async def emit_collaboration_flow(workbench: LiveWorkbench) -> None:
    llm = _llm_config()
    context = _base_context(workbench.events)

    if llm is None:
        workbench.emit(
            envelope(
                "agent://researcher",
                RUN_ID,
                "handoff",
                handoff(
                    from_agent="agent://researcher",
                    to="agent://analyst",
                    description="Verify the 34% growth claim before the update is finalized.",
                    task_id="task_market_update",
                    thread_id="thread_market_update",
                    definition_of_done="One verified numerical claim with source confidence.",
                    requires_ack=True,
                ),
            )
        )
        workbench.emit(
            envelope(
                "agent://analyst",
                RUN_ID,
                "review",
                review(
                    reviewer="agent://analyst",
                    author="agent://researcher",
                    verdict="approve",
                    feedback="The 34% number is defensible if cited as a modeled estimate.",
                    score=0.91,
                ),
            )
        )
        return

    move_result = await suggest_conversation_move(llm, context)
    draft_result = await draft_conversation_message(llm, context, move_result.move)

    if draft_result.message is not None:
        workbench.emit(
            envelope(
                "agent://researcher",
                RUN_ID,
                "message",
                draft_result.message.model_dump(by_alias=True),
            )
        )

    digest_result = await summarize_conversation_thread(llm, _base_context(workbench.events))
    workbench.emit(
        envelope(
            "agent://analyst",
            RUN_ID,
            "message",
            message(
                from_agent="agent://analyst",
                to="agent://researcher",
                intent="summarize",
                content=digest_result.digest.summary or "Thread summary is ready.",
                thread_id="thread_market_update",
                task_id="task_market_update",
                task_title="Market update",
                delivery_status="sent",
            ),
        )
    )


def emit_runtime_activity(workbench: LiveWorkbench) -> None:
    api_base = os.getenv("MAIA_API_BASE", "").strip()
    if not api_base:
        workbench.emit(
            envelope(
                "agent://researcher",
                RUN_ID,
                "event",
                activity(
                    agent_id="agent://researcher",
                    activity_type="idle",
                    detail="MAIA_API_BASE not set. Skipping live computer runtime.",
                ),
            )
        )
        return

    client = create_computer_use_client(
        ComputerUseClientConfig(
            api_base=api_base,
            user_id=os.getenv("MAIA_USER_ID", "python-live-workbench"),
        )
    )
    task = os.getenv(
        "MAIA_COMPUTER_TASK",
        "Inspect the homepage and capture one concrete pricing or positioning observation.",
    )

    try:
        session = client.start_session({"url": os.getenv("MAIA_START_URL", "https://example.com")})
        workbench.emit(
            envelope(
                "agent://researcher",
                RUN_ID,
                "event",
                activity(
                    agent_id="agent://researcher",
                    activity_type="browsing",
                    detail=f"Started computer session {session.session_id} at {session.url}",
                    browser={"url": session.url, "title": "Computer session"},
                ),
            )
        )

        def on_event(stream_event: Any) -> None:
            detail = stream_event.detail or stream_event.text or stream_event.action or "Runtime event"
            activity_type = "browsing"
            if stream_event.action:
                activity_type = "tool_calling"
            elif stream_event.text:
                activity_type = "reading"
            workbench.emit(
                envelope(
                    "agent://researcher",
                    RUN_ID,
                    "event",
                    activity(
                        agent_id="agent://researcher",
                        activity_type=activity_type,
                        detail=detail,
                        browser={"url": stream_event.url or session.url, "title": stream_event.action or "Runtime stream"},
                    ),
                )
            )

        for _ in client.stream_session(
            session.session_id,
            {
                "task": task,
                "model": os.getenv("MAIA_COMPUTER_MODEL"),
                "max_iterations": int(os.getenv("MAIA_COMPUTER_MAX_ITERATIONS", "6")),
                "run_id": RUN_ID,
            },
            on_event=on_event,
            on_done=lambda: workbench.emit(
                envelope(
                    "agent://researcher",
                    RUN_ID,
                    "event",
                    activity(
                        agent_id="agent://researcher",
                        activity_type="idle",
                        detail="Computer runtime stream completed.",
                    ),
                )
            ),
            on_error=lambda error: workbench.emit(
                envelope(
                    "agent://researcher",
                    RUN_ID,
                    "event",
                    activity(
                        agent_id="agent://researcher",
                        activity_type="error",
                        detail=f"Computer runtime error: {error}",
                    ),
                )
            ),
        ):
            pass
    except Exception as error:
        workbench.emit(
            envelope(
                "agent://researcher",
                RUN_ID,
                "event",
                activity(
                    agent_id="agent://researcher",
                    activity_type="error",
                    detail=f"Failed to use Maia computer runtime: {error}",
                ),
            )
        )


async def main() -> None:
    if EVENTS_PATH.exists():
        EVENTS_PATH.unlink()

    workbench = LiveWorkbench()
    workbench.start()
    print("\nTheatre:  http://localhost:8765")
    print("TeamChat: http://localhost:8766")
    print(f"Events:   {EVENTS_PATH}\n")

    try:
        await emit_initial_state(workbench)
        await emit_collaboration_flow(workbench)
        emit_runtime_activity(workbench)
        print("\nStreaming complete. Press Ctrl+C to stop the local servers.\n")
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        pass
    finally:
        workbench.stop()


if __name__ == "__main__":
    asyncio.run(main())
