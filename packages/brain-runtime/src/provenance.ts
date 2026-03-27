import type {
  ACPArtifact,
  ACPEvent,
  ACPMessage,
  ACPProvenanceGraph,
  ACPReview,
  ProvenanceClaim,
  ProvenanceContradiction,
  ProvenanceSourceRef,
  ProvenanceTier,
} from "@maia/acp";

export interface ClaimExtractionResult {
  claims: ProvenanceClaim[];
}

const URL_PATTERN = /\bhttps?:\/\/[^\s)]+/gi;
const SENTENCE_SPLIT = /(?<=[.!?])\s+|\n+/g;
const NUMBER_PATTERN = /-?\d+(?:\.\d+)?(?:%|[mbk]| billion| million| thousand)?/gi;

function compactText(text: string): string {
  return String(text || "").replace(/\s+/g, " ").trim();
}

function slug(value: string): string {
  return compactText(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 60) || "item";
}

function sourceId(kind: ProvenanceSourceRef["kind"], seed: string): string {
  return `${kind}_${slug(seed)}`;
}

function uniqueSourceRefs(sourceRefs: ProvenanceSourceRef[]): ProvenanceSourceRef[] {
  const seen = new Set<string>();
  const result: ProvenanceSourceRef[] = [];
  for (const sourceRef of sourceRefs) {
    const key = `${sourceRef.kind}:${sourceRef.source_id}:${sourceRef.uri ?? ""}:${sourceRef.artifact_id ?? ""}:${sourceRef.event_id ?? ""}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    result.push(sourceRef);
  }
  return result;
}

function tierForSources(sourceCount: number): ProvenanceTier {
  if (sourceCount >= 2) {
    return "verified";
  }
  if (sourceCount === 1) {
    return "supported";
  }
  return "inferred";
}

function confidenceForTier(tier: ProvenanceTier, sourceCount: number): number {
  if (tier === "verified") {
    return Math.min(0.95, 0.72 + sourceCount * 0.08);
  }
  if (tier === "supported") {
    return 0.68;
  }
  if (tier === "inferred") {
    return 0.48;
  }
  return 0.2;
}

function extractUrls(text: string): string[] {
  return Array.from(new Set(String(text || "").match(URL_PATTERN) ?? []));
}

function sentenceCandidates(text: string, maxClaims: number): string[] {
  const parts = compactText(text)
    .split(SENTENCE_SPLIT)
    .map((part) => compactText(part))
    .filter((part) => part.length >= 25 && part.length <= 280);
  return parts.slice(0, maxClaims);
}

function claimId(agentId: string, eventId: string, text: string, index: number): string {
  return `claim_${slug(agentId)}_${slug(eventId)}_${index}_${slug(text).slice(0, 18)}`;
}

function contradictionId(claimAId: string, claimBId: string): string {
  const ordered = [claimAId, claimBId].sort();
  return `contradiction_${ordered.join("_")}`;
}

function syntheticEventId(event: ACPEvent, index: number): string {
  return `${event.run_id}_${event.sequence ?? index}_${event.event_type}`;
}

function buildMessageSources(payload: ACPMessage, event: ACPEvent, eventId: string): ProvenanceSourceRef[] {
  const urls = extractUrls(payload.content).map((url) => ({
    source_id: sourceId("url", url),
    kind: "url" as const,
    uri: url,
    title: url,
    event_id: eventId,
    accessed_at: event.timestamp,
  }));
  const artifacts = (payload.artifacts ?? []).map((artifact) => ({
    source_id: sourceId("artifact", artifact.artifact_id),
    kind: "artifact" as const,
    artifact_id: artifact.artifact_id,
    title: artifact.title,
    uri: artifact.content_url,
    event_id: eventId,
    excerpt: compactText(artifact.content).slice(0, 160),
    accessed_at: event.timestamp,
  }));
  return uniqueSourceRefs([...urls, ...artifacts]);
}

function buildArtifactSources(payload: ACPArtifact, event: ACPEvent, eventId: string): ProvenanceSourceRef[] {
  const refs: ProvenanceSourceRef[] = [
    {
      source_id: sourceId(payload.kind === "pdf" ? "document" : "artifact", payload.artifact_id),
      kind: payload.kind === "pdf" ? "document" : "artifact",
      artifact_id: payload.artifact_id,
      title: payload.title,
      uri: payload.content_url,
      event_id: eventId,
      excerpt: compactText(payload.content).slice(0, 160),
      accessed_at: event.timestamp,
    },
  ];
  for (const url of extractUrls(payload.content)) {
    refs.push({
      source_id: sourceId("url", url),
      kind: "url",
      uri: url,
      title: url,
      event_id: eventId,
      accessed_at: event.timestamp,
    });
  }
  return uniqueSourceRefs(refs);
}

function buildReviewSources(payload: ACPReview, eventId: string, timestamp: string): ProvenanceSourceRef[] {
  return [
    {
      source_id: sourceId("reasoning", `${payload.reviewer}_${payload.author}_${payload.artifact_id ?? payload.feedback ?? "review"}`),
      kind: "reasoning",
      title: `Review by ${payload.reviewer}`,
      event_id: eventId,
      excerpt: compactText(payload.feedback ?? payload.revision_instructions ?? payload.verdict),
      accessed_at: timestamp,
    },
  ];
}

function normalizeClaimPattern(text: string): string {
  const withoutUrls = compactText(text).replace(URL_PATTERN, " ");
  return withoutUrls
    .toLowerCase()
    .replace(NUMBER_PATTERN, "#")
    .replace(/[^a-z# ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractNumbers(text: string): string[] {
  return (compactText(text).match(NUMBER_PATTERN) ?? []).map((value) => value.toLowerCase());
}

export function extractClaimsFromText(input: {
  text: string;
  agentId: string;
  eventId: string;
  sourceRefs?: ProvenanceSourceRef[];
  metadata?: Record<string, unknown>;
  maxClaims?: number;
}): ClaimExtractionResult {
  const claims = sentenceCandidates(input.text, input.maxClaims ?? 4).map((sentence, index) => {
    const sourceRefs = uniqueSourceRefs(input.sourceRefs ?? []);
    const tier = tierForSources(sourceRefs.length);
    return {
      claim_id: claimId(input.agentId, input.eventId, sentence, index),
      text: sentence,
      agent_id: input.agentId,
      tier,
      confidence: confidenceForTier(tier, sourceRefs.length),
      source_refs: sourceRefs,
      supports: [],
      contradicts: [],
      metadata: input.metadata ?? {},
    } satisfies ProvenanceClaim;
  });
  return { claims };
}

export function detectContradictions(claims: ProvenanceClaim[]): ProvenanceContradiction[] {
  const contradictions: ProvenanceContradiction[] = [];
  for (let index = 0; index < claims.length; index++) {
    for (let inner = index + 1; inner < claims.length; inner++) {
      const claimA = claims[index];
      const claimB = claims[inner];
      if (claimA.claim_id === claimB.claim_id) {
        continue;
      }
      const patternA = normalizeClaimPattern(claimA.text);
      const patternB = normalizeClaimPattern(claimB.text);
      if (!patternA || patternA !== patternB) {
        continue;
      }
      const numbersA = extractNumbers(claimA.text);
      const numbersB = extractNumbers(claimB.text);
      if (numbersA.length === 0 || numbersB.length === 0) {
        continue;
      }
      if (numbersA.join("|") === numbersB.join("|")) {
        continue;
      }
      contradictions.push({
        contradiction_id: contradictionId(claimA.claim_id, claimB.claim_id),
        claim_a_id: claimA.claim_id,
        claim_b_id: claimB.claim_id,
        status: "unresolved",
      });
    }
  }
  return contradictions;
}

export function buildProvenanceGraph(events: ACPEvent[]): ACPProvenanceGraph {
  const claims: ProvenanceClaim[] = [];
  const explicitGraphs: ACPProvenanceGraph[] = [];

  events.forEach((event, index) => {
    const eventId = syntheticEventId(event, index);
    if (event.event_type === "provenance") {
      explicitGraphs.push(event.payload as ACPProvenanceGraph);
      return;
    }

    if (event.event_type === "message") {
      const payload = event.payload as ACPMessage;
      claims.push(
        ...extractClaimsFromText({
          text: payload.content,
          agentId: payload.from,
          eventId,
          sourceRefs: buildMessageSources(payload, event, eventId),
          metadata: {
            event_type: event.event_type,
            message_intent: payload.intent,
            thread_id: payload.context?.thread_id,
          },
        }).claims,
      );
      return;
    }

    if (event.event_type === "artifact") {
      const payload = event.payload as ACPArtifact;
      claims.push(
        ...extractClaimsFromText({
          text: payload.content,
          agentId: event.agent_id,
          eventId,
          sourceRefs: buildArtifactSources(payload, event, eventId),
          metadata: {
            event_type: event.event_type,
            artifact_kind: payload.kind,
            artifact_id: payload.artifact_id,
          },
          maxClaims: 5,
        }).claims,
      );
      return;
    }

    if (event.event_type === "review") {
      const payload = event.payload as ACPReview;
      const reviewText = compactText([payload.feedback, payload.revision_instructions].filter(Boolean).join(". "));
      if (!reviewText) {
        return;
      }
      claims.push(
        ...extractClaimsFromText({
          text: reviewText,
          agentId: payload.reviewer,
          eventId,
          sourceRefs: buildReviewSources(payload, eventId, event.timestamp),
          metadata: {
            event_type: event.event_type,
            verdict: payload.verdict,
            author: payload.author,
          },
          maxClaims: 3,
        }).claims,
      );
    }
  });

  const explicitClaims = explicitGraphs.flatMap((graph) => graph.claims ?? []);
  const explicitContradictions = explicitGraphs.flatMap((graph) => graph.contradictions ?? []);
  const mergedClaims = [...explicitClaims, ...claims];
  const contradictions = [
    ...explicitContradictions,
    ...detectContradictions(mergedClaims),
  ];

  const contradictionMap = new Map<string, ProvenanceClaim>();
  for (const claim of mergedClaims) {
    contradictionMap.set(claim.claim_id, { ...claim, contradicts: [...claim.contradicts] });
  }
  for (const contradiction of contradictions) {
    contradictionMap.get(contradiction.claim_a_id)?.contradicts.push(contradiction.claim_b_id);
    contradictionMap.get(contradiction.claim_b_id)?.contradicts.push(contradiction.claim_a_id);
  }

  return {
    graph_id: explicitGraphs.at(-1)?.graph_id ?? `graph_${events.at(-1)?.run_id ?? "unknown"}`,
    run_id: explicitGraphs.at(-1)?.run_id ?? events.at(-1)?.run_id ?? "",
    claims: Array.from(contradictionMap.values()).map((claim: ProvenanceClaim) => ({
      ...claim,
      contradicts: Array.from(new Set(claim.contradicts)),
    })),
    contradictions: Array.from(
      new Map<string, ProvenanceContradiction>(
        contradictions.map((contradiction: ProvenanceContradiction) => [contradiction.contradiction_id, contradiction]),
      ).values(),
    ),
  };
}

export function staleClaims(graph: ACPProvenanceGraph, maxAgeDays = 90): ProvenanceClaim[] {
  const maxAgeMs = maxAgeDays * 24 * 60 * 60 * 1000;
  const now = Date.now();
  return graph.claims.filter((claim: ProvenanceClaim) =>
    claim.source_refs.some((sourceRef: ProvenanceSourceRef) => {
      const stamp = sourceRef.published_at ?? sourceRef.accessed_at;
      if (!stamp) {
        return false;
      }
      const time = Date.parse(stamp);
      if (Number.isNaN(time)) {
        return false;
      }
      return now - time > maxAgeMs;
    }),
  );
}
