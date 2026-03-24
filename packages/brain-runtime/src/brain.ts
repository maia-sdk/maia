/**
 * Brain — the orchestration runtime that manages agent teams.
 *
 * Usage:
 *   const brain = new Brain({
 *     agents: [researcher, analyst, writer],
 *     llm: { apiKey: "sk-..." },
 *   });
 *   const result = await brain.run("Analyze SaaS pricing trends");
 */

import type { ACPEvent } from "@maia/acp";
import { envelope, message, handoff, review, activity, capabilities } from "@maia/acp";
import type { BrainOptions, BrainResult, BrainStep, AgentDefinition, LLMConfig } from "./types";

export class Brain {
  private agents: AgentDefinition[];
  private llm: LLMConfig;
  private maxReviewRounds: number;
  private maxSteps: number;
  private budgetUsd: number;
  private onEvent?: (event: ACPEvent) => void;
  private events: ACPEvent[] = [];
  private runId: string = "";
  private totalCost = 0;
  private totalTokens = 0;

  constructor(options: BrainOptions) {
    this.agents = options.agents;
    this.llm = options.llm;
    this.maxReviewRounds = options.maxReviewRounds ?? 3;
    this.maxSteps = options.maxSteps ?? 20;
    this.budgetUsd = options.budgetUsd ?? Infinity;
    this.onEvent = options.onEvent;
  }

  /** Run the Brain with a goal — it figures out who does what. */
  async run(goal: string): Promise<BrainResult> {
    this.runId = `run_${Date.now()}`;
    this.events = [];
    this.totalCost = 0;
    this.totalTokens = 0;

    // Announce agents
    for (const agent of this.agents) {
      this.emit(envelope(agent.id, this.runId, "capabilities", capabilities({
        agentId: agent.id,
        name: agent.name,
        role: agent.role,
        personality: agent.personality,
        skills: (agent.tools ?? []).map((t) => ({ skill_id: t, description: t })),
      })));
    }

    // Step 1: Decompose goal into steps (LLM call)
    const plan = await this.planSteps(goal);

    // Announce the plan
    this.emit(envelope("agent://brain", this.runId, "message", message({
      from: "agent://brain",
      to: "agent://broadcast",
      intent: "propose",
      content: `Plan: ${plan.map((s, i) => `${i + 1}. ${s.agentId.replace("agent://", "")} — ${s.task}`).join("\n")}`,
      mood: "confident",
    })));

    // Step 2: Execute each step
    const completedSteps: BrainStep[] = [];

    for (const step of plan) {
      if (this.totalCost >= this.budgetUsd) {
        this.emit(envelope("agent://brain", this.runId, "message", message({
          from: "agent://brain",
          to: "agent://broadcast",
          intent: "escalate",
          content: `Budget limit reached ($${this.totalCost.toFixed(4)} / $${this.budgetUsd}). Stopping.`,
          mood: "concerned",
        })));
        break;
      }

      // Handoff
      const prevAgent = completedSteps.length > 0
        ? completedSteps[completedSteps.length - 1].agentId
        : "agent://brain";

      this.emit(envelope(prevAgent, this.runId, "handoff", handoff({
        from: prevAgent,
        to: step.agentId,
        description: step.task,
      })));

      // Execute step (LLM call as the agent)
      const output = await this.executeStep(step);
      step.output = output;

      // Review loop
      const verdict = await this.reviewStep(step);
      step.reviewVerdict = verdict;

      completedSteps.push(step);
    }

    // Final synthesis
    const finalOutput = await this.synthesize(goal, completedSteps);

    this.emit(envelope("agent://brain", this.runId, "message", message({
      from: "agent://brain",
      to: "agent://user",
      intent: "summarize",
      content: finalOutput,
      mood: "confident",
    })));

    return {
      steps: completedSteps,
      output: finalOutput,
      events: this.events,
      totalCostUsd: this.totalCost,
      totalTokens: this.totalTokens,
      runId: this.runId,
    };
  }

