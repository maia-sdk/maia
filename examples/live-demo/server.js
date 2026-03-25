/**
 * Maia Live Demo — real multi-agent orchestration.
 *
 * Uses:
 *   - @maia/computer-use for real browser automation
 *   - @maia/acp for event building
 *   - LLM for natural agent conversations (no hardcoded words)
 *
 * Usage:
 *   npm install && npm start
 *   Open http://localhost:3000
 */

import express from "express";
import { createServer } from "http";
import OpenAI from "openai";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { ComputerUse } from "@maia/computer-use";
import { envelope, message, handoff, review, activity, capabilities } from "@maia/acp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(express.json());
app.use(express.static(join(__dirname, "public")));

const BRAVE_KEY = "BSA2dv5on3gPCMpb3rlI3jFSQ6cLMGN";

// ── LLM Call ──────────────────────────────────────────────────────────────
async function callLLM(apiKey, provider, model, systemPrompt, userPrompt) {
  if (provider === "openai" || provider === "auto") {
    const client = new OpenAI({ apiKey });
    const resp = await client.chat.completions.create({
      model: model || "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 1500,
    });
    return {
      content: resp.choices[0]?.message?.content || "",
      tokens: resp.usage?.total_tokens || 0,
      cost: estimateCost(model || "gpt-4o-mini", resp.usage),
    };
  }
  if (provider === "anthropic") {
    const resp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: model || "claude-sonnet-4-20250514",
        max_tokens: 1500,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      }),
    });
    const data = await resp.json();
    return {
      content: data.content?.[0]?.text || "",
      tokens: (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0),
      cost: estimateCost(model || "claude-sonnet-4-20250514", data.usage),
    };
  }
  throw new Error("Unknown provider: " + provider);
}

function estimateCost(model, usage) {
  if (!usage) return 0;
  const rates = {
    "gpt-4o-mini": { input: 0.15, output: 0.6 },
    "gpt-4o": { input: 2.5, output: 10 },
    "claude-sonnet-4-20250514": { input: 3, output: 15 },
    "claude-haiku-4-5-20251001": { input: 0.8, output: 4 },
  };
  const r = rates[model] || rates["gpt-4o-mini"];
  const inp = usage.input_tokens || usage.prompt_tokens || 0;
  const out = usage.output_tokens || usage.completion_tokens || 0;
  return (inp * r.input + out * r.output) / 1_000_000;
}

