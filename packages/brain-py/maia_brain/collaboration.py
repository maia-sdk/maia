"""LLM-native collaboration helpers for agent-to-agent coordination."""

from __future__ import annotations

import json
import re
from typing import Any, Literal

from pydantic import BaseModel, Field

from maia_acp.builders import message as build_message
from maia_acp.types import ACPEvent, ACPCapabilities, ACPMessage, AgentPresence, MessageIntent
from maia_brain.llm import call_llm
from maia_brain.types import AgentDefinition, LLMConfig, LLMResult


ConversationAction = Literal["reply", "ask", "handoff", "review", "summarize", "wait"]


class CollaborationParticipant(BaseModel):
    agent_id: str = Field(alias="agentId")
    name: str
    role: str | None = None
    description: str | None = None
    skills: list[str] = Field(default_factory=list)
    accepts_intents: list[MessageIntent] = Field(default_factory=list, alias="acceptsIntents")
    presence: AgentPresence | None = None

    model_config = {"populate_by_name": True}


class CollaborationContext(BaseModel):
    objective: str
    current_agent_id: str = Field(alias="currentAgentId")
    participants: list[CollaborationParticipant]
    events: list[ACPEvent] = Field(default_factory=list)
    thread_id: str | None = Field(default=None, alias="threadId")
    task_id: str | None = Field(default=None, alias="taskId")
    task_title: str | None = Field(default=None, alias="taskTitle")
    max_words: int = Field(default=80, alias="maxWords")

    model_config = {"populate_by_name": True}


class ConversationMove(BaseModel):
    action: ConversationAction
    intent: MessageIntent
    reason: str
    to_agent_id: str | None = Field(default=None, alias="toAgentId")
    requires_ack: bool = Field(default=False, alias="requiresAck")
    mentions: list[str] = Field(default_factory=list)
    confidence: float | None = None

    model_config = {"populate_by_name": True}


class MessageDraft(BaseModel):
    to_agent_id: str = Field(alias="toAgentId")
    intent: MessageIntent
    content: str
    thinking: str | None = None
    mood: ACPMessage.model_fields["mood"].annotation | None = None
    task_id: str | None = Field(default=None, alias="taskId")
    task_title: str | None = Field(default=None, alias="taskTitle")
    thread_id: str | None = Field(default=None, alias="threadId")
    requires_ack: bool = Field(default=False, alias="requiresAck")
    mentions: list[str] = Field(default_factory=list)

    model_config = {"populate_by_name": True}


class ThreadDigest(BaseModel):
    summary: str
    decisions: list[str] = Field(default_factory=list)
    blockers: list[str] = Field(default_factory=list)
    open_questions: list[str] = Field(default_factory=list, alias="openQuestions")
    next_action: str | None = Field(default=None, alias="nextAction")
    next_owner_agent_id: str | None = Field(default=None, alias="nextOwnerAgentId")

    model_config = {"populate_by_name": True}


class MoveSuggestionResult(BaseModel):
    move: ConversationMove
    cost: LLMResult


class MessageDraftResult(BaseModel):
    draft: MessageDraft | None = None
    message: ACPMessage | None = None
    cost: LLMResult


class ThreadDigestResult(BaseModel):
    digest: ThreadDigest
    cost: LLMResult


def _empty_cost(llm: LLMConfig) -> LLMResult:
    return LLMResult(content="", tokens=0, cost=0.0)


def _truncate(text: str, max_length: int) -> str:
    value = str(text or "").strip()
    if len(value) <= max_length:
        return value
    return f"{value[: max(0, max_length - 3)]}..."


def _normalize_participant(
    participant: CollaborationParticipant | AgentDefinition | ACPCapabilities | dict[str, Any],
) -> CollaborationParticipant:
    if isinstance(participant, CollaborationParticipant):
        return participant
    if isinstance(participant, ACPCapabilities):
        return CollaborationParticipant(
            agent_id=participant.agent_id,
            name=participant.name,
            role=participant.role,
            description=participant.description,
            skills=[skill.description or skill.skill_id for skill in participant.skills],
            accepts_intents=participant.accepts_intents,
            presence=participant.presence,
        )
    if isinstance(participant, AgentDefinition):
        return CollaborationParticipant(
            agent_id=participant.id,
            name=participant.name,
            role=participant.role,
            description=participant.instructions,
            skills=participant.tools,
        )
    return CollaborationParticipant.model_validate(participant)


