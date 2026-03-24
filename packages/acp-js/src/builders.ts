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
  MessageIntent,
  ReviewVerdict,
  ActivityType,
  ArtifactKind,
  AgentPersonality,
  AgentSkill,
  HandoffTask,
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
  threadId?: string;
  inReplyTo?: string;
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
      thread_id: opts.threadId,
      in_reply_to: opts.inReplyTo,
    },
  };
}

// ── Handoff ──────────────────────────────────────────────────────────────────

export function handoff(opts: {
  from: string;
  to: string;
  task: HandoffTask | string;
  context?: Record<string, unknown>;
  artifacts?: ACPArtifact[];
}): ACPHandoff {
  const task: HandoffTask =
    typeof opts.task === "string"
      ? { description: opts.task, priority: "normal" }
      : opts.task;

  return {
    from: opts.from,
    to: opts.to,
    task,
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
}): ACPCapabilities {
  return {
    agent_id: opts.agentId,
    name: opts.name,
    description: opts.description,
    role: opts.role,
    personality: opts.personality,
    skills: opts.skills,
    connectors: opts.connectors ?? [],
  };
}
