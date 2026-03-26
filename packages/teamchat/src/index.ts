/**
 * @maia/teamchat - Maia's primary JS package for agent conversation UI.
 *
 * Preferred usage:
 *   import { ConversationPanel } from '@maia/teamchat';
 */

export { ConversationPanel } from "./components/ConversationPanel";
export type { ConversationPanelProps } from "./components/ConversationPanel";
export { ConversationThread } from "./components/ConversationThread";
export type { ConversationThreadProps } from "./components/ConversationThread";

export type {
  CollaborationEntryLike,
  ConversationBubble,
  ConversationGroup,
  ConversationRosterMember,
  ConversationRow,
} from "./model";
export type { ConversationACPEvent } from "./model";
export {
  filterConversationRows,
  mergeRows,
  toACPConversationEvent,
  toConversationGroups,
  toConversationRoster,
} from "./model";
export {
  actionLabel,
  audienceLabel,
  avatarSeed,
  badgeLabel,
  bubbleClass,
  canonicalAgentId,
  displayAgentName,
  humanizeToken,
  initials,
  metadataMap,
  moodLabel,
  normalizeEntryType,
  speakerName,
  speakerRoleLabel,
  threadLabel,
  toTimestamp,
} from "./model";

// Legacy exports kept for backward compatibility.
export { TeamChat } from "./components/TeamChat";
export type { TeamChatProps } from "./components/TeamChat";
export { AgentBubble } from "./components/AgentBubble";
export type { AgentBubbleProps } from "./components/AgentBubble";
export { ReviewBadge } from "./components/ReviewBadge";
export type { ReviewBadgeProps } from "./components/ReviewBadge";
export { TypingIndicator } from "./components/TypingIndicator";
export type { TypingIndicatorProps } from "./components/TypingIndicator";
export { useConversationStream } from "./hooks/useConversationStream";
export type { UseConversationStreamOptions, ConversationStreamState } from "./hooks/useConversationStream";
