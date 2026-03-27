"""ACP message builders — convenience functions for creating well-formed payloads."""

from __future__ import annotations

import time
import uuid
from typing import Any

from maia_acp.types import (
    ACPActivity,
    ACPArtifact,
    ACPCapabilities,
    ACPEvent,
    ACPHandoff,
    ACPMessage,
    ACPChallenge,
    ACPChallengeResolution,
    ACPBranchPlan,
    ACPBranchRun,
    ACPDecision,
    ACPProvenanceGraph,
    ACPReview,
    AgentPersonality,
    AgentSkill,
    HandoffTask,
    ReviewIssue,
)

_sequence_counter = 0


def _next_seq() -> int:
    global _sequence_counter
    _sequence_counter += 1
    return _sequence_counter


def _now() -> str:
    from datetime import datetime, timezone
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def _uid() -> str:
    return uuid.uuid4().hex[:12]


# ── Envelope ──────────────────────────────────────────────────────────────────

def envelope(
    agent_id: str,
    run_id: str,
    event_type: str,
    payload: dict[str, Any],
    parent_event_id: str | None = None,
) -> ACPEvent:
    return ACPEvent(
        acp_version="1.0",
        run_id=run_id,
        agent_id=agent_id,
        event_type=event_type,  # type: ignore[arg-type]
        timestamp=_now(),
        sequence=_next_seq(),
        parent_event_id=parent_event_id,
        payload=payload,
    )


# ── Message ───────────────────────────────────────────────────────────────────

def message(
    *,
    from_agent: str,
    to: str,
    intent: str,
    content: str,
    thinking: str | None = None,
    mood: str | None = None,
    message_id: str | None = None,
    thread_id: str | None = None,
    in_reply_to: str | None = None,
    task_id: str | None = None,
    task_title: str | None = None,
    handoff_id: str | None = None,
    review_id: str | None = None,
    channel: str | None = None,
    mentions: list[str] | None = None,
    requires_ack: bool | None = None,
    delivery_status: str | None = None,
    acked_by: list[str] | None = None,
) -> dict[str, Any]:
    return {
        "from": from_agent,
        "to": to,
        "intent": intent,
        "content": content,
        "thinking": thinking,
        "mood": mood,
        "artifacts": [],
        "context": {
            "message_id": message_id or f"msg_{_uid()}",
            "thread_id": thread_id or f"thread_{_uid()}",
            "in_reply_to": in_reply_to,
            "task_id": task_id,
            "task_title": task_title,
            "handoff_id": handoff_id,
            "review_id": review_id,
            "channel": channel or ("broadcast" if to == "agent://broadcast" else "direct"),
            "mentions": mentions or [],
            "requires_ack": requires_ack,
            "delivery_status": delivery_status,
            "acked_by": acked_by or [],
        },
    }


# ── Handoff ───────────────────────────────────────────────────────────────────

def handoff(
    *,
    from_agent: str,
    to: str,
    description: str,
    task_id: str | None = None,
    thread_id: str | None = None,
    constraints: list[str] | None = None,
    definition_of_done: str | None = None,
    deadline_seconds: int | None = None,
    priority: str = "normal",
    owner_agent_id: str | None = None,
    status: str | None = None,
    blockers: list[str] | None = None,
    handoff_id: str | None = None,
    requires_ack: bool | None = None,
    accepted_by: str | None = None,
    declined_reason: str | None = None,
    context: dict[str, Any] | None = None,
) -> dict[str, Any]:
    return {
        "from": from_agent,
        "to": to,
        "task": {
            "task_id": task_id or f"task_{_uid()}",
            "thread_id": thread_id,
            "description": description,
            "constraints": constraints or [],
            "definition_of_done": definition_of_done,
            "deadline_seconds": deadline_seconds,
            "priority": priority,
            "owner_agent_id": owner_agent_id,
            "status": status or "proposed",
            "blockers": blockers or [],
        },
        "handoff_id": handoff_id or f"handoff_{_uid()}",
        "status": status or "proposed",
        "requires_ack": requires_ack,
        "accepted_by": accepted_by,
        "declined_reason": declined_reason,
        "context": context or {},
        "artifacts": [],
        "prior_steps": [],
    }


# ── Review ────────────────────────────────────────────────────────────────────

def review(
    *,
    reviewer: str,
    author: str,
    verdict: str,
    feedback: str | None = None,
    score: float | None = None,
    revision_instructions: str | None = None,
    strengths: list[str] | None = None,
    issues: list[dict[str, Any]] | None = None,
    round: int = 1,
) -> dict[str, Any]:
    return {
        "reviewer": reviewer,
        "author": author,
        "verdict": verdict,
        "feedback": feedback,
        "score": score,
        "revision_instructions": revision_instructions,
        "strengths": strengths or [],
        "issues": issues or [],
        "round": round,
        "max_rounds": 3,
    }


# ── Artifact ──────────────────────────────────────────────────────────────────

def artifact(
    *,
    kind: str,
    title: str,
    content: str,
    mime_type: str | None = None,
    metadata: dict[str, Any] | None = None,
) -> dict[str, Any]:
    return {
        "artifact_id": f"artifact_{_uid()}",
        "kind": kind,
        "title": title,
        "content": content,
        "mime_type": mime_type,
        "metadata": metadata or {},
        "version": 1,
    }


# ── Activity ──────────────────────────────────────────────────────────────────

