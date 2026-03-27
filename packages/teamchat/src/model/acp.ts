import type {
  ACPChallenge,
  ACPChallengeResolution,
  ACPEvent,
  ACPHandoff,
  ACPMessage,
  ACPReview,
  DeliveryStatus,
  MessageIntent,
  ReviewVerdict,
} from "@maia/acp";
import { challenge, challengeResolution, envelope, handoff, message, review } from "@maia/acp";

import type { ConversationRow } from "./types";
import { metadataMap } from "./utils";

type ConversationACPEvent = ACPEvent<ACPMessage | ACPHandoff | ACPReview | ACPChallenge | ACPChallengeResolution>;

function toAgentUri(value: unknown, fallback: string): string {
  const normalized = String(value || "").trim();
  if (!normalized) {
    return fallback;
  }
  return normalized.startsWith("agent://") ? normalized : `agent://${normalized.toLowerCase()}`;
}

function toIntent(row: ConversationRow): MessageIntent {
  switch (row.entry_type) {
    case "question":
      return "clarify";
    case "challenge":
    case "revision":
      return "challenge";
    case "review":
      return "review";
    case "handoff":
      return "handoff";
    case "summary":
      return "summarize";
    case "answer":
      return "agree";
    default:
      return "propose";
  }
}

function toMood(value: unknown): ACPMessage["mood"] | undefined {
  const normalized = String(value || "").trim().toLowerCase();
  switch (normalized) {
    case "confident":
      return "confident";
    case "skeptical":
    case "concerned":
      return "concerned";
    case "curious":
    case "focused":
      return "focused";
    case "uncertain":
      return "uncertain";
    case "excited":
      return "excited";
    default:
      return undefined;
  }
}

function toDeliveryStatus(value: unknown): DeliveryStatus | undefined {
  const normalized = String(value || "").trim().toLowerCase();
  switch (normalized) {
    case "queued":
    case "sent":
    case "delivered":
    case "acknowledged":
    case "failed":
      return normalized;
    default:
      return undefined;
  }
}

function toVerdict(row: ConversationRow, metadata: Record<string, unknown>): ReviewVerdict {
  const normalized = String(metadata.verdict || row.entry_type || "").trim().toLowerCase();
  if (normalized === "approve" || normalized === "reject" || normalized === "escalate") {
    return normalized;
  }
  return "revise";
}

function toTimestamp(value: number): string {
  return new Date(value).toISOString();
}

function withTimestamp<T>(event: ACPEvent<T>, timestamp: number): ACPEvent<T> {
  return {
    ...event,
    timestamp: toTimestamp(timestamp),
  };
}

function messageEvent(row: ConversationRow, metadata: Record<string, unknown>): ACPEvent<ACPMessage> {
  const from = toAgentUri(metadata.speaker_id || metadata.from_agent || row.from_agent, "agent://agent");
  const to = String(row.to_agent || "").trim().toLowerCase() === "team"
    ? "agent://broadcast"
    : toAgentUri(metadata.to_agent || row.to_agent, "agent://team");
  const payload = message({
    from,
    to,
    intent: toIntent(row),
    content: String(row.message || "").trim(),
    mood: toMood(metadata.mood),
    messageId: String(metadata.message_id || "").trim() || undefined,
    threadId: String(metadata.thread_id || "").trim() || undefined,
    inReplyTo: String(metadata.reply_to_id || "").trim() || undefined,
    taskId: String(metadata.task_id || "").trim() || undefined,
    taskTitle: String(metadata.task_title || "").trim() || undefined,
    mentions: Array.isArray(metadata.mentions) ? metadata.mentions.map((item) => String(item).trim()).filter(Boolean) : undefined,
    requiresAck: metadata.requires_ack === true,
    deliveryStatus: toDeliveryStatus(metadata.delivery_status),
    ackedBy: Array.isArray(metadata.acked_by) ? metadata.acked_by.map((item) => String(item).trim()).filter(Boolean) : undefined,
  });
  const event = envelope(from, String(row.run_id || "").trim(), "message", payload, String(metadata.reply_to_id || "").trim() || undefined);
  return withTimestamp(event, row.timestamp);
}

function handoffEvent(row: ConversationRow, metadata: Record<string, unknown>): ACPEvent<ACPHandoff> {
  const from = toAgentUri(metadata.speaker_id || metadata.from_agent || row.from_agent, "agent://agent");
  const to = toAgentUri(metadata.to_agent || row.to_agent, "agent://team");
  const payload = handoff({
    from,
    to,
    task: {
      task_id: String(metadata.task_id || "").trim() || undefined,
      thread_id: String(metadata.thread_id || "").trim() || undefined,
      description: String(row.message || metadata.task_title || "Work handoff").trim(),
      owner_agent_id: to,
      status: "accepted",
    },
    status: "accepted",
    requiresAck: metadata.requires_ack === true,
    acceptedBy: Array.isArray(metadata.acked_by) && metadata.acked_by.length > 0 ? String(metadata.acked_by[0]).trim() : undefined,
  });
  const event = envelope(from, String(row.run_id || "").trim(), "handoff", payload, String(metadata.reply_to_id || "").trim() || undefined);
  return withTimestamp(event, row.timestamp);
}

