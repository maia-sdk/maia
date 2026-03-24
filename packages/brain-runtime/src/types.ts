/**
 * Brain runtime types.
 */
import type { ACPEvent, AgentPersonality } from "@maia/acp";

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

export interface BrainOptions {
  /** Agents available to the Brain. */
  agents: AgentDefinition[];
  /** LLM configuration. */
  llm: LLMConfig;
  /** Maximum review rounds per step (default: 3). */
  maxReviewRounds?: number;
  /** Maximum total steps (default: 20). */
  maxSteps?: number;
  /** Budget limit in USD (default: no limit). */
  budgetUsd?: number;
  /** Event callback — called for every ACP event. */
  onEvent?: (event: ACPEvent) => void;
}

export interface LLMConfig {
  /** API key for the LLM provider. */
  apiKey: string;
  /** Base URL (default: https://api.openai.com/v1). */
  baseUrl?: string;
  /** Model name (default: gpt-4o). */
  model?: string;
  /** Temperature (default: 0.3). */
  temperature?: number;
  /** Max tokens per call. */
  maxTokens?: number;
}

export interface BrainStep {
  /** Step index. */
  index: number;
  /** Agent assigned to this step. */
  agentId: string;
  /** What the agent should do. */
  task: string;
  /** Output from this step. */
  output?: string;
  /** Review verdict. */
  reviewVerdict?: "approve" | "revise" | "reject" | "escalate";
  /** Cost for this step. */
  costUsd?: number;
  /** Tokens used. */
  tokensUsed?: number;
}

export interface BrainResult {
  /** All steps executed. */
  steps: BrainStep[];
  /** Final synthesized output. */
  output: string;
  /** All ACP events emitted. */
  events: ACPEvent[];
  /** Total cost. */
  totalCostUsd: number;
  /** Total tokens. */
  totalTokens: number;
  /** Run ID. */
  runId: string;
}