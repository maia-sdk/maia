import express from "express";
import {
  activity,
  capabilities,
  createComputerUseClient,
  draftConversationMessage,
  envelope,
  handoff,
  message,
  review,
  startComputerUseSession,
  streamComputerUseSession,
  suggestConversationMove,
  summarizeConversationThread,
  type ACPEvent,
  type CollaborationContext,
  type LLMConfig,
} from "@maia/sdk";

const PORT = 8780;
const RUN_ID = "js_live_workbench";

const app = express();
app.use(express.json());

let events: ACPEvent[] = [];
const clients = new Set<express.Response>();

function pushEvent(event: ACPEvent) {
  events.push(event);
  const payload = `data: ${JSON.stringify(event)}\n\n`;
  for (const client of clients) {
    client.write(payload);
  }
}

function emit(agentId: string, eventType: ACPEvent["event_type"], payload: ACPEvent["payload"], parentEventId?: string) {
  pushEvent(envelope(agentId, RUN_ID, eventType, payload, parentEventId));
}

function emitCapabilities() {
  emit(
    "agent://researcher",
    "capabilities",
    capabilities({
      agentId: "agent://researcher",
      name: "Researcher",
      role: "lead_analyst",
      skills: [
        { skill_id: "research", description: "Research and synthesis" },
        { skill_id: "verification", description: "Source validation" },
      ],
      acceptsIntents: ["clarify", "review", "summarize"],
      presence: { availability: "available", current_focus: "Preparing market update", active_task_count: 1 },
    }),
  );
  emit(
    "agent://analyst",
    "capabilities",
    capabilities({
      agentId: "agent://analyst",
      name: "Analyst",
      role: "verifier",
      skills: [
        { skill_id: "math", description: "Numerical checks" },
        { skill_id: "review", description: "Review and challenge work" },
      ],
      acceptsIntents: ["clarify", "review", "challenge"],
      presence: { availability: "available", current_focus: "Waiting for validation request", active_task_count: 1 },
    }),
  );
}

function createContext(): CollaborationContext {
  return {
    objective: "Prepare a short market update with one verified numerical claim.",
    currentAgentId: "agent://researcher",
    threadId: "thread_market_update",
    taskId: "task_market_update",
    taskTitle: "Market update",
    participants: [
      {
        agentId: "agent://researcher",
        name: "Researcher",
        role: "Lead analyst",
        skills: ["research", "synthesis"],
        acceptsIntents: ["clarify", "summarize", "review"],
      },
      {
        agentId: "agent://analyst",
        name: "Analyst",
        role: "Verifier",
        skills: ["verification", "math"],
        acceptsIntents: ["clarify", "review", "challenge"],
        presence: {
          availability: "available",
          current_focus: "Fact checking",
          active_task_count: 1,
        },
      },
    ],
    events,
    maxWords: 80,
  };
}

function llmConfig(): LLMConfig | null {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    return null;
  }
  return {
    model: process.env.OPENAI_MODEL || "gpt-4o-mini",
    apiKey,
  };
}

function describeComputerEvent(event: import("@maia/sdk").ComputerUseStreamEvent): {
  activityType: "tool_calling" | "reading" | "browsing" | "idle" | "error";
  detail: string;
  url?: string;
  title?: string;
} {
  switch (event.event_type) {
    case "action":
      return {
        activityType: "tool_calling",
        detail: event.action || "Runtime action",
        title: event.action || "Runtime action",
      };
    case "text":
      return {
        activityType: "reading",
        detail: event.text || "Runtime text",
      };
    case "started":
      return {
        activityType: "browsing",
        detail: event.detail || "Computer runtime started",
        url: event.url,
        title: "Computer runtime",
      };
    case "screenshot":
      return {
        activityType: "browsing",
        detail: "Screenshot frame received",
        url: event.url,
        title: "Screenshot",
      };
    case "done":
    case "max_iterations":
      return {
        activityType: "idle",
        detail: "Computer runtime completed",
        url: event.url,
        title: "Computer runtime",
      };
    case "error":
      return {
        activityType: "error",
        detail: event.detail || "Computer runtime error",
      };
  }
}

async function emitInitialFlow() {
  emitCapabilities();
  emit(
    "agent://researcher",
    "message",
    message({
      from: "agent://researcher",
      to: "agent://analyst",
      intent: "clarify",
      content: "We need one verified numerical claim for the market update. Can you validate the growth figure?",
      threadId: "thread_market_update",
      taskId: "task_market_update",
      taskTitle: "Market update",
      requiresAck: true,
      mentions: ["agent://analyst"],
      deliveryStatus: "sent",
    }),
  );
}

