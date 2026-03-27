from __future__ import annotations

import json
import re

from pydantic import BaseModel

from maia_acp import ACPChallenge, ACPChallengeResolution, ACPEvent, ACPProvenanceGraph, challenge as build_challenge
from maia_acp import challenge_resolution as build_challenge_resolution
from maia_acp import envelope
from maia_acp.types import ProvenanceClaim
from maia_brain.llm import call_llm
from maia_brain.types import LLMConfig, LLMResult


class ChallengeResolutionResult(BaseModel):
    resolution: ACPEvent
    cost: LLMResult


def _empty_cost(llm: LLMConfig | None = None) -> LLMResult:
    return LLMResult(content="", tokens=0, cost=0.0)


def _claim_by_id(graph: ACPProvenanceGraph | None, claim_id: str) -> ProvenanceClaim | None:
    if not graph:
        return None
    for claim in graph.claims:
        if claim.claim_id == claim_id:
            return claim
    return None


def _challenge_payload(challenge: ACPChallenge | ACPEvent) -> ACPChallenge:
    if isinstance(challenge, ACPChallenge):
        return challenge
    return challenge.as_challenge()


def _fallback_resolution(challenge: ACPChallenge, claim: ProvenanceClaim | None) -> tuple[str, str]:
    if claim is None or not claim.source_refs:
        return "retracted", "Challenge sustained. The claim has no supporting sources attached and should be withdrawn."
    if claim.contradicts:
        return "reframed", f"The claim conflicts with {len(claim.contradicts)} other claim(s) and needs scope clarification before it can stand as written."
    if claim.tier in {"verified", "supported"}:
        return "defended", f"Challenge answered. The claim remains supported by {len(claim.source_refs)} attached source(s)."
    return "retracted", "Challenge sustained. The claim is only inferred and does not have enough evidence to remain active."


def _resolution_system_prompt() -> str:
    return " ".join([
        "You resolve structured provenance challenges for an AI team.",
        "Given a challenged claim and its evidence, decide whether the claim is defended, retracted, reframed, or escalated.",
        "Use retracted when the evidence is missing or too weak.",
        "Use reframed when the claim may be directionally right but needs narrower wording or scope.",
        "Return JSON only with keys: outcome, summary.",
    ])


def _resolution_user_prompt(challenge: ACPChallenge, claim: ProvenanceClaim | None) -> str:
    source_summary = "\n".join(
        f"{source_ref.kind}: {source_ref.title or source_ref.uri or source_ref.source_id}"
        for source_ref in (claim.source_refs[:5] if claim else [])
    )
    lines = [
        f"Claim id: {challenge.claim_id}",
        f"Claim text: {claim.text if claim else challenge.claim_excerpt or '(missing claim text)'}",
        f"Claim tier: {claim.tier if claim else 'unknown'}",
        f"Claim confidence: {claim.confidence if claim else 'unknown'}",
        f"Challenge reason: {challenge.reason}",
        f"Requested action: {challenge.requested_action or 'unspecified'}",
        f"Contradictions: {len(claim.contradicts) if claim else 0}",
        "Sources:",
        source_summary or "(none)",
    ]
    return "\n".join(lines)


def challenge_claim(
    *,
    run_id: str,
    claim_id: str,
    challenger: str,
    reason: str,
    target_agent_id: str | None = None,
    graph: ACPProvenanceGraph | None = None,
    thread_id: str | None = None,
    task_id: str | None = None,
    task_title: str | None = None,
    requested_action: str | None = None,
    parent_event_id: str | None = None,
) -> ACPEvent:
    claim = _claim_by_id(graph, claim_id)
    payload = build_challenge(
        claim_id=claim_id,
        challenger=challenger,
        target_agent_id=target_agent_id or (claim.agent_id if claim else "agent://unknown"),
        reason=reason,
        requested_action=requested_action,
        claim_excerpt=claim.text if claim else None,
        thread_id=thread_id,
        task_id=task_id,
        task_title=task_title,
    )
    return envelope(challenger, run_id, "challenge", payload, parent_event_id=parent_event_id)


async def resolve_challenge(
    *,
    run_id: str,
    challenge: ACPChallenge | ACPEvent,
    graph: ACPProvenanceGraph | None = None,
    llm: LLMConfig | None = None,
    parent_event_id: str | None = None,
) -> ChallengeResolutionResult:
    payload = _challenge_payload(challenge)
    claim = _claim_by_id(graph, payload.claim_id)
    outcome, summary = _fallback_resolution(payload, claim)
    cost = _empty_cost(llm)

    if llm is not None:
        try:
            llm_result = await call_llm(llm, _resolution_system_prompt(), _resolution_user_prompt(payload, claim))
            cost = llm_result
            match = re.search(r"[\[{][\s\S]*[\]}]", llm_result.content)
            if match:
                parsed = json.loads(match.group())
                if isinstance(parsed, dict):
                    outcome = parsed.get("outcome", outcome)
                    summary = parsed.get("summary", summary)
        except Exception:
            pass

    resolution_payload = build_challenge_resolution(
        challenge_id=payload.challenge_id,
        claim_id=payload.claim_id,
        resolver_agent_id=payload.target_agent_id,
        target_agent_id=payload.challenger,
        outcome=outcome,
        summary=summary,
        thread_id=payload.thread_id,
        task_id=payload.task_id,
        task_title=payload.task_title,
    )
    event = envelope(
        payload.target_agent_id,
        run_id,
        "challenge_resolution",
        resolution_payload,
        parent_event_id=parent_event_id or (challenge.parent_event_id if isinstance(challenge, ACPEvent) else None),
    )
    return ChallengeResolutionResult(resolution=event, cost=cost)
