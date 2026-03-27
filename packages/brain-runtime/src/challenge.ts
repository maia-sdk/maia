import {
  challenge as buildChallenge,
  challengeResolution as buildChallengeResolution,
  envelope,
} from "@maia/acp";
import type {
  ACPChallenge,
  ACPChallengeResolution,
  ACPEvent,
  ACPProvenanceGraph,
  ProvenanceClaim,
} from "@maia/acp";
import { callLLMJson } from "./llm";
import type { LLMCallResult } from "./llm";
import type { LLMConfig } from "./types";

export interface ChallengeClaimOptions {
  runId: string;
  claimId: string;
  challenger: string;
  reason: string;
  targetAgentId?: string;
  graph?: ACPProvenanceGraph;
  threadId?: string;
  taskId?: string;
  taskTitle?: string;
  requestedAction?: ACPChallenge["requested_action"];
  parentEventId?: string;
}

export interface ResolveChallengeOptions {
  runId: string;
  challenge: ACPChallenge | ACPEvent<ACPChallenge>;
  graph?: ACPProvenanceGraph;
  llm?: LLMConfig;
  parentEventId?: string;
}

export interface ChallengeResolutionResult {
  resolution: ACPEvent<ACPChallengeResolution>;
  cost: LLMCallResult;
}

function emptyCost(llm?: LLMConfig): LLMCallResult {
  return {
    text: "",
    tokensUsed: 0,
    costUsd: 0,
    model: llm?.model ?? "gpt-4o",
    success: true,
  };
}

function claimById(graph: ACPProvenanceGraph | undefined, claimId: string): ProvenanceClaim | undefined {
  return graph?.claims.find((claim) => claim.claim_id === claimId);
}

function challengePayload(input: ACPChallenge | ACPEvent<ACPChallenge>): ACPChallenge {
  return "payload" in input ? input.payload : input;
}

function challengeParentEventId(input: ACPChallenge | ACPEvent<ACPChallenge>, override?: string): string | undefined {
  if (override) {
    return override;
  }
  return "parent_event_id" in input ? input.parent_event_id : undefined;
}

function fallbackResolution(challenge: ACPChallenge, claim?: ProvenanceClaim): {
  outcome: ACPChallengeResolution["outcome"];
  summary: string;
} {
  if (!claim || claim.source_refs.length === 0) {
    return {
      outcome: "retracted",
      summary: "Challenge sustained. The claim has no supporting sources attached and should be withdrawn.",
    };
  }
  if (claim.contradicts.length > 0) {
    return {
      outcome: "reframed",
      summary: `The claim conflicts with ${claim.contradicts.length} other claim(s) and needs scope clarification before it can stand as written.`,
    };
  }
  if (claim.tier === "verified" || claim.tier === "supported") {
    return {
      outcome: "defended",
      summary: `Challenge answered. The claim remains supported by ${claim.source_refs.length} attached source(s).`,
    };
  }
  return {
    outcome: "retracted",
    summary: "Challenge sustained. The claim is only inferred and does not have enough evidence to remain active.",
  };
}

function resolutionSystemPrompt(): string {
  return [
    "You resolve structured provenance challenges for an AI team.",
    "Given a challenged claim and its evidence, decide whether the claim is defended, retracted, reframed, or escalated.",
    "Use retracted when the evidence is missing or too weak.",
    "Use reframed when the claim may be directionally right but needs narrower wording or scope.",
    "Return JSON only with keys: outcome, summary.",
  ].join(" ");
}

function resolutionUserPrompt(challenge: ACPChallenge, claim?: ProvenanceClaim): string {
  const sourceSummary = (claim?.source_refs ?? [])
    .slice(0, 5)
    .map((sourceRef) => `${sourceRef.kind}: ${sourceRef.title ?? sourceRef.uri ?? sourceRef.source_id}`)
    .join("\n");
  return [
    `Claim id: ${challenge.claim_id}`,
    `Claim text: ${claim?.text ?? challenge.claim_excerpt ?? "(missing claim text)"}`,
    `Claim tier: ${claim?.tier ?? "unknown"}`,
    `Claim confidence: ${claim?.confidence ?? "unknown"}`,
    `Challenge reason: ${challenge.reason}`,
    `Requested action: ${challenge.requested_action ?? "unspecified"}`,
    `Contradictions: ${claim?.contradicts.length ?? 0}`,
    "Sources:",
    sourceSummary || "(none)",
  ].join("\n");
}

export function challengeClaim(options: ChallengeClaimOptions): ACPEvent<ACPChallenge> {
  const claim = claimById(options.graph, options.claimId);
  const targetAgentId = options.targetAgentId ?? claim?.agent_id ?? "agent://unknown";
  const payload = buildChallenge({
    claimId: options.claimId,
    challenger: options.challenger,
    targetAgentId,
    reason: options.reason,
    requestedAction: options.requestedAction,
    claimExcerpt: claim?.text,
    threadId: options.threadId,
    taskId: options.taskId,
    taskTitle: options.taskTitle,
  });
  return envelope(options.challenger, options.runId, "challenge", payload, options.parentEventId);
}

export async function resolveChallenge(options: ResolveChallengeOptions): Promise<ChallengeResolutionResult> {
  const challenge = challengePayload(options.challenge);
  const claim = claimById(options.graph, challenge.claim_id);
  const fallback = fallbackResolution(challenge, claim);

  let outcome = fallback.outcome;
  let summary = fallback.summary;
  let cost = emptyCost(options.llm);

  if (options.llm) {
    const result = await callLLMJson<{
      outcome?: ACPChallengeResolution["outcome"];
      summary?: string;
    }>(
      options.llm,
      resolutionSystemPrompt(),
      resolutionUserPrompt(challenge, claim),
      fallback,
    );
    cost = result.cost;
    outcome = result.data.outcome ?? outcome;
    summary = result.data.summary ?? summary;
  }

  const payload = buildChallengeResolution({
    challengeId: challenge.challenge_id,
    claimId: challenge.claim_id,
    resolverAgentId: challenge.target_agent_id,
    targetAgentId: challenge.challenger,
    outcome,
    summary,
    threadId: challenge.thread_id,
    taskId: challenge.task_id,
    taskTitle: challenge.task_title,
  });
  const resolution = envelope(
    challenge.target_agent_id,
    options.runId,
    "challenge_resolution",
    payload,
    challengeParentEventId(options.challenge, options.parentEventId),
  );
  return { resolution, cost };
}