def _normalize_context(raw_context: CollaborationContext | dict[str, Any]) -> CollaborationContext:
    if isinstance(raw_context, CollaborationContext):
        return CollaborationContext(
            objective=raw_context.objective,
            current_agent_id=raw_context.current_agent_id,
            participants=[_normalize_participant(p) for p in raw_context.participants],
            events=raw_context.events,
            thread_id=raw_context.thread_id,
            task_id=raw_context.task_id,
            task_title=raw_context.task_title,
            max_words=raw_context.max_words,
        )

    payload = dict(raw_context)
    payload["participants"] = [_normalize_participant(p) for p in payload.get("participants", [])]
    return CollaborationContext.model_validate(payload)


def _normalize_move(raw_move: ConversationMove | dict[str, Any]) -> ConversationMove:
    if isinstance(raw_move, ConversationMove):
        return raw_move
    return ConversationMove.model_validate(raw_move)


def _event_line(event: ACPEvent) -> str:
    if event.event_type == "message":
        payload = event.as_message()
        context = payload.context or {}
        target = "everyone" if payload.to == "agent://broadcast" else payload.to
        parts = [
            f"{payload.from_agent} -> {target}",
            f"[{payload.intent}]",
            _truncate(payload.content, 240),
        ]
        if context.get("task_title"):
            parts.append(f"(task: {context['task_title']})")
        if context.get("delivery_status"):
            parts.append(f"(delivery: {context['delivery_status']})")
        return " ".join(part for part in parts if part)

    if event.event_type == "handoff":
        payload = event.as_handoff()
        return f"{payload.from_agent} handed off to {payload.to}: {_truncate(payload.task.description, 220)}"

    if event.event_type == "review":
        payload = event.as_review()
        return f"{payload.reviewer} reviewed {payload.author}: {payload.verdict}"

    return f"{event.agent_id} {event.event_type}"


def _format_participants(participants: list[CollaborationParticipant], current_agent_id: str) -> str:
    lines: list[str] = []
    for participant in participants:
        line_parts = [
            f"- {participant.agent_id}{' (current speaker)' if participant.agent_id == current_agent_id else ''}",
            f"{participant.name}{f', {participant.role}' if participant.role else ''}",
        ]
        if participant.description:
            line_parts.append(f"- {_truncate(participant.description, 140)}")
        if participant.skills:
            line_parts.append(f"- skills: {', '.join(participant.skills[:6])}")
        intents = ", ".join(participant.accepts_intents) if participant.accepts_intents else "any"
        line_parts.append(f"- intents: {intents}")
        presence = participant.presence
        if presence and presence.availability:
            line_parts.append(f"- availability: {presence.availability}")
        if presence and presence.current_focus:
            line_parts.append(f"- focus: {_truncate(presence.current_focus, 100)}")
        if presence and presence.active_task_count is not None:
            line_parts.append(f"- active tasks: {presence.active_task_count}")
        lines.append(" ".join(line_parts))
    return "\n".join(lines)


def _format_recent_events(events: list[ACPEvent]) -> str:
    if not events:
        return "(no recent conversation)"
    return "\n".join(_event_line(event) for event in events[-12:])


def _last_message_id(events: list[ACPEvent]) -> str | None:
    for event in reversed(events):
        if event.event_type != "message":
            continue
        payload = event.as_message()
        message_id = payload.context.get("message_id") if payload.context else None
        if message_id:
            return str(message_id)
    return None


