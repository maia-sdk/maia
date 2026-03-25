/**
 * Brain Quickstart — run a multi-agent task in 10 lines.
 *
 * Usage:
 *   OPENAI_API_KEY=sk-... npx tsx index.ts
 */

import { Brain } from "@maia/brain";

const brain = new Brain({
  agents: [], // Brain picks from 27 built-in roles
  llm: { apiKey: process.env.OPENAI_API_KEY! },
});

const result = await brain.run("Analyze SaaS pricing trends and write a 3-paragraph summary");

console.log("Output:", result.output);
console.log("Steps:", result.steps.length);
console.log("Cost:", `$${result.totalCostUsd.toFixed(4)}`);
console.log("Agents used:", result.steps.map((s) => s.agentId).join(", "));