  /** Decompose a goal into agent steps using LLM. */
  private async planSteps(goal: string): Promise<BrainStep[]> {
    const agentList = this.agents.map((a) => `- ${a.id}: ${a.name} (${a.role}) — ${a.instructions.slice(0, 100)}`).join("\n");

    const response = await this.callLLM(
      "You are Brain, an AI orchestrator. Decompose the goal into sequential steps. "
      + "Assign each step to the best agent. Return JSON array: [{\"agent_id\": \"agent://name\", \"task\": \"what to do\"}]",
      `Goal: ${goal}\n\nAvailable agents:\n${agentList}`,
    );

    try {
      const parsed = JSON.parse(response);
      return (Array.isArray(parsed) ? parsed : []).slice(0, this.maxSteps).map((s: any, i: number) => ({
        index: i,
        agentId: s.agent_id || this.agents[0]?.id || "agent://unknown",
        task: s.task || goal,
      }));
    } catch {
      return [{ index: 0, agentId: this.agents[0]?.id || "agent://unknown", task: goal }];
    }
  }

  /** Execute a single step as the assigned agent. */
  private async executeStep(step: BrainStep): Promise<string> {
    const agent = this.agents.find((a) => a.id === step.agentId);
    const systemPrompt = agent?.instructions || "You are a helpful AI agent.";

    this.emit(envelope(step.agentId, this.runId, "event", activity({
      agentId: step.agentId,
      activity: "thinking",
      detail: `Working on: ${step.task.slice(0, 100)}`,
    })));

    const output = await this.callLLM(systemPrompt, step.task);

    this.emit(envelope(step.agentId, this.runId, "message", message({
      from: step.agentId,
      to: "agent://brain",
      intent: "propose",
      content: output,
      mood: "confident",
    })));

    return output;
  }

  /** Review an agent's output. */
  private async reviewStep(step: BrainStep): Promise<"approve" | "revise" | "reject" | "escalate"> {
    const response = await this.callLLM(
      "You are Brain, reviewing an agent's work. Return JSON: {\"verdict\": \"approve|revise|reject\", \"feedback\": \"...\"}",
      `Task: ${step.task}\n\nOutput:\n${(step.output ?? "").slice(0, 2000)}`,
    );

    try {
      const parsed = JSON.parse(response);
      const verdict = parsed.verdict || "approve";
      const feedback = parsed.feedback || "";

      this.emit(envelope("agent://brain", this.runId, "review", review({
        reviewer: "agent://brain",
        author: step.agentId,
        verdict,
        feedback,
        round: 1,
      })));

      return verdict;
    } catch {
      return "approve";
    }
  }

  /** Synthesize final output from all steps. */
  private async synthesize(goal: string, steps: BrainStep[]): Promise<string> {
    const stepSummaries = steps.map((s, i) =>
      `Step ${i + 1} (${s.agentId}): ${(s.output ?? "").slice(0, 500)}`
    ).join("\n\n");

    return this.callLLM(
      "You are Brain. Synthesize the team's work into a final, cohesive response for the user.",
      `Goal: ${goal}\n\nTeam outputs:\n${stepSummaries}`,
    );
  }

  /** Call the LLM. */
  private async callLLM(systemPrompt: string, userPrompt: string): Promise<string> {
    const baseUrl = (this.llm.baseUrl ?? "https://api.openai.com/v1").replace(/\/$/, "");
    const model = this.llm.model ?? "gpt-4o";

    const body = {
      model,
      temperature: this.llm.temperature ?? 0.3,
      max_tokens: this.llm.maxTokens,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    };

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.llm.apiKey}`,
      },
      body: JSON.stringify(body),
    });

    const data = await response.json() as any;

    // Track cost
    const usage = data.usage || {};
    const tokens = (usage.total_tokens || 0) as number;
    this.totalTokens += tokens;
    this.totalCost += tokens * 0.00001; // rough estimate

    return data.choices?.[0]?.message?.content || "";
  }

  private emit(event: ACPEvent): void {
    this.events.push(event);
    this.onEvent?.(event);
  }
}