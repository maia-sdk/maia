/**
 * ACP SSE Server — serves agent events over Server-Sent Events.
 *
 * This is a minimal ACP-compatible server that simulates a 3-agent
 * research workflow. Connect Theatre, TeamChat, or the CLI to it.
 *
 * Usage:
 *   npx tsx server.ts
 *   # Then in another terminal:
 *   maia stream http://localhost:8765/acp/events
 *   # Or open http://localhost:8765/acp/events in your browser
 */

import { createServer, IncomingMessage, ServerResponse } from "http";

// ── ACP Event Builders (inline — no deps needed) ───────────────────────────

let seq = 0;
const now = () => new Date().toISOString();
const uid = () => Math.random().toString(36).slice(2, 14);

function acpEvent(agentId: string, type: string, payload: Record<string, any>) {
  return {
    acp_version: "1.0",
    run_id: "run_demo_001",
    event_id: `evt_${uid()}`,
    agent_id: agentId,
    event_type: type,
    timestamp: now(),
    sequence: ++seq,
    payload,
  };
}

// ── Simulated Agent Workflow ────────────────────────────────────────────────

function* simulateWorkflow() {
  // Agents announce themselves
  yield acpEvent("agent://researcher", "capabilities", {
    agent_id: "agent://researcher",
    name: "Researcher",
    role: "researcher",
    skills: [{ skill_id: "web_search", description: "Search the web" }],
  });

  yield acpEvent("agent://analyst", "capabilities", {
    agent_id: "agent://analyst",
    name: "Analyst",
    role: "analyst",
    skills: [{ skill_id: "data_analysis", description: "Analyze data" }],
  });

  yield acpEvent("agent://writer", "capabilities", {
    agent_id: "agent://writer",
    name: "Writer",
    role: "writer",
    skills: [{ skill_id: "writing", description: "Write reports" }],
  });

  // Researcher starts searching
  yield acpEvent("agent://researcher", "event", {
    agent_id: "agent://researcher",
    activity: "searching",
    detail: "Searching for SaaS pricing trends 2026",
  });

  yield acpEvent("agent://researcher", "event", {
    agent_id: "agent://researcher",
    activity: "browsing",
    detail: "Reading Gartner SaaS pricing report",
    browser: { url: "https://gartner.com/saas-pricing-2026", title: "Gartner Report" },
  });

  // Researcher sends findings
  yield acpEvent("agent://researcher", "message", {
    from: "agent://researcher",
    to: "agent://analyst",
    intent: "propose",
    content: "Found 3 key trends: (1) Usage-based pricing up 34%, (2) PLG adoption at 67% of new startups, (3) Hybrid models replacing flat-rate in Enterprise.",
    mood: "confident",
  });

  // Handoff to analyst
  yield acpEvent("agent://researcher", "handoff", {
    from: "agent://researcher",
    to: "agent://analyst",
    task: { description: "Analyze the pricing data and compare SMB vs Enterprise segments" },
  });

  // Analyst working
  yield acpEvent("agent://analyst", "event", {
    agent_id: "agent://analyst",
    activity: "thinking",
    detail: "Comparing pricing models across segments",
  });

  yield acpEvent("agent://analyst", "event", {
    agent_id: "agent://analyst",
    activity: "tool_calling",
    detail: "Building comparison table",
    tool: { tool_id: "table_builder", tool_name: "Table Builder", status: "running" },
  });

  // Analyst shares analysis
  yield acpEvent("agent://analyst", "message", {
    from: "agent://analyst",
    to: "agent://writer",
    intent: "propose",
    content: "Analysis complete. Usage-based works best for SMB (lower entry cost), while hybrid models dominate Enterprise (predictable budgeting + flexibility). PLG is the acquisition channel, not the pricing model.",
    mood: "analytical",
  });

  // Handoff to writer
  yield acpEvent("agent://analyst", "handoff", {
    from: "agent://analyst",
    to: "agent://writer",
    task: { description: "Write 3-paragraph executive summary for the board deck" },
  });

  // Writer working
  yield acpEvent("agent://writer", "event", {
    agent_id: "agent://writer",
    activity: "writing",
    detail: "Drafting executive summary",
  });

  // Writer produces artifact
  yield acpEvent("agent://writer", "artifact", {
    artifact_id: `artifact_${uid()}`,
    kind: "document",
    title: "SaaS Pricing Trends — Executive Summary",
    content: "The SaaS pricing landscape is undergoing a fundamental shift...",
    mime_type: "text/markdown",
  });

  // Writer sends final message
  yield acpEvent("agent://writer", "message", {
    from: "agent://writer",
    to: "agent://brain",
    intent: "summarize",
    content: "Executive summary complete. Three key takeaways: (1) Usage-based pricing is the new default for SMB, (2) Enterprise buyers demand hybrid models, (3) PLG is an acquisition strategy, not a pricing strategy.",
    mood: "confident",
  });

  // Review
  yield acpEvent("agent://brain", "review", {
    reviewer: "agent://brain",
    author: "agent://writer",
    verdict: "approve",
    score: 0.92,
    feedback: "Clear, concise, and actionable. Ready for the board deck.",
    strengths: ["Data-backed claims", "Segment-specific recommendations", "Actionable format"],
    issues: [],
    round: 1,
  });
}

// ── HTTP Server ─────────────────────────────────────────────────────────────

const PORT = 8765;

const server = createServer((req: IncomingMessage, res: ServerResponse) => {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.url === "/acp/events") {
    // SSE stream
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    });

    const events = [...simulateWorkflow()];
    let i = 0;

    const interval = setInterval(() => {
      if (i >= events.length) {
        res.write("data: [DONE]\n\n");
        clearInterval(interval);
        return;
      }
      res.write(`data: ${JSON.stringify(events[i])}\n\n`);
      i++;
    }, 800); // One event every 800ms — feels like real-time

    req.on("close", () => clearInterval(interval));
    return;
  }

  // Health check
  if (req.url === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "ok", agents: 3, protocol: "ACP/1.0" }));
    return;
  }

  // Landing page
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end(
    `Maia ACP Server\n\nEndpoints:\n  GET /acp/events  — SSE event stream\n  GET /health       — health check\n\nConnect with:\n  maia stream http://localhost:${PORT}/acp/events\n`,
  );
});

server.listen(PORT, () => {
  console.log(`\n  Maia ACP Server running on http://localhost:${PORT}`);
  console.log(`  Stream: http://localhost:${PORT}/acp/events`);
  console.log(`  Health: http://localhost:${PORT}/health\n`);
  console.log(`  Connect with:`);
  console.log(`    maia stream http://localhost:${PORT}/acp/events`);
  console.log(`    curl http://localhost:${PORT}/acp/events\n`);
});