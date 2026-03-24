/**
 * Brain — orchestration runtime with real agent conversations.
 *
 * Flow:
 * 1. Team Assembly — announce agents, decompose goal into steps
 * 2. Step Execution — execute, conversation loop, review loop
 * 3. Synthesis — Brain produces final cohesive response
 */

import type { ACPEvent } from "@maia/acp";
import { envelope, message, handoff, activity, capabilities } from "@maia/acp";
import type {
  BrainOptions, BrainResult, BrainStep, AgentDefinition,
  SharedContext, ConversationThread,
} from "./types";
import { callLLM, callLLMJson } from "./llm";
import type { LLMCallResult } from "./llm";
import * as prompts from "./prompts";
import { runConversation, runReviewLoop } from "./loops";

export class Brain {
  private agents: AgentDefinition[];
  private options: Required<Omit<BrainOptions, "onEvent">> & { onEvent?: BrainOptions["onEvent"] };
  private events: ACPEvent[] = [];
  private runId = "";
  private totalCost = 0;
  private totalTokens = 0;

  constructor(opts: BrainOptions) {
    this.agents = opts.agents;
    this.options = {
      agents: opts.agents,
      llm: opts.llm,
      maxReviewRounds: opts.maxReviewRounds ?? 3,
      maxConversationTurns: opts.maxConversationTurns ?? 8,
      maxSteps: opts.maxSteps ?? 20,
      budgetUsd: opts.budgetUsd ?? Infinity,
      onEvent: opts.onEvent,
    };
  }

