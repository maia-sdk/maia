"""Read-only provenance graph helpers for ACP event streams."""

from __future__ import annotations

import re
from datetime import datetime, timezone
from typing import Any

from maia_acp.types import (
    ACPArtifact,
    ACPEvent,
    ACPMessage,
    ACPProvenanceGraph,
    ACPReview,
    ProvenanceClaim,
    ProvenanceContradiction,
    ProvenanceSourceRef,
)

URL_PATTERN = re.compile(r"\bhttps?://[^\s)]+", re.IGNORECASE)
SENTENCE_SPLIT = re.compile(r"(?<=[.!?])\s+|\n+")
NUMBER_PATTERN = re.compile(r"-?\d+(?:\.\d+)?(?:%|[mbk]| billion| million| thousand)?", re.IGNORECASE)


def _compact_text(text: str) -> str:
    return re.sub(r"\s+", " ", str(text or "")).strip()


def _slug(value: str) -> str:
    compact = _compact_text(value).lower()
    compact = re.sub(r"[^a-z0-9]+", "_", compact).strip("_")
    return compact[:60] or "item"


def _source_id(kind: str, seed: str) -> str:
    return f"{kind}_{_slug(seed)}"


def _tier_for_sources(source_count: int) -> str:
    if source_count >= 2:
        return "verified"
    if source_count == 1:
        return "supported"
    return "inferred"


def _confidence_for_tier(tier: str, source_count: int) -> float:
    if tier == "verified":
        return min(0.95, 0.72 + source_count * 0.08)
    if tier == "supported":
        return 0.68
    if tier == "inferred":
        return 0.48
    return 0.2


def _extract_urls(text: str) -> list[str]:
    return list(dict.fromkeys(URL_PATTERN.findall(str(text or ""))))


def _sentence_candidates(text: str, max_claims: int) -> list[str]:
    return [
        candidate
        for candidate in (_compact_text(part) for part in SENTENCE_SPLIT.split(_compact_text(text)))
        if 25 <= len(candidate) <= 280
    ][:max_claims]


def _claim_id(agent_id: str, event_id: str, text: str, index: int) -> str:
    return f"claim_{_slug(agent_id)}_{_slug(event_id)}_{index}_{_slug(text)[:18]}"


def _contradiction_id(claim_a_id: str, claim_b_id: str) -> str:
    ordered = sorted([claim_a_id, claim_b_id])
    return f"contradiction_{ordered[0]}_{ordered[1]}"


def _synthetic_event_id(event: ACPEvent, index: int) -> str:
    return f"{event.run_id}_{event.sequence or index}_{event.event_type}"


def _unique_source_refs(source_refs: list[ProvenanceSourceRef]) -> list[ProvenanceSourceRef]:
    seen: set[str] = set()
    result: list[ProvenanceSourceRef] = []
    for source_ref in source_refs:
        key = f"{source_ref.kind}:{source_ref.source_id}:{source_ref.uri or ''}:{source_ref.artifact_id or ''}:{source_ref.event_id or ''}"
        if key in seen:
            continue
        seen.add(key)
        result.append(source_ref)
    return result


def _message_sources(payload: ACPMessage, event: ACPEvent, event_id: str) -> list[ProvenanceSourceRef]:
    refs = [
        ProvenanceSourceRef(
            source_id=_source_id("url", url),
            kind="url",
            uri=url,
            title=url,
            event_id=event_id,
            accessed_at=event.timestamp,
        )
        for url in _extract_urls(payload.content)
    ]
    refs.extend(
        ProvenanceSourceRef(
            source_id=_source_id("artifact", artifact.artifact_id),
            kind="artifact",
            artifact_id=artifact.artifact_id,
            title=artifact.title,
            uri=artifact.content_url,
            event_id=event_id,
            excerpt=_compact_text(artifact.content)[:160],
            accessed_at=event.timestamp,
        )
        for artifact in (payload.artifacts or [])
    )
    return _unique_source_refs(refs)


def _artifact_sources(payload: ACPArtifact, event: ACPEvent, event_id: str) -> list[ProvenanceSourceRef]:
    refs = [
        ProvenanceSourceRef(
            source_id=_source_id("document" if payload.kind == "pdf" else "artifact", payload.artifact_id),
            kind="document" if payload.kind == "pdf" else "artifact",
            artifact_id=payload.artifact_id,
            title=payload.title,
            uri=payload.content_url,
            event_id=event_id,
            excerpt=_compact_text(payload.content)[:160],
            accessed_at=event.timestamp,
        )
    ]
    refs.extend(
        ProvenanceSourceRef(
            source_id=_source_id("url", url),
            kind="url",
            uri=url,
            title=url,
            event_id=event_id,
            accessed_at=event.timestamp,
        )
        for url in _extract_urls(payload.content)
    )
    return _unique_source_refs(refs)


def _review_sources(payload: ACPReview, event_id: str, timestamp: str) -> list[ProvenanceSourceRef]:
    return [
        ProvenanceSourceRef(
            source_id=_source_id("reasoning", f"{payload.reviewer}_{payload.author}_{payload.artifact_id or payload.feedback or 'review'}"),
            kind="reasoning",
            title=f"Review by {payload.reviewer}",
            event_id=event_id,
            excerpt=_compact_text(payload.feedback or payload.revision_instructions or payload.verdict),
            accessed_at=timestamp,
        )
    ]


