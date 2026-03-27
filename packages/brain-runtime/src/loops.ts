/**
 * Conversation and review loops — extracted from Brain for LOC compliance.
 * These are the two most complex operations: agent-to-agent conversations
 * and multi-round Brain review with revision.
 */

import type { ACPEvent } from "@maia/acp";
import { envelope, message, review } from "@maia/acp";
import * as ACP from "@maia/acp";
import type {
  AgentDefinition, BrainStep, ConversationThread, LLMConfig,
} from "./types";
import { callLLMJson, callLLM } from "./llm";
import type { LLMCallResult } from "./llm";
import * as prompts from "./prompts";

interface LoopContext {
  agents: AgentDefinition[];
  llm: LLMConfig;
  runId: string;
  maxConversationTurns: number;
  maxReviewRounds: number;
  emit: (event: ACPEvent) => void;
  emitActivity: (agentId: string, type: string, detail: string) => void;
  trackCost: (result: LLMCallResult) => void;
  findAgent: (agentId: string) => AgentDefinition;
}

/**
 * Run the conversation loop after an agent produces output.
 * Brain's LLM decides if other agents should respond, who, and why.
 * Max turns controlled by maxConversationTurns.
 */
export async function runConversation(
  step: BrainStep,
  ctx: LoopContext,
): Promise<ConversationThread> {
  const threadId = `thread_step_${step.index}`;
  const thread: ConversationThread = { threadId, stepIndex: step.index, turns: [] };

  thread.turns.push({
    agentId: step.agentId,
    intent: "propose",
    content: step.output ?? "",
    timestamp: new Date().toISOString(),
  });

  const otherAgents = ctx.agents.filter((a) => a.id !== step.agentId);
  if (otherAgents.length === 0) return thread;

  for (let turn = 0; turn < ctx.maxConversationTurns; turn++) {
    const lastTurn = thread.turns[thread.turns.length - 1];

    // Ask Brain: should anyone respond?
    const { data: trigger, cost: triggerCost } = await callLLMJson<{
      should_respond: boolean;
      agent_id?: string;
      reason?: string;
    }>(
      ctx.llm,
      prompts.shouldRespondSystemPrompt(),
      prompts.shouldRespondUserPrompt(lastTurn, otherAgents, thread.turns),
      { should_respond: false },
    );
    ctx.trackCost(triggerCost);

    if (!trigger.should_respond) break;

    // Find the responding agent
    const responderId = trigger.agent_id ?? otherAgents[0]?.id;
    const responder = responderId ? ctx.findAgent(responderId) : null;
    if (!responder) break;

    ctx.emit(envelope("agent://brain", ctx.runId, "decision", ACP.decision({
      agentId: "agent://brain",
      category: "routing",
      stepIndex: step.index,
      summary: `${responder.id.replace("agent://", "")} should respond to ${lastTurn.agentId.replace("agent://", "")}.`,
      options: otherAgents.map((agent) => ({
        option_id: agent.id,
        label: agent.name,
      })),
      chosenOptionId: responder.id,
      reasoning: trigger.reason ?? "The current thread benefits from an additional teammate response.",
    })));

    ctx.emitActivity(responder.id, "thinking", `Considering response: ${(trigger.reason ?? "").slice(0, 60)}`);

    // Generate the agent's reply
    const { data: reply, cost: replyCost } = await callLLMJson<{
      content: string;
      intent: string;
      thinking?: string;
      mood?: string;
    }>(
      ctx.llm,
      prompts.replySystemPrompt(responder),
      prompts.replyUserPrompt(thread.turns, trigger.reason ?? ""),
      { content: "", intent: "agree", thinking: "", mood: "neutral" },
    );
    ctx.trackCost(replyCost);

    if (!reply.content) break;

    thread.turns.push({
      agentId: responder.id,
      intent: reply.intent || "propose",
      content: reply.content,
      thinking: reply.thinking,
      mood: reply.mood,
      timestamp: new Date().toISOString(),
    });

    ctx.emit(envelope(responder.id, ctx.runId, "message", message({
      from: responder.id,
      to: step.agentId,
      intent: (reply.intent || "propose") as any,
      content: reply.content,
      thinking: reply.thinking,
      mood: (reply.mood || "neutral") as any,
      threadId,
      inReplyTo: lastTurn.agentId,
    })));

    step.costUsd = (step.costUsd ?? 0) + triggerCost.costUsd + replyCost.costUsd;
    step.tokensUsed = (step.tokensUsed ?? 0) + triggerCost.tokensUsed + replyCost.tokensUsed;

    // Rotate agents — allow different agents to respond next
    const idx = otherAgents.findIndex((a) => a.id === responder.id);
    if (idx >= 0) otherAgents.splice(idx, 1);
    if (otherAgents.length === 0) break;
  }

  return thread;
}

/**
 * Run the Brain review loop — approve, revise (with re-execution), reject, or escalate.
 * Max rounds controlled by maxReviewRounds.
 */
