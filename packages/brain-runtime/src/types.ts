/**
 * Brain runtime types — agents, steps, conversations, context, results.
 */
import type { ACPEvent, AgentPersonality } from "@maia/acp";

// ── Agent ────────────────────────────────────────────────────────────────────

export interface AgentDefinition {
  /** Agent ID (e.g., "agent://researcher"). */
  id: string;
  /** Display name. */
  name: string;
  /** Role in the team. */
  role: string;
  /** System instructions for the LLM. */
  instructions: string;
  /** Tools this agent can use. */
  tools?: string[];
  /** Personality for Theatre rendering. */
  personality?: AgentPersonality;
}

// ── Configuration ────────────────────────────────────────────────────────────

export interface ResearchConfig {
  /** Pages to visit per search. 0 = Brain decides based on task complexity. */
  depth?: number;
  /** Number of search results to fetch. 0 = Brain decides. */
  searchCount?: number;
  /** Domains to prioritize (e.g., ["wikipedia.org", "arxiv.org"]). Empty = Brain decides. */
  preferSources?: string[];
  /** Domains to exclude (e.g., ["reddit.com", "twitter.com"]). Empty = Brain decides. */
  blockSources?: string[];
  /** Search API key (e.g., Brave). If not set, uses built-in. */
  searchApiKey?: string;
  /** Search provider. Default: "brave". */
  searchProvider?: "brave" | "google" | "bing";
}

export interface BrainOptions {
  /** Agents available to the Brain. Pass [] to auto-assemble from built-in roles. */
  agents: AgentDefinition[];
  /** LLM configuration. */
  llm: LLMConfig;
  /** Research behavior — controls how agents search and browse the web. */
  research?: ResearchConfig;
  /** Maximum review rounds per step. No limit by default. */
  maxReviewRounds?: number;
  /** Maximum conversation turns per step. No limit by default. */
  maxConversationTurns?: number;
  /** Maximum total steps. No limit by default. */
  maxSteps?: number;
  /** Budget limit in USD (default: no limit). */
  budgetUsd?: number;
  /** Event callback — called for every ACP event. */
  onEvent?: (event: ACPEvent) => void;
}

export interface LLMConfig {
  /** API key. Reads from .env or OPENAI_API_KEY/ANTHROPIC_API_KEY if not set. Use "env:VAR_NAME" to read a specific env var. */
  apiKey?: string;
  /** Base URL. Required for non-OpenAI providers. */
  baseUrl?: string;
  /** Model name. Required — no default. e.g. "gpt-4o-mini", "claude-sonnet-4-20250514" */
  model: string;
  /** Temperature. Optional — uses provider default if not set. */
  temperature?: number;
  /** Max tokens per call. */
  maxTokens?: number;
}

// ── Conversation ─────────────────────────────────────────────────────────────

export interface ConversationTurn {
  /** Who spoke. */
  agentId: string;
  /** What intent. */
  intent: string;
  /** What they said. */
  content: string;
  /** Their internal reasoning (visible in Theatre if showThinking). */
  thinking?: string;
  /** Agent's mood. */
  mood?: string;
  /** ISO timestamp. */
  timestamp: string;
}

export interface ConversationThread {
  /** Unique thread ID. */
  threadId: string;
  /** Which step this conversation belongs to. */
  stepIndex: number;
  /** All turns in order. */
  turns: ConversationTurn[];
}

// ── Shared Context ───────────────────────────────────────────────────────────

export interface SharedContext {
  /** The original user goal. */
  goal: string;
  /** Completed step summaries — grows after each step. */
  completedSteps: StepSummary[];
  /** Key decisions made during conversations. */
  decisions: string[];
  /** All conversation turns across all steps. */
  allConversations: ConversationTurn[];
}

export interface StepSummary {
  agentId: string;
  task: string;
  output: string;
  verdict: string;
}

// ── Step ─────────────────────────────────────────────────────────────────────

export interface BrainStep {
  /** Step index. */
  index: number;
  /** Agent assigned to this step. */
  agentId: string;
  /** What the agent should do. */
  task: string;
  /** Output from this step (updated after execution + revisions). */
  output?: string;
  /** Review verdict. */
  reviewVerdict?: "approve" | "revise" | "reject" | "escalate";
  /** Review round reached. */
  reviewRound?: number;
  /** Conversation thread for this step. */
  conversation?: ConversationThread;
  /** Cost for this step. */
  costUsd?: number;
  /** Tokens used. */
  tokensUsed?: number;
}

// ── Result ───────────────────────────────────────────────────────────────────

export interface BrainResult {
  /** All steps executed. */
  steps: BrainStep[];
  /** Final synthesized output. */
  output: string;
  /** All ACP events emitted. */
  events: ACPEvent[];
  /** All conversation threads. */
  conversations: ConversationThread[];
  /** Total cost. */
  totalCostUsd: number;
  /** Total tokens. */
  totalTokens: number;
  /** Run ID. */
  runId: string;
}