def extract_claims_from_text(
    *,
    text: str,
    agent_id: str,
    event_id: str,
    source_refs: list[ProvenanceSourceRef] | None = None,
    metadata: dict[str, Any] | None = None,
    max_claims: int = 4,
) -> list[ProvenanceClaim]:
    refs = _unique_source_refs(source_refs or [])
    tier = _tier_for_sources(len(refs))
    return [
        ProvenanceClaim(
            claim_id=_claim_id(agent_id, event_id, sentence, index),
            text=sentence,
            agent_id=agent_id,
            tier=tier,
            confidence=_confidence_for_tier(tier, len(refs)),
            source_refs=refs,
            supports=[],
            contradicts=[],
            metadata=metadata or {},
        )
        for index, sentence in enumerate(_sentence_candidates(text, max_claims))
    ]


def _normalized_pattern(text: str) -> str:
    normalized = _compact_text(text).lower()
    normalized = NUMBER_PATTERN.sub("#", normalized)
    normalized = re.sub(r"[^a-z# ]+", " ", normalized)
    return re.sub(r"\s+", " ", normalized).strip()


def _numbers(text: str) -> list[str]:
    return [value.lower() for value in NUMBER_PATTERN.findall(_compact_text(text))]


def detect_contradictions(claims: list[ProvenanceClaim]) -> list[ProvenanceContradiction]:
    contradictions: list[ProvenanceContradiction] = []
    for index, claim_a in enumerate(claims):
        for claim_b in claims[index + 1 :]:
            if _normalized_pattern(claim_a.text) != _normalized_pattern(claim_b.text):
                continue
            numbers_a = _numbers(claim_a.text)
            numbers_b = _numbers(claim_b.text)
            if not numbers_a or not numbers_b or numbers_a == numbers_b:
                continue
            contradictions.append(
                ProvenanceContradiction(
                    contradiction_id=_contradiction_id(claim_a.claim_id, claim_b.claim_id),
                    claim_a_id=claim_a.claim_id,
                    claim_b_id=claim_b.claim_id,
                    status="unresolved",
                )
            )
    return contradictions


def build_provenance_graph(events: list[ACPEvent]) -> ACPProvenanceGraph:
    claims: list[ProvenanceClaim] = []
    explicit_graphs: list[ACPProvenanceGraph] = []

    for index, event in enumerate(events):
        event_id = _synthetic_event_id(event, index)
        if event.event_type == "provenance":
            explicit_graphs.append(event.as_provenance())
            continue
        if event.event_type == "message":
            payload = event.as_message()
            claims.extend(
                extract_claims_from_text(
                    text=payload.content,
                    agent_id=payload.from_agent,
                    event_id=event_id,
                    source_refs=_message_sources(payload, event, event_id),
                    metadata={
                        "event_type": event.event_type,
                        "message_intent": payload.intent,
                        "thread_id": (payload.context or {}).get("thread_id"),
                    },
                )
            )
            continue
        if event.event_type == "artifact":
            payload = event.as_artifact()
            claims.extend(
                extract_claims_from_text(
                    text=payload.content,
                    agent_id=event.agent_id,
                    event_id=event_id,
                    source_refs=_artifact_sources(payload, event, event_id),
                    metadata={
                        "event_type": event.event_type,
                        "artifact_kind": payload.kind,
                        "artifact_id": payload.artifact_id,
                    },
                    max_claims=5,
                )
            )
            continue
        if event.event_type == "review":
            payload = event.as_review()
            review_text = _compact_text(". ".join(part for part in [payload.feedback, payload.revision_instructions] if part))
            if review_text:
                claims.extend(
                    extract_claims_from_text(
                        text=review_text,
                        agent_id=payload.reviewer,
                        event_id=event_id,
                        source_refs=_review_sources(payload, event_id, event.timestamp),
                        metadata={
                            "event_type": event.event_type,
                            "verdict": payload.verdict,
                            "author": payload.author,
                        },
                        max_claims=3,
                    )
                )

    merged_claims = [claim for graph in explicit_graphs for claim in graph.claims] + claims
    contradictions = [item for graph in explicit_graphs for item in graph.contradictions] + detect_contradictions(merged_claims)

    claim_map: dict[str, ProvenanceClaim] = {
        claim.claim_id: claim.model_copy(deep=True)
        for claim in merged_claims
    }
    for contradiction in contradictions:
        if contradiction.claim_a_id in claim_map:
            claim_map[contradiction.claim_a_id].contradicts.append(contradiction.claim_b_id)
        if contradiction.claim_b_id in claim_map:
            claim_map[contradiction.claim_b_id].contradicts.append(contradiction.claim_a_id)

    deduped_contradictions = list({item.contradiction_id: item for item in contradictions}.values())
    final_claims = []
    for claim in claim_map.values():
        clone = claim.model_copy(deep=True)
        clone.contradicts = list(dict.fromkeys(clone.contradicts))
        final_claims.append(clone)

    return ACPProvenanceGraph(
        graph_id=explicit_graphs[-1].graph_id if explicit_graphs else f"graph_{events[-1].run_id if events else 'unknown'}",
        run_id=explicit_graphs[-1].run_id if explicit_graphs else (events[-1].run_id if events else ""),
        claims=final_claims,
        contradictions=deduped_contradictions,
    )


def stale_claims(graph: ACPProvenanceGraph, max_age_days: int = 90) -> list[ProvenanceClaim]:
    max_age_seconds = max_age_days * 24 * 60 * 60
    now = datetime.now(timezone.utc)
    stale: list[ProvenanceClaim] = []
    for claim in graph.claims:
        for source_ref in claim.source_refs:
            stamp = source_ref.published_at or source_ref.accessed_at
            if not stamp:
                continue
            try:
                parsed = datetime.fromisoformat(stamp.replace("Z", "+00:00"))
            except ValueError:
                continue
            if (now - parsed).total_seconds() > max_age_seconds:
                stale.append(claim)
                break
    return stale
