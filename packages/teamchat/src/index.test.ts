import { describe, it, expect } from "vitest";
import {
  TeamChat,
  AgentBubble,
  ReviewBadge,
  TypingIndicator,
  useConversationStream,
} from "./index";

describe("teamchat exports", () => {
  it("exports TeamChat component", () => {
    expect(TeamChat).toBeDefined();
    expect(typeof TeamChat).toBe("function");
  });

  it("exports AgentBubble component", () => {
    expect(AgentBubble).toBeDefined();
    expect(typeof AgentBubble).toBe("function");
  });

  it("exports ReviewBadge component", () => {
    expect(ReviewBadge).toBeDefined();
    expect(typeof ReviewBadge).toBe("function");
  });

  it("exports TypingIndicator component", () => {
    expect(TypingIndicator).toBeDefined();
    expect(typeof TypingIndicator).toBe("function");
  });

  it("exports useConversationStream hook", () => {
    expect(useConversationStream).toBeDefined();
    expect(typeof useConversationStream).toBe("function");
  });
});