import { describe, it, expect } from "vitest";
import {
  ACPClient,
  envelope,
  message,
  handoff,
  review,
  artifact,
  activity,
  capabilities,
  parseSSELine,
  streamToACPEvents,
  connectToSSE,
} from "./index";

describe("sdk-js re-exports from @maia/acp", () => {
  it("exports ACPClient", () => {
    expect(ACPClient).toBeDefined();
    expect(typeof ACPClient).toBe("function");
  });

  it("exports all builder functions", () => {
    expect(typeof envelope).toBe("function");
    expect(typeof message).toBe("function");
    expect(typeof handoff).toBe("function");
    expect(typeof review).toBe("function");
    expect(typeof artifact).toBe("function");
    expect(typeof activity).toBe("function");
    expect(typeof capabilities).toBe("function");
  });

  it("exports stream utilities", () => {
    expect(typeof parseSSELine).toBe("function");
    expect(typeof streamToACPEvents).toBe("function");
    expect(typeof connectToSSE).toBe("function");
  });

  it("message builder returns valid structure", () => {
    const msg = message({
      from: "agent://a",
      to: "agent://b",
      intent: "propose",
      content: "test",
    });
    expect(msg).toBeDefined();
    expect(msg.content).toBe("test");
  });

  it("envelope wraps payload correctly", () => {
    const ev = envelope("agent://a", "run_1", "message", { content: "hi" });
    expect(ev.acp_version).toBe("1.0");
    expect(ev.agent_id).toBe("agent://a");
    expect(ev.run_id).toBe("run_1");
    expect(ev.event_type).toBe("message");
    expect(ev.payload.content).toBe("hi");
    expect(ev.timestamp).toBeDefined();
  });
});