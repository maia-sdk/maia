import { describe, it, expect } from "vitest";
import { renderEvent, LOGO, RESET, RED, GREEN, YELLOW, CYAN } from "./render";

describe("cli render", () => {
  it("exports LOGO banner", () => {
    expect(LOGO).toBeDefined();
    expect(typeof LOGO).toBe("string");
    expect(LOGO.length).toBeGreaterThan(0);
  });

  it("exports ANSI color codes", () => {
    expect(RESET).toBeDefined();
    expect(RED).toBeDefined();
    expect(GREEN).toBeDefined();
    expect(YELLOW).toBeDefined();
    expect(CYAN).toBeDefined();
  });

  it("renderEvent formats a message event", () => {
    const event = {
      acp_version: "1.0",
      run_id: "run_1",
      agent_id: "agent://researcher",
      event_type: "message",
      timestamp: "2026-03-25T12:00:00Z",
      payload: { content: "Hello world", intent: "propose" },
    };
    const output = renderEvent(event);
    expect(typeof output).toBe("string");
    expect(output.length).toBeGreaterThan(0);
  });

  it("renderEvent handles unknown event type gracefully", () => {
    const event = {
      acp_version: "1.0",
      run_id: "run_1",
      agent_id: "agent://test",
      event_type: "unknown_type",
      timestamp: "2026-03-25T12:00:00Z",
      payload: {},
    };
    const output = renderEvent(event);
    expect(typeof output).toBe("string");
  });

  it("renderEvent handles activity events", () => {
    const event = {
      acp_version: "1.0",
      run_id: "run_1",
      agent_id: "agent://browser",
      event_type: "event",
      timestamp: "2026-03-25T12:00:00Z",
      payload: { activity: "browsing", detail: "https://example.com" },
    };
    const output = renderEvent(event);
    expect(typeof output).toBe("string");
  });
});