async def _call_llm_json_with_result(
    llm: LLMConfig,
    system_prompt: str,
    user_prompt: str,
    fallback: dict[str, Any],
) -> tuple[dict[str, Any], LLMResult]:
    result = await call_llm(llm, system_prompt, user_prompt)
    try:
        match = re.search(r"[\[{][\s\S]*[\]}]", result.content)
        if match:
            parsed = json.loads(match.group())
            if isinstance(parsed, dict):
                return parsed, result
    except (json.JSONDecodeError, TypeError):
        pass
    return fallback, result


def _move_system_prompt(max_words: int) -> str:
    return " ".join(
        [
            "You coordinate a team of AI workmates.",
            "Decide the most useful next communication move for the current agent.",
            "Use natural human work patterns: ask for verification when needed, hand off when the work should switch owners, summarize when the thread is getting noisy, and wait when no message adds value.",
            "Prefer the best teammate based on role fit, current focus, and availability.",
            f"If a message is needed, keep it under {max_words} words.",
            "Return JSON only with keys: action, to_agent_id, intent, reason, requires_ack, mentions, confidence.",
        ]
    )


def _move_user_prompt(context: CollaborationContext) -> str:
    lines = [
        f"Objective: {context.objective}",
        f"Task title: {context.task_title}" if context.task_title else "",
        f"Task id: {context.task_id}" if context.task_id else "",
        f"Thread id: {context.thread_id}" if context.thread_id else "",
        f"Current agent: {context.current_agent_id}",
        "",
        "Participants:",
        _format_participants(context.participants, context.current_agent_id),
        "",
        "Recent events:",
        _format_recent_events(context.events),
    ]
    return "\n".join(line for line in lines if line)


def _draft_system_prompt(max_words: int) -> str:
    return " ".join(
        [
            "You write natural teammate-to-teammate messages for an AI team.",
            "Sound like a strong human workmate: direct, specific, and useful.",
            "Do not use canned greetings, filler, or robotic recap.",
            "Ground the message in the supplied thread context and task state.",
            "If the move is a handoff, clearly state what is done and what needs the recipient.",
            "If the move is a question, make it crisp and answerable.",
            f"Keep the message under {max_words} words unless the context requires a short structured summary.",
            "Return JSON only with keys: content, intent, thinking, mood, to_agent_id, task_id, task_title, thread_id, requires_ack, mentions.",
        ]
    )


def _draft_user_prompt(context: CollaborationContext, move: ConversationMove) -> str:
    lines = [
        f"Objective: {context.objective}",
        f"Current agent: {context.current_agent_id}",
        f"Planned move: {move.action}",
        f"Reason: {move.reason}",
        f"Recipient: {move.to_agent_id}" if move.to_agent_id else "",
        f"Intent: {move.intent}",
        f"Task title: {context.task_title}" if context.task_title else "",
        f"Task id: {context.task_id}" if context.task_id else "",
        f"Thread id: {context.thread_id}" if context.thread_id else "",
        "",
        "Participants:",
        _format_participants(context.participants, context.current_agent_id),
        "",
        "Recent events:",
        _format_recent_events(context.events),
    ]
    return "\n".join(line for line in lines if line)


def _digest_system_prompt() -> str:
    return " ".join(
        [
            "You compress agent coordination threads into an operational digest.",
            "Capture what has been decided, what is blocked, what remains unclear, and who should act next.",
            "Return JSON only with keys: summary, decisions, blockers, open_questions, next_action, next_owner_agent_id.",
        ]
    )


def _digest_user_prompt(context: CollaborationContext) -> str:
    lines = [
        f"Objective: {context.objective}",
        f"Task title: {context.task_title}" if context.task_title else "",
        f"Thread id: {context.thread_id}" if context.thread_id else "",
        "",
        "Participants:",
        _format_participants(context.participants, context.current_agent_id),
        "",
        "Recent events:",
        _format_recent_events(context.events),
    ]
    return "\n".join(line for line in lines if line)