async function emitCollaborationFlow() {
  const llm = llmConfig();
  if (!llm) {
    emit(
      "agent://researcher",
      "handoff",
      handoff({
        from: "agent://researcher",
        to: "agent://analyst",
        task: {
          task_id: "task_market_update",
          thread_id: "thread_market_update",
          description: "Verify the 34% growth claim before the update is finalized.",
          definition_of_done: "One verified numerical claim with source confidence.",
          status: "proposed",
        },
        requiresAck: true,
      }),
    );
    emit(
      "agent://analyst",
      "review",
      review({
        reviewer: "agent://analyst",
        author: "agent://researcher",
        verdict: "approve",
        feedback: "The 34% number is defensible if cited as a modeled estimate.",
        score: 0.91,
      }),
    );
    return "fallback";
  }

  const move = await suggestConversationMove(llm, createContext());
  const draft = await draftConversationMessage(llm, createContext(), move.move);
  if (draft.message) {
    emit("agent://researcher", "message", draft.message);
  }
  const digest = await summarizeConversationThread(llm, createContext());
  emit(
    "agent://analyst",
    "message",
    message({
      from: "agent://analyst",
      to: "agent://researcher",
      intent: "summarize",
      content: digest.digest.summary || "Thread summary is ready.",
      threadId: "thread_market_update",
      taskId: "task_market_update",
      taskTitle: "Market update",
      deliveryStatus: "sent",
    }),
  );
  return "llm";
}

async function emitRuntimeFlow() {
  const apiBase = process.env.MAIA_API_BASE?.trim();
  if (!apiBase) {
    emit(
      "agent://researcher",
      "event",
      activity({
        agentId: "agent://researcher",
        activity: "idle",
        detail: "MAIA_API_BASE not set. Skipping live computer runtime.",
      }),
    );
    return;
  }

  try {
    const client = createComputerUseClient({
      apiBase,
      userId: process.env.MAIA_USER_ID || "js-live-workbench",
    });
    const session = await client.startSession({
      url: process.env.MAIA_START_URL || "https://example.com",
      requestId: "req_js_live_workbench",
    });
    emit(
      "agent://researcher",
      "event",
      activity({
        agentId: "agent://researcher",
        activity: "browsing",
        detail: `Started computer session ${session.session_id} at ${session.url}`,
        browser: { url: session.url, title: "Computer session" },
      }),
    );

    const task =
      process.env.MAIA_COMPUTER_TASK ||
      "Inspect the homepage and capture one concrete pricing or positioning observation.";
    await new Promise<void>((resolve) => {
      const stop = client.streamSession(session.session_id, {
        task,
        model: process.env.MAIA_COMPUTER_MODEL,
        maxIterations: Number(process.env.MAIA_COMPUTER_MAX_ITERATIONS || 6),
        runId: RUN_ID,
        onEvent(event) {
          const normalized = describeComputerEvent(event);
          emit(
            "agent://researcher",
            "event",
            activity({
              agentId: "agent://researcher",
              activity: normalized.activityType,
              detail: normalized.detail,
              browser: { url: normalized.url || session.url, title: normalized.title || "Runtime stream" },
            }),
          );
        },
        onDone() {
          emit(
            "agent://researcher",
            "event",
            activity({
              agentId: "agent://researcher",
              activity: "idle",
              detail: "Computer runtime stream completed.",
            }),
          );
          stop?.();
          resolve();
        },
        onError(error) {
          emit(
            "agent://researcher",
            "event",
            activity({
              agentId: "agent://researcher",
              activity: "error",
              detail: `Computer runtime error: ${error.message}`,
            }),
          );
          stop?.();
          resolve();
        },
      });
    });
  } catch (error) {
    emit(
      "agent://researcher",
      "event",
      activity({
        agentId: "agent://researcher",
        activity: "error",
        detail: `Failed to use Maia computer runtime: ${error instanceof Error ? error.message : String(error)}`,
      }),
    );
  }
}

app.get("/acp/events", (req, res) => {
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
    "Access-Control-Allow-Origin": "*",
  });
  for (const event of events) {
    res.write(`data: ${JSON.stringify(event)}\n\n`);
  }
  clients.add(res);
  req.on("close", () => clients.delete(res));
});

app.post("/api/run", async (_req, res) => {
  events = [];
  await emitInitialFlow();
  const mode = await emitCollaborationFlow();
  await emitRuntimeFlow();
  res.json({ ok: true, mode });
});

app.get("/health", (_req, res) => {
  res.json({ status: "ok", events: events.length });
});

app.listen(PORT, () => {
  console.log(`\nMaia JS Live Workbench server`);
  console.log(`SSE:    http://localhost:${PORT}/acp/events`);
  console.log(`Run:    POST http://localhost:${PORT}/api/run`);
  console.log(`Health: http://localhost:${PORT}/health\n`);
});
