import { describe, it, expect } from "vitest";
import {
  TeamChat,
  ConversationPanel,
  ConversationThread,
  AgentBubble,
  ReviewBadge,
  TypingIndicator,
  useConversationStream,
  toConversationGroups,
} from "./index";

describe("teamchat exports", () => {
  it("exports primary conversation components", () => {
    expect(ConversationPanel).toBeDefined();
    expect(typeof ConversationPanel).toBe("function");
    expect(ConversationThread).toBeDefined();
    expect(typeof ConversationThread).toBe("function");
  });

  it("keeps legacy TeamChat exports", () => {
    expect(TeamChat).toBeDefined();
    expect(typeof TeamChat).toBe("function");
    expect(AgentBubble).toBeDefined();
    expect(typeof AgentBubble).toBe("function");
    expect(ReviewBadge).toBeDefined();
    expect(typeof ReviewBadge).toBe("function");
    expect(TypingIndicator).toBeDefined();
    expect(typeof TypingIndicator).toBe("function");
    expect(useConversationStream).toBeDefined();
    expect(typeof useConversationStream).toBe("function");
  });

  it("exports conversation helpers", () => {
    expect(toConversationGroups).toBeDefined();
    expect(typeof toConversationGroups).toBe("function");
  });
});