function reviewEvent(row: ConversationRow, metadata: Record<string, unknown>): ACPEvent<ACPReview> {
  const reviewer = toAgentUri(metadata.speaker_id || metadata.from_agent || row.from_agent, "agent://reviewer");
  const author = toAgentUri(metadata.to_agent || row.to_agent, "agent://author");
  const payload = review({
    reviewer,
    author,
    verdict: toVerdict(row, metadata),
    feedback: String(row.message || "").trim(),
    round: 1,
  });
  const event = envelope(reviewer, String(row.run_id || "").trim(), "review", payload, String(metadata.reply_to_id || "").trim() || undefined);
  return withTimestamp(event, row.timestamp);
}

function challengeEvent(row: ConversationRow, metadata: Record<string, unknown>): ACPEvent<ACPChallenge> {
  const challenger = toAgentUri(metadata.speaker_id || metadata.from_agent || row.from_agent, "agent://challenger");
  const targetAgentId = toAgentUri(metadata.to_agent || row.to_agent, "agent://target");
  const payload = challenge({
    challengeId: String(metadata.challenge_id || "").trim() || undefined,
    claimId: String(metadata.claim_id || "").trim() || "claim_unknown",
    challenger,
    targetAgentId,
    reason: String(row.message || metadata.reason || "").trim() || "Claim challenged.",
    claimExcerpt: String(metadata.claim_excerpt || "").trim() || undefined,
    requestedAction: String(metadata.requested_action || "").trim() as ACPChallenge["requested_action"] || undefined,
    threadId: String(metadata.thread_id || "").trim() || undefined,
    taskId: String(metadata.task_id || "").trim() || undefined,
    taskTitle: String(metadata.task_title || "").trim() || undefined,
  });
  const event = envelope(challenger, String(row.run_id || "").trim(), "challenge", payload, String(metadata.reply_to_id || "").trim() || undefined);
  return withTimestamp(event, row.timestamp);
}

function challengeResolutionEvent(row: ConversationRow, metadata: Record<string, unknown>): ACPEvent<ACPChallengeResolution> {
  const resolverAgentId = toAgentUri(metadata.speaker_id || metadata.from_agent || row.from_agent, "agent://resolver");
  const targetAgentId = String(metadata.to_agent || row.to_agent || "").trim()
    ? toAgentUri(metadata.to_agent || row.to_agent, "agent://target")
    : undefined;
  const payload = challengeResolution({
    challengeId: String(metadata.challenge_id || "").trim() || "challenge_unknown",
    claimId: String(metadata.claim_id || "").trim() || undefined,
    resolverAgentId,
    targetAgentId,
    outcome: (String(metadata.outcome || "").trim().toLowerCase() as ACPChallengeResolution["outcome"]) || "defended",
    summary: String(row.message || metadata.summary || "").trim() || "Challenge resolved.",
    replacementClaimIds: Array.isArray(metadata.replacement_claim_ids)
      ? metadata.replacement_claim_ids.map((item) => String(item).trim()).filter(Boolean)
      : undefined,
    threadId: String(metadata.thread_id || "").trim() || undefined,
    taskId: String(metadata.task_id || "").trim() || undefined,
    taskTitle: String(metadata.task_title || "").trim() || undefined,
  });
  const event = envelope(resolverAgentId, String(row.run_id || "").trim(), "challenge_resolution", payload, String(metadata.reply_to_id || "").trim() || undefined);
  return withTimestamp(event, row.timestamp);
}

export function toACPConversationEvent(row: ConversationRow): ConversationACPEvent {
  const metadata = metadataMap(row);
  if (String(metadata.event_type || "").trim().toLowerCase() === "challenge_resolution" || row.entry_type === "resolution") {
    return challengeResolutionEvent(row, metadata);
  }
  if (String(metadata.event_type || "").trim().toLowerCase() === "challenge" || (row.entry_type === "challenge" && Boolean(metadata.claim_id || metadata.challenge_id))) {
    return challengeEvent(row, metadata);
  }
  if (row.entry_type === "handoff") {
    return handoffEvent(row, metadata);
  }
  if (row.entry_type === "review") {
    return reviewEvent(row, metadata);
  }
  return messageEvent(row, metadata);
}

export type { ConversationACPEvent };
