/**
 * Tool narration — agents describe what they're doing in natural language
 * instead of silent tool calls. Makes Theatre and TeamChat feel alive.
 *
 * Before: 🔍 researcher tool_calling — web_search
 * After:  Researcher: "Let me check Bessemer's latest report..."
 *         🔍 searching...
 *         Researcher: "Found it. Their Q4 data shows 34% PLG growth."
 */

import type { ACPEvent } from "@maia/acp";
import { envelope, message, activity } from "@maia/acp";
import { PERSONALITY_PROFILES } from "./personality";

interface NarrationContext {
  agentId: string;
  agentRole: string;
  runId: string;
}

/**
 * Generate a pre-tool narration ("Let me check...") + activity event.
 */
export function narrateToolStart(
  ctx: NarrationContext,
  toolName: string,
  detail: string,
): ACPEvent[] {
  const profile = PERSONALITY_PROFILES[ctx.agentRole];
  const narration = generatePreToolLine(ctx.agentRole, toolName, detail);

  const events: ACPEvent[] = [];

  // Chat message: agent announces what they're about to do
  if (narration) {
    events.push(envelope(ctx.agentId, ctx.runId, "message", message({
      from: ctx.agentId,
      to: "agent://broadcast",
      intent: "propose",
      content: narration,
      mood: "focused",
    })));
  }

  // Activity event: the actual tool call
  events.push(envelope(ctx.agentId, ctx.runId, "event", activity({
    agentId: ctx.agentId,
    activity: mapToolToActivity(toolName),
    detail: detail.slice(0, 100),
    tool: { tool_id: toolName, tool_name: toolName, status: "started" },
  })));

  return events;
}

/**
 * Generate a post-tool narration ("Found it. Here's what I got...")
 */
export function narrateToolResult(
  ctx: NarrationContext,
  toolName: string,
  resultSummary: string,
  success: boolean,
): ACPEvent[] {
  const events: ACPEvent[] = [];

  // Activity: tool completed
  events.push(envelope(ctx.agentId, ctx.runId, "event", activity({
    agentId: ctx.agentId,
    activity: mapToolToActivity(toolName),
    detail: resultSummary.slice(0, 100),
    tool: { tool_id: toolName, tool_name: toolName, status: success ? "completed" : "failed" },
  })));

  // Chat message: narrate the result
  const narration = generatePostToolLine(ctx.agentRole, toolName, resultSummary, success);
  if (narration) {
    events.push(envelope(ctx.agentId, ctx.runId, "message", message({
      from: ctx.agentId,
      to: "agent://broadcast",
      intent: "propose",
      content: narration,
      mood: success ? "confident" : "concerned",
    })));
  }

  return events;
}

/** Map tool names to activity types for Theatre. */
function mapToolToActivity(tool: string): string {
  const lower = tool.toLowerCase();
  if (lower.includes("search") || lower.includes("google")) return "searching";
  if (lower.includes("read") || lower.includes("document") || lower.includes("pdf")) return "reading";
  if (lower.includes("write") || lower.includes("draft") || lower.includes("compose")) return "writing";
  if (lower.includes("browse") || lower.includes("navigate") || lower.includes("click")) return "browsing";
  if (lower.includes("code") || lower.includes("execute") || lower.includes("run")) return "coding";
  if (lower.includes("analy") || lower.includes("calculat") || lower.includes("data")) return "analyzing";
  return "tool_calling";
}

/** Generate natural pre-tool narration based on role personality. */
function generatePreToolLine(role: string, tool: string, detail: string): string {
  const lines: Record<string, Record<string, string>> = {
    researcher: {
      search: "Let me look that up...",
      read: "Reading through the document...",
      default: "Pulling the data now...",
    },
    analyst: {
      search: "Let me verify that claim...",
      analyze: "Running the numbers...",
      default: "Checking the data...",
    },
    writer: {
      write: "Drafting now...",
      default: "Working on the text...",
    },
    browser: {
      browse: `Navigating to the page...`,
      default: "Opening the site...",
    },
    coder: {
      code: "Writing the code...",
      execute: "Running it...",
      default: "Let me code that up...",
    },
    reviewer: {
      default: "Let me check this...",
    },
  };

  const roleLines = lines[role] ?? lines.researcher ?? {};
  const toolLower = tool.toLowerCase();
  for (const [key, line] of Object.entries(roleLines)) {
    if (key !== "default" && toolLower.includes(key)) return line;
  }
  return roleLines.default ?? "";
}

/** Generate natural post-tool narration. */
function generatePostToolLine(role: string, tool: string, summary: string, success: boolean): string {
  if (!success) {
    const failLines: Record<string, string> = {
      researcher: "Couldn't find what I was looking for.",
      analyst: "The data isn't available.",
      browser: "Page didn't load properly.",
      coder: "Hit an error. Let me try a different approach.",
      default: "That didn't work.",
    };
    return failLines[role] ?? failLines.default;
  }

  // Keep it short — the actual result will be in the step output
  if (summary.length > 60) return "";
  return "";
}