  async run(goal: string): Promise<BrainResult> {
    this.runId = `run_${Date.now()}`;
    this.events = [];
    this.totalCost = 0;
    this.totalTokens = 0;

    const context: SharedContext = {
      goal,
      completedSteps: [],
      decisions: [],
      allConversations: [],
    };

    // ── Phase 1: Team Assembly ─────────────────────────────────
    this.announceAgents();
    const plan = await this.planSteps(goal);

    this.emit(envelope("agent://brain", this.runId, "message", message({
      from: "agent://brain",
      to: "agent://broadcast",
      intent: "propose",
      content: `Plan:\n${plan.map((s, i) => `${i + 1}. ${s.agentId.replace("agent://", "")} — ${s.task}`).join("\n")}`,
      mood: "confident",
    })));

    // ── Phase 2: Step Execution ────────────────────────────────
    const completedSteps: BrainStep[] = [];
    const allThreads: ConversationThread[] = [];
    const loopCtx = this.buildLoopContext();

    for (const step of plan) {
      if (this.totalCost >= this.options.budgetUsd) {
        this.emit(envelope("agent://brain", this.runId, "message", message({
          from: "agent://brain",
          to: "agent://broadcast",
          intent: "escalate",
          content: `Budget limit reached ($${this.totalCost.toFixed(4)} / $${this.options.budgetUsd}). Stopping.`,
          mood: "concerned",
        })));
        break;
      }

      // Handoff with context
      const prevAgent = completedSteps.length > 0
        ? completedSteps[completedSteps.length - 1].agentId
        : "agent://brain";

      this.emit(envelope(prevAgent, this.runId, "handoff", handoff({
        from: prevAgent,
        to: step.agentId,
        task: { description: step.task, priority: "normal" as const },
        context: { completedSteps: context.completedSteps, decisions: context.decisions },
      })));

      // Execute step
      await this.executeStep(step, context);

      // Conversation loop
      const thread = await runConversation(step, loopCtx);
      step.conversation = thread;
      allThreads.push(thread);

      // Review loop
      await runReviewLoop(step, thread, loopCtx);

      // Update shared context
      context.completedSteps.push({
        agentId: step.agentId,
        task: step.task,
        output: (step.output ?? "").slice(0, 500),
        verdict: step.reviewVerdict ?? "approve",
      });
      context.allConversations.push(...thread.turns);

      for (const turn of thread.turns) {
        if (turn.intent === "challenge" || turn.intent === "agree" || turn.intent === "clarify") {
          context.decisions.push(`${turn.agentId}: [${turn.intent}] ${turn.content.slice(0, 150)}`);
        }
      }

      completedSteps.push(step);
    }

    // ── Phase 3: Synthesis ─────────────────────────────────────
    const finalOutput = await this.synthesize(context, completedSteps);

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
      conversations: allThreads,
      totalCostUsd: this.totalCost,
      totalTokens: this.totalTokens,
      runId: this.runId,
    };
  }

  // ── Plan ─────────────────────────────────────────────────────────────────

  private async planSteps(goal: string): Promise<BrainStep[]> {
    this.emitActivity("agent://brain", "thinking", "Decomposing goal into agent steps...");

    const { data, cost } = await callLLMJson<Array<{ agent_id: string; task: string }>>(
      this.options.llm,
      prompts.planSystemPrompt(),
      prompts.planUserPrompt(goal, this.agents),
      [],
    );
    this.trackCost(cost);

    return (Array.isArray(data) ? data : [])
      .slice(0, this.options.maxSteps)
      .map((s, i) => ({
        index: i,
        agentId: s.agent_id ?? this.agents[0]?.id ?? "agent://unknown",
        task: s.task ?? goal,
      }));
  }

  // ── Execute ──────────────────────────────────────────────────────────────

  private async executeStep(step: BrainStep, context: SharedContext): Promise<void> {
    const agent = this.findAgent(step.agentId);
    const contextText = this.buildContextText(context);
    this.emitActivity(step.agentId, "thinking", `Working on: ${step.task.slice(0, 80)}`);

    const result = await callLLM(
      this.options.llm,
      prompts.executeSystemPrompt(agent, contextText),
      prompts.executeUserPrompt(step.task),
    );
    this.trackCost(result);

    step.output = result.text;
    step.costUsd = (step.costUsd ?? 0) + result.costUsd;
    step.tokensUsed = (step.tokensUsed ?? 0) + result.tokensUsed;

    this.emit(envelope(step.agentId, this.runId, "message", message({
      from: step.agentId,
      to: "agent://brain",
      intent: "propose",
      content: result.text,
      mood: "confident",
      threadId: `thread_step_${step.index}`,
    })));
  }

  // ── Synthesis ────────────────────────────────────────────────────────────

  private async synthesize(context: SharedContext, steps: BrainStep[]): Promise<string> {
    this.emitActivity("agent://brain", "writing", "Synthesizing final response...");

    const result = await callLLM(
      this.options.llm,
      prompts.synthesizeSystemPrompt(),
      prompts.synthesizeUserPrompt(context.goal, steps, context.allConversations),
    );
    this.trackCost(result);
    return result.text;
  }

  // ── Helpers ──────────────────────────────────────────────────────────────

  private announceAgents(): void {
    for (const agent of this.agents) {
      this.emit(envelope(agent.id, this.runId, "capabilities", capabilities({
        agentId: agent.id,
        name: agent.name,
        role: agent.role,
        personality: agent.personality,
        skills: (agent.tools ?? []).map((t) => ({ skill_id: t, description: t })),
      })));
    }
  }

  private findAgent(agentId: string): AgentDefinition {
    return this.agents.find((a) => a.id === agentId) ?? {
      id: agentId,
      name: agentId.replace("agent://", ""),
      role: "agent",
      instructions: "You are a helpful AI agent.",
    };
  }

  private buildContextText(context: SharedContext): string {
    if (context.completedSteps.length === 0) return "";
    const steps = context.completedSteps
      .map((s) => `${s.agentId.replace("agent://", "")} (${s.verdict}): ${s.output.slice(0, 300)}`)
      .join("\n\n");
    const decisions = context.decisions.length > 0
      ? "\n\nKey decisions:\n" + context.decisions.slice(-5).join("\n")
      : "";
    return `Prior work:\n${steps}${decisions}`;
  }

  private buildLoopContext() {
    return {
      agents: this.agents,
      llm: this.options.llm,
      runId: this.runId,
      maxConversationTurns: this.options.maxConversationTurns,
      maxReviewRounds: this.options.maxReviewRounds,
      emit: (event: ACPEvent) => this.emit(event),
      emitActivity: (agentId: string, type: string, detail: string) => this.emitActivity(agentId, type, detail),
      trackCost: (result: LLMCallResult) => this.trackCost(result),
      findAgent: (agentId: string) => this.findAgent(agentId),
    };
  }

  private trackCost(result: LLMCallResult): void {
    this.totalCost += result.costUsd;
    this.totalTokens += result.tokensUsed;
  }

  private emitActivity(agentId: string, type: string, detail: string): void {
    this.emit(envelope(agentId, this.runId, "event", activity({
      agentId,
      activity: type as any,
      detail,
      cost: { tokens_used: 0, cost_usd: this.totalCost, model: this.options.llm.model ?? "gpt-4o" },
    })));
  }

  private emit(event: ACPEvent): void {
    this.events.push(event);
    this.options.onEvent?.(event);
  }
}