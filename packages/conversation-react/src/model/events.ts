import type { CollaborationEntryLike, ConversationRow } from "./types";
import { canonicalAgentId, displayAgentName, metadataMap, normalizeEntryType, toTimestamp } from "./utils";

const CONVERSATION_ENTRY_TYPES = new Set<string>([
  "chat",
  "question",
  "answer",
  "challenge",
  "revision",
  "dialogue",
  "disagreement",
  "handoff",
  "review",
  "summary",
  "message",
]);

const PRIMARY_CONVERSATION_ENTRY_TYPES = new Set<string>([
  "chat",
  "question",
  "answer",
  "challenge",
  "revision",
  "summary",
]);

function looksLikeMachineIdentifier(text: string): boolean {
  const normalized = String(text || "").trim();
  return Boolean(normalized && !/\s/.test(normalized) && /[._:/-]/.test(normalized) && /^[a-z0-9._:/-]+$/i.test(normalized));
}

function looksLikeToolOrRuntimeIdentifier(text: string): boolean {
  const normalized = String(text || "").trim().toLowerCase();
  if (!normalized) return false;
  if (normalized.includes(".") || normalized.includes("/") || normalized.includes(":")) return true;
  const tokens = normalized.split(/[\s._:/-]+/).map((token) => token.trim()).filter(Boolean);
  const toolishTokens = new Set(["playwright", "browser", "tool", "connector", "provider"]);
  return tokens.some((token) => toolishTokens.has(token));
}

export function mergeRows(remoteRows: CollaborationEntryLike[], fallbackRows: CollaborationEntryLike[]): ConversationRow[] {
  const merged = new Map<string, ConversationRow>();
  for (const row of [...remoteRows, ...fallbackRows]) {
    const timestamp = toTimestamp(row.timestamp);
    const metadata = metadataMap(row);
    const eventId = String(metadata.event_id || "").trim();
    const messageId = String(metadata.message_id || "").trim();
    const key = messageId
      ? `${String(row.run_id || "").trim()}|${messageId}|${normalizeEntryType(row)}`
      : [
          canonicalAgentId(row, "from"),
          canonicalAgentId(row, "to"),
          String(row.message || "").trim().toLowerCase(),
          normalizeEntryType(row),
          String(timestamp),
          eventId,
        ].join("|");
    merged.set(key, {
      ...row,
      from_agent: displayAgentName(row, "from"),
      to_agent: displayAgentName(row, "to"),
      entry_type: normalizeEntryType(row),
      timestamp,
      metadata,
    });
  }
  return [...merged.values()].sort((left, right) => left.timestamp - right.timestamp);
}

export function filterConversationRows(rows: ConversationRow[]): ConversationRow[] {
  const filtered = rows.filter((row) => {
    const message = String(row.message || "").trim();
    if (!message || looksLikeMachineIdentifier(message) || message.toLowerCase().startsWith("provider:")) return false;
    const fromAgent = String(row.from_agent || "").trim().toLowerCase();
    const toAgent = String(row.to_agent || "").trim().toLowerCase();
    if (looksLikeToolOrRuntimeIdentifier(fromAgent) || looksLikeToolOrRuntimeIdentifier(toAgent)) return false;
    if (fromAgent && toAgent && fromAgent === toAgent) return false;
    const metadata = metadataMap(row);
    const eventType = String(metadata.event_type || "").trim().toLowerCase();
    const turnType = String(metadata.turn_type || "").trim().toLowerCase();
    const interactionLabel = String(metadata.interaction_label || "").trim().toLowerCase();
    const isConversationEventType = eventType === "team_chat_message" || eventType === "agent_dialogue_turn";
    const messageType = String(metadata.message_type || "").trim().toLowerCase();
    if (!CONVERSATION_ENTRY_TYPES.has(row.entry_type)) return false;
    if (turnType === "status" || turnType === "update") return false;
    if (messageType === "thinking" || row.entry_type === "status") return false;
    if (interactionLabel === "status" || interactionLabel === "update") return false;
    if (metadata.narration === true) return false;
    if (eventType.startsWith("assembly_") || eventType.startsWith("workflow_") || eventType.startsWith("tool_") || eventType.startsWith("api_call_")) return false;
    const isPlanningMarker = !isConversationEventType && (metadata.from_step != null || metadata.to_step != null || metadata.connector_id != null);
    if (isPlanningMarker) return false;
    if (row.entry_type === "message" && eventType !== "team_chat_message") return false;
    return true;
  });

  const hasPrimaryRows = filtered.some((row) => {
    const eventType = String(metadataMap(row).event_type || "").trim().toLowerCase();
    return PRIMARY_CONVERSATION_ENTRY_TYPES.has(row.entry_type) || eventType === "team_chat_message" || eventType === "agent_dialogue_turn";
  });

  if (!hasPrimaryRows) return filtered;
  return filtered.filter((row) => {
    const eventType = String(metadataMap(row).event_type || "").trim().toLowerCase();
    return eventType === "team_chat_message" || eventType === "agent_dialogue_turn" || PRIMARY_CONVERSATION_ENTRY_TYPES.has(row.entry_type);
  });
}