export async function runReviewLoop(
  step: BrainStep,
  thread: ConversationThread,
  ctx: LoopContext,
): Promise<void> {
  for (let round = 1; round <= ctx.maxReviewRounds; round++) {
    ctx.emitActivity("agent://brain", "reviewing",
      `Reviewing ${step.agentId.replace("agent://", "")}'s output (round ${round})`);

    const { data: rev, cost } = await callLLMJson<{
      verdict: string;
      score?: number;
      feedback?: string;
      revision_instructions?: string;
      strengths?: string[];
      issues?: Array<{ severity: string; description: string }>;
    }>(
      ctx.llm,
      prompts.reviewSystemPrompt(),
      prompts.reviewUserPrompt(step, thread.turns, round),
      { verdict: "approve" },
    );
    ctx.trackCost(cost);
    step.costUsd = (step.costUsd ?? 0) + cost.costUsd;
    step.tokensUsed = (step.tokensUsed ?? 0) + cost.tokensUsed;

    const verdict = rev.verdict || "approve";

    ctx.emit(envelope("agent://brain", ctx.runId, "decision", ACP.decision({
      agentId: "agent://brain",
      category: "review",
      stepIndex: step.index,
      summary: `Review verdict for ${step.agentId.replace("agent://", "")}: ${verdict}.`,
      options: [
        { option_id: "approve", label: "approve" },
        { option_id: "revise", label: "revise" },
        { option_id: "reject", label: "reject" },
        { option_id: "escalate", label: "escalate" },
      ],
      chosenOptionId: verdict,
      reasoning: rev.feedback ?? rev.revision_instructions ?? "Review decision captured from the Brain review loop.",
    })));

    ctx.emit(envelope("agent://brain", ctx.runId, "review", review({
      reviewer: "agent://brain",
      author: step.agentId,
      verdict: verdict as any,
      score: rev.score,
      feedback: rev.feedback,
      revisionInstructions: rev.revision_instructions,
      strengths: rev.strengths,
      issues: rev.issues as any,
      round,
    })));

    step.reviewVerdict = verdict as BrainStep["reviewVerdict"];
    step.reviewRound = round;

    if (verdict === "approve" || verdict === "reject" || verdict === "escalate") break;

    // Verdict is "question" — Brain asks agent a follow-up question
    if (verdict === "question" && rev.feedback && round < ctx.maxReviewRounds) {
      ctx.emit(envelope("agent://brain", ctx.runId, "message", message({
        from: "agent://brain",
        to: step.agentId,
        intent: "clarify" as any,
        content: rev.feedback,
        mood: "focused" as any,
        threadId: `thread_step_${step.index}`,
      })));

      // Agent answers the question
      const agent = ctx.findAgent(step.agentId);
      ctx.emitActivity(step.agentId, "thinking", "Answering Brain's question...");
      const answerResult = await callLLM(
        ctx.llm,
        `You are ${agent.name}. The Brain asked you a follow-up question about your work. Answer concisely.`,
        `Your previous output:\n${(step.output ?? "").slice(0, 1500)}\n\nBrain's question: ${rev.feedback}`,
      );
      ctx.trackCost(answerResult);
      step.costUsd = (step.costUsd ?? 0) + answerResult.costUsd;
      step.tokensUsed = (step.tokensUsed ?? 0) + answerResult.tokensUsed;

      // Append answer to output and re-review
      step.output = `${step.output ?? ""}\n\n[Follow-up answer]: ${answerResult.text}`;
      ctx.emit(envelope(step.agentId, ctx.runId, "message", message({
        from: step.agentId,
        to: "agent://brain",
        intent: "clarify" as any,
        content: answerResult.text,
        mood: "focused" as any,
        threadId: `thread_step_${step.index}`,
      })));
      continue; // Re-review with the new answer
    }

    // Verdict is "revise" — agent tries again
    if ((verdict === "revise" || verdict === "question") && round < ctx.maxReviewRounds) {
      const agent = ctx.findAgent(step.agentId);
      ctx.emitActivity(step.agentId, "writing", "Revising based on Brain's feedback...");

      const reviseResult = await callLLM(
        ctx.llm,
        prompts.reviseSystemPrompt(agent),
        prompts.reviseUserPrompt(
          step.output ?? "",
          rev.feedback ?? "",
          rev.revision_instructions ?? "Improve the output.",
        ),
      );
      ctx.trackCost(reviseResult);
      step.costUsd = (step.costUsd ?? 0) + reviseResult.costUsd;
      step.tokensUsed = (step.tokensUsed ?? 0) + reviseResult.tokensUsed;

      step.output = reviseResult.text;

      ctx.emit(envelope(step.agentId, ctx.runId, "message", message({
        from: step.agentId,
        to: "agent://brain",
        intent: "propose",
        content: reviseResult.text,
        mood: "focused",
        threadId: `thread_step_${step.index}`,
      })));
    }
  }
}
