/**
 * @maia/brain — orchestration runtime for AI agent teams.
 *
 * Usage:
 *   import { Brain } from '@maia/brain';
 *
 *   const brain = new Brain({
 *     agents: [researcher, analyst, writer],
 *     llm: { apiKey: "sk-..." },
 *   });
 *
 *   const result = await brain.run("Analyze SaaS pricing trends");
 */

export { Brain } from "./brain";
export type {
  AgentDefinition,
  BrainOptions,
  BrainResult,
  BrainStep,
  LLMConfig,
} from "./types";