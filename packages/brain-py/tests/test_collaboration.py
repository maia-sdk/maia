from __future__ import annotations

import asyncio

from maia_acp.builders import envelope, message
from maia_brain.collaboration import (
    CollaborationContext,
    draft_conversation_message,
    suggest_conversation_move,
    summarize_conversation_thread,
)
from maia_brain.types import LLMConfig, LLMResult


class _FakeResponse:
    def __init__(self, content: str) -> None:
        self.content = content


async def _fake_call_llm(_config: LLMConfig, _system_prompt: str, _user_prompt: str) -> LLMResult:
    return LLMResult(
        content='{"action":"ask","to_agent_id":"agent://analyst","intent":"clarify","reason":"Need number verification","requires_ack":true,"mentions":["agent://analyst"],"confidence":0.93}',
        tokens=42,
        cost=0.012,
    )


async def _fake_call_llm_message(_config: LLMConfig, _system_prompt: str, _user_prompt: str) -> LLMResult:
    return LLMResult(
        content='{"content":"Please verify the revenue figure before I finalize the memo.","intent":"clarify","to_agent_id":"agent://analyst","task_id":"task_memo","task_title":"Client memo","thread_id":"thread_memo","requires_ack":true,"mentions":["agent://analyst"]}',
        tokens=51,
        cost=0.02,
    )


async def _fake_call_llm_digest(_config: LLMConfig, _system_prompt: str, _user_prompt: str) -> LLMResult:
    return LLMResult(
        content='{"summary":"Verification is pending.","decisions":["Researcher drafted the memo outline."],"blockers":["Need verified revenue figure."],"open_questions":["Is 34% growth the correct number?"],"next_action":"Validate the growth number.","next_owner_agent_id":"agent://analyst"}',
        tokens=38,
        cost=0.01,
    )


def _context() -> CollaborationContext:
    return CollaborationContext.model_validate(
        {
            "objective": "Finish the client memo with verified numbers.",
            "currentAgentId": "agent://researcher",
            "participants": [
                {"agentId": "agent://researcher", "name": "Researcher"},
                {"agentId": "agent://analyst", "name": "Analyst", "role": "Verifier"},
            ],
            "events": [
                envelope(
                    "agent://researcher",
                    "run_123",
                    "message",
                    message(
                        from_agent="agent://researcher",
                        to="agent://analyst",
                        intent="clarify",
                        content="Can you check the growth number?",
                        thread_id="thread_memo",
                        task_id="task_memo",
                        task_title="Client memo",
                    ),
                )
            ],
            "threadId": "thread_memo",
            "taskId": "task_memo",
            "taskTitle": "Client memo",
        }
    )


def test_suggest_conversation_move(monkeypatch) -> None:
    from maia_brain import collaboration

    monkeypatch.setattr(collaboration, "call_llm", _fake_call_llm)

    result = asyncio.run(
        suggest_conversation_move(
            LLMConfig(api_key="sk-test", model="gpt-4o-mini"),
            _context(),
        )
    )

    assert result.move.action == "ask"
    assert result.move.to_agent_id == "agent://analyst"
    assert result.move.intent == "clarify"
    assert result.move.requires_ack is True
    assert result.cost.tokens == 42


def test_draft_and_digest_helpers(monkeypatch) -> None:
    from maia_brain import collaboration

    monkeypatch.setattr(collaboration, "call_llm", _fake_call_llm_message)
    move_result = collaboration.ConversationMove(
        action="ask",
        to_agent_id="agent://analyst",
        intent="clarify",
        reason="Need number verification",
        requires_ack=True,
        mentions=["agent://analyst"],
    )
    draft_result = asyncio.run(
        draft_conversation_message(
            LLMConfig(api_key="sk-test", model="gpt-4o-mini"),
            _context(),
            move_result,
        )
    )

    assert draft_result.draft is not None
    assert draft_result.message is not None
    assert draft_result.message.to == "agent://analyst"
    assert draft_result.message.context["thread_id"] == "thread_memo"
    assert draft_result.cost.tokens == 51

    monkeypatch.setattr(collaboration, "call_llm", _fake_call_llm_digest)
    digest_result = asyncio.run(
        summarize_conversation_thread(
            LLMConfig(api_key="sk-test", model="gpt-4o-mini"),
            _context(),
        )
    )

    assert digest_result.digest.summary == "Verification is pending."
    assert digest_result.digest.next_owner_agent_id == "agent://analyst"
    assert digest_result.digest.open_questions == ["Is 34% growth the correct number?"]