def activity(
    *,
    agent_id: str,
    activity_type: str,
    detail: str | None = None,
    tool: dict[str, Any] | None = None,
    browser: dict[str, Any] | None = None,
    cost: dict[str, Any] | None = None,
) -> dict[str, Any]:
    return {
        "agent_id": agent_id,
        "activity": activity_type,
        "detail": detail,
        "tool": tool,
        "browser": browser,
        "cost": cost,
    }


# ── Capabilities ──────────────────────────────────────────────────────────────

def capabilities(
    *,
    agent_id: str,
    name: str,
    description: str | None = None,
    role: str | None = None,
    personality: dict[str, Any] | None = None,
    skills: list[dict[str, Any]] | None = None,
    connectors: list[str] | None = None,
    accepts_intents: list[str] | None = None,
    max_concurrent_tasks: int = 1,
    presence: dict[str, Any] | None = None,
) -> dict[str, Any]:
    return {
        "agent_id": agent_id,
        "name": name,
        "description": description,
        "role": role,
        "personality": personality,
        "skills": skills or [],
        "connectors": connectors or [],
        "accepts_intents": accepts_intents or [],
        "max_concurrent_tasks": max_concurrent_tasks,
        "presence": presence,
    }


def provenance_graph(
    *,
    run_id: str,
    claims: list[dict[str, Any]],
    contradictions: list[dict[str, Any]] | None = None,
    graph_id: str | None = None,
) -> dict[str, Any]:
    return {
        "graph_id": graph_id or f"graph_{_uid()}",
        "run_id": run_id,
        "claims": claims,
        "contradictions": contradictions or [],
    }


def challenge(
    *,
    claim_id: str,
    challenger: str,
    target_agent_id: str,
    reason: str,
    challenge_id: str | None = None,
    status: str = "open",
    requested_action: str | None = None,
    claim_excerpt: str | None = None,
    thread_id: str | None = None,
    task_id: str | None = None,
    task_title: str | None = None,
) -> dict[str, Any]:
    return {
        "challenge_id": challenge_id or f"challenge_{_uid()}",
        "claim_id": claim_id,
        "challenger": challenger,
        "target_agent_id": target_agent_id,
        "reason": reason,
        "status": status,
        "requested_action": requested_action,
        "claim_excerpt": claim_excerpt,
        "thread_id": thread_id,
        "task_id": task_id,
        "task_title": task_title,
    }


def challenge_resolution(
    *,
    challenge_id: str,
    resolver_agent_id: str,
    outcome: str,
    summary: str,
    claim_id: str | None = None,
    target_agent_id: str | None = None,
    replacement_claim_ids: list[str] | None = None,
    thread_id: str | None = None,
    task_id: str | None = None,
    task_title: str | None = None,
) -> dict[str, Any]:
    return {
        "challenge_id": challenge_id,
        "claim_id": claim_id,
        "resolver_agent_id": resolver_agent_id,
        "target_agent_id": target_agent_id,
        "outcome": outcome,
        "summary": summary,
        "replacement_claim_ids": replacement_claim_ids or [],
        "thread_id": thread_id,
        "task_id": task_id,
        "task_title": task_title,
    }


def decision(
    *,
    agent_id: str,
    category: str,
    summary: str,
    decision_id: str | None = None,
    step_index: int | None = None,
    options: list[dict[str, Any]] | None = None,
    chosen_option_id: str | None = None,
    reasoning: str | None = None,
    related_event_ids: list[str] | None = None,
) -> dict[str, Any]:
    return {
        "decision_id": decision_id or f"decision_{_uid()}",
        "step_index": step_index,
        "agent_id": agent_id,
        "category": category,
        "summary": summary,
        "options": options or [],
        "chosen_option_id": chosen_option_id,
        "reasoning": reasoning,
        "related_event_ids": related_event_ids or [],
    }


def branch_plan(
    *,
    run_id: str,
    source_decision_id: str,
    summary: str,
    branch_id: str | None = None,
    source_step_index: int | None = None,
    status: str = "planned",
    assumptions: list[str] | None = None,
    preview_event_ids: list[str] | None = None,
    overrides: dict[str, Any] | None = None,
    created_at: str | None = None,
) -> dict[str, Any]:
    return {
        "branch_id": branch_id or f"branch_{_uid()}",
        "run_id": run_id,
        "source_decision_id": source_decision_id,
        "source_step_index": source_step_index,
        "status": status,
        "summary": summary,
        "assumptions": assumptions or [],
        "preview_event_ids": preview_event_ids or [],
        "overrides": overrides or {},
        "created_at": created_at or _now(),
    }


def branch_run(
    *,
    source_run_id: str,
    branch_id: str,
    branched_run_id: str,
    summary: str,
    requested_by_agent_id: str,
    branch_run_id: str | None = None,
    status: str = "created",
    source_decision_id: str | None = None,
    source_step_index: int | None = None,
    notes: list[str] | None = None,
    created_at: str | None = None,
) -> dict[str, Any]:
    return {
        "branch_run_id": branch_run_id or f"branch_run_{_uid()}",
        "source_run_id": source_run_id,
        "branch_id": branch_id,
        "branched_run_id": branched_run_id,
        "status": status,
        "summary": summary,
        "requested_by_agent_id": requested_by_agent_id,
        "source_decision_id": source_decision_id,
        "source_step_index": source_step_index,
        "notes": notes or [],
        "created_at": created_at or _now(),
    }
