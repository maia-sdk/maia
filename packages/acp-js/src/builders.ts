// ─── ACP Message Builders ───────────────────────────────────────────────────
// Convenience functions to create well-formed ACP payloads.

import type {
  ACPMessage,
  ACPHandoff,
  ACPReview,
  ACPArtifact,
  ACPActivity,
  ACPCapabilities,
  ACPEvent,
  ACPProvenanceGraph,
  ACPChallenge,
  ACPChallengeResolution,
  ACPDecision,
  ACPBranchPlan,
  MessageIntent,
  ReviewVerdict,
  ActivityType,
  ArtifactKind,
  AgentPersonality,
  AgentSkill,
  HandoffTask,
  AgentPresence,
  DeliveryStatus,
} from "./types";

let _sequence = 0;

function nextSequence(): number {
  return _sequence++;
}

function now(): string {
  return new Date().toISOString();
}

function uid(): string {
  return `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

// ── Envelope ─────────────────────────────────────────────────────────────────

export function envelope<T>(
  agentId: string,
  runId: string,
  eventType: string,
  payload: T,
  parentEventId?: string,
): ACPEvent<T> {
  return {
    acp_version: "1.0",
    run_id: runId,
    agent_id: agentId,
    event_type: eventType as ACPEvent["event_type"],
    timestamp: now(),
    sequence: nextSequence(),
    parent_event_id: parentEventId,
    payload,
  };
}

// ── Message ──────────────────────────────────────────────────────────────────

export function message(opts: {
  from: string;
  to: string;
  intent: MessageIntent;
  content: string;
  thinking?: string;
  mood?: ACPMessage["mood"];
  messageId?: string;
  threadId?: string;
  inReplyTo?: string;
  taskId?: string;
  taskTitle?: string;
  handoffId?: string;
  reviewId?: string;
  channel?: "direct" | "thread" | "broadcast";
  mentions?: string[];
  requiresAck?: boolean;
  deliveryStatus?: DeliveryStatus;
  ackedBy?: string[];
  artifacts?: ACPArtifact[];
}): ACPMessage {
  return {
    from: opts.from,
    to: opts.to,
    intent: opts.intent,
    content: opts.content,
    thinking: opts.thinking,
    mood: opts.mood,
    artifacts: opts.artifacts ?? [],
    context: {
      message_id: opts.messageId ?? `msg_${uid()}`,
      thread_id: opts.threadId,
      in_reply_to: opts.inReplyTo,
      task_id: opts.taskId,
      task_title: opts.taskTitle,
      handoff_id: opts.handoffId,
      review_id: opts.reviewId,
      channel: opts.channel ?? (opts.to === "agent://broadcast" ? "broadcast" : "direct"),
      mentions: opts.mentions,
      requires_ack: opts.requiresAck,
      delivery_status: opts.deliveryStatus,
      acked_by: opts.ackedBy,
    },
  };
}

// ── Handoff ──────────────────────────────────────────────────────────────────

export function handoff(opts: {
  from: string;
  to: string;
  task: HandoffTask | string;
  handoffId?: string;
  status?: ACPHandoff["status"];
  requiresAck?: boolean;
  acceptedBy?: string;
  declinedReason?: string;
  context?: Record<string, unknown>;
  artifacts?: ACPArtifact[];
}): ACPHandoff {
  const task: HandoffTask =
    typeof opts.task === "string"
      ? { description: opts.task, priority: "normal", task_id: `task_${uid()}` }
      : opts.task;

  return {
    from: opts.from,
    to: opts.to,
    task,
    handoff_id: opts.handoffId ?? `handoff_${uid()}`,
    status: opts.status ?? task.status ?? "proposed",
    requires_ack: opts.requiresAck,
    accepted_by: opts.acceptedBy,
    declined_reason: opts.declinedReason,
    context: opts.context ?? {},
    artifacts: opts.artifacts ?? [],
    prior_steps: [],
  };
}

// ── Review ───────────────────────────────────────────────────────────────────

export function review(opts: {
  reviewer: string;
  author: string;
  verdict: ReviewVerdict;
  feedback?: string;
  score?: number;
  revisionInstructions?: string;
  strengths?: string[];
  issues?: ACPReview["issues"];
  round?: number;
}): ACPReview {
  return {
    reviewer: opts.reviewer,
    author: opts.author,
    verdict: opts.verdict,
    feedback: opts.feedback,
    score: opts.score,
    revision_instructions: opts.revisionInstructions,
    strengths: opts.strengths,
    issues: opts.issues,
    round: opts.round ?? 1,
    max_rounds: 3,
  };
}

// ── Artifact ─────────────────────────────────────────────────────────────────

export function artifact(opts: {
  kind: ArtifactKind;
  title: string;
  content: string;
  mimeType?: string;
  metadata?: Record<string, unknown>;
}): ACPArtifact {
  return {
    artifact_id: `artifact_${uid()}`,
    kind: opts.kind,
    title: opts.title,
    content: opts.content,
    mime_type: opts.mimeType,
    metadata: opts.metadata,
    version: 1,
  };
}

// ── Activity ─────────────────────────────────────────────────────────────────

export function activity(opts: {
  agentId: string;
  activity: ActivityType;
  detail?: string;
  tool?: ACPActivity["tool"];
  browser?: ACPActivity["browser"];
  progress?: ACPActivity["progress"];
  cost?: ACPActivity["cost"];
}): ACPActivity {
  return {
    agent_id: opts.agentId,
    activity: opts.activity,
    detail: opts.detail,
    tool: opts.tool,
    browser: opts.browser,
    progress: opts.progress,
    cost: opts.cost,
  };
}

// ── Capabilities ─────────────────────────────────────────────────────────────

export function capabilities(opts: {
  agentId: string;
  name: string;
  description?: string;
  role?: string;
  personality?: AgentPersonality;
  skills: AgentSkill[];
  connectors?: string[];
  acceptsIntents?: ACPCapabilities["accepts_intents"];
  maxConcurrentTasks?: number;
  presence?: AgentPresence;
}): ACPCapabilities {
  return {
    agent_id: opts.agentId,
    name: opts.name,
    description: opts.description,
    role: opts.role,
    personality: opts.personality,
    skills: opts.skills,
    connectors: opts.connectors ?? [],
    accepts_intents: opts.acceptsIntents ?? [],
    max_concurrent_tasks: opts.maxConcurrentTasks ?? 1,
    presence: opts.presence,
  };
}

export function provenanceGraph(opts: {
  graphId?: string;
  runId: string;
  claims: ACPProvenanceGraph["claims"];
  contradictions?: ACPProvenanceGraph["contradictions"];
}): ACPProvenanceGraph {
  return {
    graph_id: opts.graphId ?? `graph_${uid()}`,
    run_id: opts.runId,
    claims: opts.claims,
    contradictions: opts.contradictions ?? [],
  };
}

export function challenge(opts: {
  challengeId?: string;
  claimId: string;
  challenger: string;
  targetAgentId: string;
  reason: string;
  status?: ACPChallenge["status"];
  requestedAction?: ACPChallenge["requested_action"];
  claimExcerpt?: string;
  threadId?: string;
  taskId?: string;
  taskTitle?: string;
}): ACPChallenge {
  return {
    challenge_id: opts.challengeId ?? `challenge_${uid()}`,
    claim_id: opts.claimId,
    challenger: opts.challenger,
    target_agent_id: opts.targetAgentId,
    reason: opts.reason,
    status: opts.status ?? "open",
    requested_action: opts.requestedAction,
    claim_excerpt: opts.claimExcerpt,
    thread_id: opts.threadId,
    task_id: opts.taskId,
    task_title: opts.taskTitle,
  };
}

export function challengeResolution(opts: {
  challengeId: string;
  resolverAgentId: string;
  outcome: ACPChallengeResolution["outcome"];
  summary: string;
  claimId?: string;
  targetAgentId?: string;
  replacementClaimIds?: string[];
  threadId?: string;
  taskId?: string;
  taskTitle?: string;
}): ACPChallengeResolution {
  return {
    challenge_id: opts.challengeId,
    claim_id: opts.claimId,
    resolver_agent_id: opts.resolverAgentId,
    target_agent_id: opts.targetAgentId,
    outcome: opts.outcome,
    summary: opts.summary,
    replacement_claim_ids: opts.replacementClaimIds ?? [],
    thread_id: opts.threadId,
    task_id: opts.taskId,
    task_title: opts.taskTitle,
  };
}

export function decision(opts: {
  decisionId?: string;
  stepIndex?: number;
  agentId: string;
  category: ACPDecision["category"];
  summary: string;
  options?: ACPDecision["options"];
  chosenOptionId?: string;
  reasoning?: string;
  relatedEventIds?: string[];
}): ACPDecision {
  return {
    decision_id: opts.decisionId ?? `decision_${uid()}`,
    step_index: opts.stepIndex,
    agent_id: opts.agentId,
    category: opts.category,
    summary: opts.summary,
    options: opts.options ?? [],
    chosen_option_id: opts.chosenOptionId,
    reasoning: opts.reasoning,
    related_event_ids: opts.relatedEventIds ?? [],
  };
}

export function branchPlan(opts: {
  branchId?: string;
  runId: string;
  sourceDecisionId: string;
  sourceStepIndex?: number;
  status?: ACPBranchPlan["status"];
  summary: string;
  assumptions?: string[];
  previewEventIds?: string[];
  overrides?: ACPBranchPlan["overrides"];
  createdAt?: string;
}): ACPBranchPlan {
  return {
    branch_id: opts.branchId ?? `branch_${uid()}`,
    run_id: opts.runId,
    source_decision_id: opts.sourceDecisionId,
    source_step_index: opts.sourceStepIndex,
    status: opts.status ?? "planned",
    summary: opts.summary,
    assumptions: opts.assumptions ?? [],
    preview_event_ids: opts.previewEventIds ?? [],
    overrides: opts.overrides ?? {},
    created_at: opts.createdAt ?? now(),
  };
}