async def suggest_conversation_move(
    llm: LLMConfig,
    raw_context: CollaborationContext | dict[str, Any],
) -> MoveSuggestionResult:
    context = _normalize_context(raw_context)
    if len(context.participants) <= 1:
        return MoveSuggestionResult(
            move=ConversationMove(
                action="wait",
                intent="summarize",
                reason="No teammate is available for coordination.",
                confidence=1.0,
            ),
            cost=_empty_cost(llm),
        )

    data, cost = await _call_llm_json_with_result(
        llm,
        _move_system_prompt(context.max_words),
        _move_user_prompt(context),
        {
            "action": "wait",
            "intent": "summarize",
            "reason": "No additional coordination is needed.",
            "confidence": 0.5,
        },
    )
    return MoveSuggestionResult(
        move=ConversationMove.model_validate(
            {
                "action": data.get("action", "wait"),
                "to_agent_id": data.get("to_agent_id"),
                "intent": data.get("intent", "clarify"),
                "reason": data.get("reason", "No additional coordination is needed."),
                "requires_ack": data.get("requires_ack", False),
                "mentions": data.get("mentions", []),
                "confidence": data.get("confidence"),
            }
        ),
        cost=cost,
    )


async def draft_conversation_message(
    llm: LLMConfig,
    raw_context: CollaborationContext | dict[str, Any],
    raw_move: ConversationMove | dict[str, Any],
) -> MessageDraftResult:
    context = _normalize_context(raw_context)
    move = _normalize_move(raw_move)
    if move.action == "wait" or not move.to_agent_id:
        return MessageDraftResult(draft=None, message=None, cost=_empty_cost(llm))

    data, cost = await _call_llm_json_with_result(
        llm,
        _draft_system_prompt(context.max_words),
        _draft_user_prompt(context, move),
        {
            "content": "",
            "intent": move.intent,
            "to_agent_id": move.to_agent_id,
            "task_id": context.task_id,
            "task_title": context.task_title,
            "thread_id": context.thread_id,
            "requires_ack": move.requires_ack,
            "mentions": move.mentions,
        },
    )

    content = str(data.get("content", "")).strip()
    if not content:
        return MessageDraftResult(draft=None, message=None, cost=cost)

    draft = MessageDraft.model_validate(
        {
            "to_agent_id": data.get("to_agent_id", move.to_agent_id),
            "intent": data.get("intent", move.intent),
            "content": content,
            "thinking": data.get("thinking"),
            "mood": data.get("mood"),
            "task_id": data.get("task_id", context.task_id),
            "task_title": data.get("task_title", context.task_title),
            "thread_id": data.get("thread_id", context.thread_id),
            "requires_ack": data.get("requires_ack", move.requires_ack),
            "mentions": data.get("mentions", move.mentions),
        }
    )
    message_payload = build_message(
        from_agent=context.current_agent_id,
        to=draft.to_agent_id,
        intent=draft.intent,
        content=draft.content,
        thinking=draft.thinking,
        mood=draft.mood,
        in_reply_to=_last_message_id(context.events),
        task_id=draft.task_id,
        task_title=draft.task_title,
        thread_id=draft.thread_id,
        requires_ack=draft.requires_ack,
        mentions=draft.mentions,
    )
    return MessageDraftResult(
        draft=draft,
        message=ACPMessage.model_validate(message_payload),
        cost=cost,
    )


async def summarize_conversation_thread(
    llm: LLMConfig,
    raw_context: CollaborationContext | dict[str, Any],
) -> ThreadDigestResult:
    context = _normalize_context(raw_context)
    data, cost = await _call_llm_json_with_result(
        llm,
        _digest_system_prompt(),
        _digest_user_prompt(context),
        {
            "summary": "",
            "decisions": [],
            "blockers": [],
            "open_questions": [],
        },
    )
    return ThreadDigestResult(
        digest=ThreadDigest.model_validate(
            {
                "summary": data.get("summary", ""),
                "decisions": data.get("decisions", []),
                "blockers": data.get("blockers", []),
                "open_questions": data.get("open_questions", []),
                "next_action": data.get("next_action"),
                "next_owner_agent_id": data.get("next_owner_agent_id"),
            }
        ),
        cost=cost,
    )

