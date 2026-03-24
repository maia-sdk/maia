/**
 * MessageBubble — renders a single agent message in the team thread.
 * Shows avatar, name, role, intent badge, thinking, content, and artifacts.
 */
import React from "react";
import type { ACPEvent, ACPMessage, ACPCapabilities } from "@maia/acp";
import { AgentAvatar } from "./AgentAvatar";

export interface MessageBubbleProps {
  event: ACPEvent;
  agents?: Map<string, ACPCapabilities>;
  showThinking?: boolean;
  compact?: boolean;
}

const INTENT_BADGE: Record<string, { label: string; color: string }> = {
  propose: { label: "Proposes", color: "bg-blue-100 text-blue-700" },
  challenge: { label: "Challenges", color: "bg-red-100 text-red-700" },
  clarify: { label: "Asks", color: "bg-yellow-100 text-yellow-700" },
  review: { label: "Reviews", color: "bg-purple-100 text-purple-700" },
  handoff: { label: "Hands off", color: "bg-green-100 text-green-700" },
  summarize: { label: "Summarizes", color: "bg-gray-100 text-gray-700" },
  agree: { label: "Agrees", color: "bg-emerald-100 text-emerald-700" },
  escalate: { label: "Escalates", color: "bg-orange-100 text-orange-700" },
};

function formatTime(timestamp: string): string {
  try {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

export function MessageBubble({ event, agents, showThinking, compact }: MessageBubbleProps) {
  const msg = event.payload as unknown as ACPMessage;
  const agentId = msg.from ?? event.agent_id;
  const agentName = agentId.replace("agent://", "");
  const caps = agents?.get(agentId);
  const personality = caps?.personality;
  const badge = INTENT_BADGE[msg.intent] ?? INTENT_BADGE.propose;

  return (
    <div className={`flex gap-3 ${compact ? "py-1" : "py-2"}`}>
      {!compact && (
        <div className="flex-shrink-0 pt-0.5">
          <AgentAvatar
            agentId={agentId}
            name={caps?.name}
            emoji={personality?.avatar_emoji}
            color={personality?.avatar_color}
            size="md"
            mood={msg.mood ?? undefined}
          />
        </div>
      )}

      <div className="min-w-0 flex-1">
        {/* Header */}
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-semibold text-gray-900 dark:text-gray-100">
            {caps?.name ?? agentName}
          </span>
          {caps?.role && (
            <span className="text-[11px] text-gray-400">{caps.role}</span>
          )}
          <span
            className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${badge.color}`}
          >
            {badge.label}
          </span>
          <span className="text-[11px] text-gray-300">
            {formatTime(event.timestamp)}
          </span>
        </div>

        {/* Thinking (optional) */}
        {showThinking && msg.thinking && (
          <div className="mt-1 rounded-lg bg-yellow-50 px-3 py-1.5 text-[12px] italic text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-300">
            {msg.thinking}
          </div>
        )}

        {/* Content */}
        <div className="mt-0.5 text-[13px] leading-relaxed text-gray-700 dark:text-gray-300">
          {msg.content}
        </div>

        {/* Artifacts */}
        {msg.artifacts && msg.artifacts.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {msg.artifacts.map((art: any, i: number) => (
              <span
                key={i}
                className="inline-flex items-center rounded-md bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-400"
              >
                {art.title ?? art.kind}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