// ── Brave Search ──────────────────────────────────────────────────────────
async function braveSearch(query, count = 5) {
  try {
    const url = `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=${Math.min(20, Math.max(3, count))}`;
    const res = await fetch(url, {
      headers: { Accept: "application/json", "X-Subscription-Token": BRAVE_KEY },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.web?.results || []).slice(0, count).map((r) => ({
      title: r.title, url: r.url, snippet: r.description || "",
    }));
  } catch {
    return [];
  }
}

// ── SSE Run Endpoint ──────────────────────────────────────────────────────
app.post("/api/run", async (req, res) => {
  const { task, apiKey, provider, model, connectors, research } = req.body;
  if (!task || !apiKey) return res.status(400).json({ error: "task and apiKey required" });

  // Research settings — 0 means "auto" (Brain decides)
  const researchConfig = {
    depth: research?.depth || 0,         // 0=auto, N=visit N pages
    searchCount: research?.searchCount || 0, // 0=auto, N=fetch N results
    preferSources: research?.preferSources || [],  // [] = auto
    blockSources: research?.blockSources || [],    // [] = auto
  };

  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });

  const runId = "run_" + Math.random().toString(36).slice(2, 14);
  let totalCost = 0, totalTokens = 0;

  function send(event) { res.write(`data: ${JSON.stringify(event)}\n\n`); }
  function sendACP(agentId, type, payload) { send(envelope(agentId, runId, type, payload)); }

  function emitCost(agentId, result) {
    totalCost += result.cost;
    totalTokens += result.tokens;
    sendACP(agentId, "event", activity({
      agentId, activity: "cost_update",
      cost: { tokens_used: result.tokens, cost_usd: result.cost },
    }));
  }

  const AGENTS = {
    brain: { id: "agent://brain", name: "Maia Brain", role: "orchestrator", emoji: "\uD83E\uDDE0" },
    researcher: { id: "agent://researcher", name: "Researcher", role: "researcher", emoji: "\uD83D\uDD0D" },
    analyst: { id: "agent://analyst", name: "Analyst", role: "analyst", emoji: "\uD83D\uDCCA" },
    writer: { id: "agent://writer", name: "Writer", role: "writer", emoji: "\u270D\uFE0F" },
  };

  try {
    // ── Announce agents ──────────────────────────────────────────
    for (const [, a] of Object.entries(AGENTS)) {
      sendACP(a.id, "capabilities", capabilities({
        agentId: a.id, name: a.name, role: a.role,
        personality: { avatar_emoji: a.emoji },
        skills: [{ skill_id: a.role, description: a.name }],
        connectors: connectors || [],
      }));
    }

    const roadmapSteps = [
      { toolId: "plan", title: "Plan", whyThisStep: "Break task into subtasks" },
      { toolId: "research", title: "Research", whyThisStep: "Search the web" },
      { toolId: "analyze", title: "Analyze", whyThisStep: "Extract insights" },
      { toolId: "write", title: "Write", whyThisStep: "Produce output" },
      { toolId: "review", title: "Review", whyThisStep: "Quality check" },
    ];
    function emitRoadmap(idx) {
      sendACP("agent://brain", "event", { agent_id: "agent://brain", activity: "roadmap", roadmap: { steps: roadmapSteps, activeIndex: idx } });
    }

    // ── Phase 1: Brain plans naturally ───────────────────────────
    emitRoadmap(0);
    sendACP("agent://brain", "event", activity({ agentId: "agent://brain", activity: "thinking", detail: "Planning..." }));

    const planResult = await callLLM(apiKey, provider, model,
      `You are Maia Brain, a team orchestrator. You speak concisely and naturally like a real team lead. No bullet points. Direct, human language.`,
      `You lead 3 agents: Researcher (searches web), Analyst (verifies data), Writer (writes output).

User asked: "${task}"

Reply with:
1. A short message to your team (2-3 sentences, natural, address them by name)
2. A JSON plan on a new line: [{"agent":"researcher","task":"..."},{"agent":"analyst","task":"..."},{"agent":"writer","task":"..."}]`
    );
    emitCost("agent://brain", planResult);

    let steps, brainMessage;
    try {
      const jsonMatch = planResult.content.match(/\[[\s\S]*\]/);
      steps = jsonMatch ? JSON.parse(jsonMatch[0]) : [
        { agent: "researcher", task: "Research: " + task },
        { agent: "analyst", task: "Analyze findings" },
        { agent: "writer", task: "Write summary" },
      ];
      brainMessage = planResult.content.replace(/\[[\s\S]*\]/, "").trim() || `Let's work on this: ${task}`;
    } catch {
      steps = [
        { agent: "researcher", task: "Research: " + task },
        { agent: "analyst", task: "Analyze findings" },
        { agent: "writer", task: "Write summary" },
      ];
      brainMessage = `Let's work on this: ${task}`;
    }

    sendACP("agent://brain", "message", message({
      from: "agent://brain", to: "agent://broadcast",
      intent: "delegate", content: brainMessage, mood: "confident",
    }));

    // ── Phase 2: Researcher — @maia/computer-use ─────────────────
    const researchStep = steps.find((s) => s.agent === "researcher") || steps[0];
    sendACP("agent://brain", "handoff", handoff({ from: "agent://brain", to: "agent://researcher", description: researchStep.task }));
    emitRoadmap(1);

    // If auto, ask Brain to decide research params
    let effectiveDepth = researchConfig.depth;
    let effectiveSearchCount = researchConfig.searchCount;
    let effectiveBlock = researchConfig.blockSources;
    let effectivePrefer = researchConfig.preferSources;

    if (effectiveDepth === 0 || effectiveSearchCount === 0 || (!effectiveBlock.length && !effectivePrefer.length)) {
      sendACP("agent://brain", "event", activity({ agentId: "agent://brain", activity: "thinking", detail: "Deciding research strategy..." }));

      const strategyResult = await callLLM(apiKey, provider, model,
        "You decide research strategy. Output JSON only.",
        `Task: "${task}"
Current settings: depth=${effectiveDepth} (0=you decide), searchCount=${effectiveSearchCount} (0=you decide), prefer=[${effectivePrefer.join(",")}], block=[${effectiveBlock.join(",")}]

Output JSON: {"depth": N, "searchCount": N, "preferSources": ["domain.com",...], "blockSources": ["domain.com",...]}
- depth: how many pages to visit (1-10, based on task complexity)
- searchCount: how many search results to fetch (3-20)
- preferSources: domains to prioritize (academic, official, authoritative)
- blockSources: domains to skip (social media, low quality)`
      );
      emitCost("agent://brain", strategyResult);

      try {
        const m = strategyResult.content.match(/\{[\s\S]*\}/);
        const strat = m ? JSON.parse(m[0]) : {};
        if (effectiveDepth === 0) effectiveDepth = Math.min(10, Math.max(1, strat.depth || 2));
        if (effectiveSearchCount === 0) effectiveSearchCount = Math.min(20, Math.max(3, strat.searchCount || 5));
        if (!effectivePrefer.length && strat.preferSources?.length) effectivePrefer = strat.preferSources;
        if (!effectiveBlock.length && strat.blockSources?.length) effectiveBlock = strat.blockSources;
      } catch {
        if (effectiveDepth === 0) effectiveDepth = 2;
        if (effectiveSearchCount === 0) effectiveSearchCount = 5;
      }

      sendACP("agent://brain", "event", { agent_id: "agent://brain", activity: "narration",
        narration: `Strategy: visit ${effectiveDepth} pages, fetch ${effectiveSearchCount} results${effectivePrefer.length ? ", prefer: " + effectivePrefer.join(", ") : ""}${effectiveBlock.length ? ", skip: " + effectiveBlock.join(", ") : ""}`
      });
    }

    sendACP("agent://researcher", "event", activity({ agentId: "agent://researcher", activity: "searching", detail: "Searching the web..." }));
    sendACP("agent://researcher", "event", { agent_id: "agent://researcher", activity: "narration", narration: "Searching: " + task.slice(0, 60) + "..." });

    // Fetch results from Brave with configured count
    let allResults = await braveSearch(task, effectiveSearchCount);

    // Filter: remove blocked domains
    if (effectiveBlock.length) {
      allResults = allResults.filter(r => !effectiveBlock.some(d => r.url.includes(d)));
    }

    // Sort: preferred domains first
    if (effectivePrefer.length) {
      allResults.sort((a, b) => {
        const aPreferred = effectivePrefer.some(d => a.url.includes(d)) ? 0 : 1;
        const bPreferred = effectivePrefer.some(d => b.url.includes(d)) ? 0 : 1;
        return aPreferred - bPreferred;
      });
    }

    const searchResults = allResults.slice(0, effectiveSearchCount);
    let pageContent = "";

    if (searchResults.length > 0) {
      // Show search surface
      sendACP("agent://researcher", "event", {
        agent_id: "agent://researcher", activity: "search",
        detail: "Found " + searchResults.length + " results" + (effectiveBlock.length ? " (filtered " + effectiveBlock.length + " blocked domains)" : ""),
        surface: { type: "search", query: task, results: searchResults },
      });

      // Browse pages with @maia/computer-use
      const pagesToVisit = Math.min(effectiveDepth, searchResults.length);
      const computer = new ComputerUse({
        headless: true, agentId: "agent://researcher", runId,
        screenshotQuality: 55, autoScreenshot: true, timeout: 15000,
      });

      try {
        await computer.launch();

        for (let p = 0; p < pagesToVisit; p++) {
          const result = searchResults[p];
          sendACP("agent://researcher", "event", { agent_id: "agent://researcher", activity: "narration", narration: `Opening source ${p + 1}/${pagesToVisit}: ${result.title.slice(0, 50)}` });
          sendACP("agent://researcher", "event", activity({ agentId: "agent://researcher", activity: "browsing", detail: result.title }));

          const nav = await computer.navigate(result.url);
          if (nav.screenshot) {
            sendACP("agent://researcher", "event", {
              agent_id: "agent://researcher", activity: "browsing",
              detail: result.title,
              surface: { type: "browser", url: result.url, title: result.title, screenshot: "data:image/jpeg;base64," + nav.screenshot.data },
            });
          }

          // Scroll and read
          sendACP("agent://researcher", "event", { agent_id: "agent://researcher", activity: "narration", narration: "Reading page " + (p + 1) + "..." });
          for (let i = 0; i < 2; i++) {
            await computer.scroll("down", 400);
            await new Promise(r => setTimeout(r, 400));
            const ss = await computer.screenshot();
            sendACP("agent://researcher", "event", {
              agent_id: "agent://researcher", activity: "scroll",
              scroll: { percent: (i + 1) * 35, direction: "down" },
              surface: { type: "browser", url: result.url, title: result.title, screenshot: "data:image/jpeg;base64," + ss.screenshot.data },
            });
          }

          // Extract text
          const ext = await computer.extract();
          const textPerPage = Math.floor(6000 / pagesToVisit);
          pageContent += (pageContent ? "\n\n---\n\n" : "") + "Source: " + result.url + "\n" + ext.result.text.slice(0, textPerPage);
        }

        await computer.close();
      } catch (e) {
        console.error("Computer-use error:", e.message);
        try { await computer.close(); } catch {}
      }
    }

    // Researcher speaks naturally
    sendACP("agent://researcher", "event", activity({ agentId: "agent://researcher", activity: "thinking", detail: "Synthesizing..." }));

    const searchContext = searchResults.length > 0
      ? `Search results:\n${searchResults.map(r => `- ${r.title}: ${r.snippet} (${r.url})`).join("\n")}${pageContent ? "\n\nPage content:\n" + pageContent : ""}`
      : "No results found. Use your knowledge.";

    const researchResult = await callLLM(apiKey, provider, model,
      `You are Researcher. You just searched the web and read several pages. Now share your findings with the Analyst naturally — like a colleague in a team chat. Be specific with data. Mention sources. 2-4 sentences, conversational tone.`,
      `Task: ${researchStep.task}\n\n${searchContext}\n\nShare findings naturally with the Analyst.`
    );
    emitCost("agent://researcher", researchResult);

    sendACP("agent://researcher", "message", message({
      from: "agent://researcher", to: "agent://analyst",
      intent: "inform", content: researchResult.content, mood: "confident",
    }));

    // ── Phase 3: Analyst responds naturally ──────────────────────
    const analystStep = steps.find((s) => s.agent === "analyst") || steps[1];
    sendACP("agent://researcher", "handoff", handoff({ from: "agent://researcher", to: "agent://analyst", description: analystStep.task }));
    emitRoadmap(2);

    sendACP("agent://analyst", "event", activity({ agentId: "agent://analyst", activity: "analyzing", detail: "Cross-referencing..." }));
    sendACP("agent://analyst", "event", {
      agent_id: "agent://analyst", activity: "reading", detail: "Reviewing research",
      surface: { type: "editor", title: "research-notes.md", content: researchResult.content },
    });
    sendACP("agent://analyst", "event", { agent_id: "agent://analyst", activity: "narration", narration: "Reviewing research findings..." });

    const analysisResult = await callLLM(apiKey, provider, model,
      `You are Analyst. The Researcher just shared findings. Respond naturally like a real colleague. If something is off, say so directly. If the data is solid, acknowledge it. Be specific. 2-4 sentences.`,
      `Task: ${analystStep.task}\n\nResearcher said: "${researchResult.content}"\n\nRespond naturally, then pass analysis to Writer.`
    );
    emitCost("agent://analyst", analysisResult);

    sendACP("agent://analyst", "message", message({
      from: "agent://analyst", to: "agent://writer",
      intent: "inform", content: analysisResult.content, mood: "analytical",
    }));

    // ── Phase 4: Writer produces output ──────────────────────────
    const writerStep = steps.find((s) => s.agent === "writer") || steps[2];
    sendACP("agent://analyst", "handoff", handoff({ from: "agent://analyst", to: "agent://writer", description: writerStep.task }));
    emitRoadmap(3);

    sendACP("agent://writer", "event", activity({ agentId: "agent://writer", activity: "writing", detail: "Drafting..." }));
    sendACP("agent://writer", "event", { agent_id: "agent://writer", activity: "narration", narration: "Writing the report..." });

    const writeResult = await callLLM(apiKey, provider, model,
      `You are Writer. Write the final output based on your colleagues' research and analysis. Use markdown. Be clear, professional but not stiff. Structure with headers. This is what the user will read.`,
      `Task: ${writerStep.task}\n\nResearch: ${researchResult.content}\n\nAnalysis: ${analysisResult.content}\n\nWrite the final output in markdown.`
    );
    emitCost("agent://writer", writeResult);

    sendACP("agent://writer", "event", {
      agent_id: "agent://writer", activity: "writing", detail: "Report complete",
      surface: { type: "editor", title: "output.md", content: writeResult.content },
    });

    // Writer comments naturally
    const writerComment = await callLLM(apiKey, provider, model,
      `You are Writer. You just finished the report. Tell the team it's done in 1-2 casual sentences. Mention one highlight.`,
      `You wrote:\n${writeResult.content.slice(0, 500)}\n\nTell the team.`
    );
    emitCost("agent://writer", writerComment);

    sendACP("agent://writer", "message", message({
      from: "agent://writer", to: "agent://brain",
      intent: "inform", content: writerComment.content, mood: "confident",
    }));

    // ── Phase 5: Brain reviews ───────────────────────────────────
    emitRoadmap(4);
    sendACP("agent://brain", "event", activity({ agentId: "agent://brain", activity: "reviewing", detail: "Evaluating..." }));

    const reviewResult = await callLLM(apiKey, provider, model,
      `You are Maia Brain. Review the output. JSON only: {"score":0-100,"verdict":"approve"|"revise","feedback":"1 sentence","strengths":["...",".."]}`,
      `Review:\n${writeResult.content.slice(0, 1000)}\n\nScore and decide.`
    );
    emitCost("agent://brain", reviewResult);

    let rev;
    try {
      const m = reviewResult.content.match(/\{[\s\S]*\}/);
      rev = m ? JSON.parse(m[0]) : { score: 85, verdict: "approve", feedback: "Good work.", strengths: [] };
    } catch {
      rev = { score: 85, verdict: "approve", feedback: "Solid.", strengths: ["Clear"] };
    }

    sendACP("agent://brain", "review", review({
      reviewer: "agent://brain", author: "agent://writer",
      verdict: rev.verdict || "approve", score: (rev.score || 85) / 100,
      feedback: rev.feedback || "Reviewed.", strengths: rev.strengths || [],
    }));

    // Brain wraps up naturally
    const wrapUp = await callLLM(apiKey, provider, model,
      `You are Maia Brain. Task is done. Say 1 casual sentence to close it out. Mention the score.`,
      `Done. Score: ${rev.score || 85}%. Verdict: ${rev.verdict}. Wrap up.`
    );
    emitCost("agent://brain", wrapUp);

    sendACP("agent://brain", "message", message({
      from: "agent://brain", to: "agent://broadcast",
      intent: "inform", content: wrapUp.content, mood: "satisfied",
    }));

    send({ type: "done", totalCost, totalTokens, runId });
    res.write("data: [DONE]\n\n");
    res.end();

  } catch (err) {
    console.error("Run error:", err);
    sendACP("agent://brain", "event", activity({ agentId: "agent://brain", activity: "error", detail: err.message || "Error" }));
    res.write("data: [DONE]\n\n");
    res.end();
  }
});

app.get("/health", (_, res) => res.json({ status: "ok", version: "0.2.0" }));

const PORT = process.env.PORT || 3000;
createServer(app).listen(PORT, () => {
  console.log(`\n  \uD83E\uDDE0 Maia Live Demo v0.2`);
  console.log(`  Using @maia/computer-use + @maia/acp`);
  console.log(`  Open http://localhost:${PORT}\n`);
});