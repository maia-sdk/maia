/**
 * TeamThread — the core Theatre chat panel showing agents talking
 * to each other in real-time. This is the "Slack for agents" view.
 */
import React, { useEffect, useRef } from "react";
import type { ACPEvent, ACPCapabilities } from "@maia/acp";
import { AgentAvatar } from "./AgentAvatar";
import { MessageBubble } from "./MessageBubble";

export interface TeamThreadProps {
  /** Message events to render. */
  messages: ACPEvent[];
  /** Known agent capabilities for avatar/personality info. */
  agents?: Map<string, ACPCapabilities>;
  /** Currently typing agent IDs (for typing indicators). */
  typingAgents?: string[];
  /** Show thinking text (agent reasoning). */
  showThinking?: boolean;
  /** Compact mode — smaller bubbles, no avatars. */
  compact?: boolean;
  /** Custom class name. */
  className?: string;
}

function TypingIndicator({ agentId, agents }: { agentId: string; agents?: Map<string, ACPCapabilities> }) {
  const caps = agents?.get(agentId);
  const name = caps?.name ?? agentId.replace("agent://", "");

  return (
    <div className="flex items-center gap-3 py-2 text-[12px] text-gray-400">
      <AgentAvatar
        agentId={agentId}
        name={caps?.name}
        emoji={caps?.personality?.avatar_emoji}
        color={caps?.personality?.avatar_color}
        size="sm"
        activity="thinking"
      />
      <span className="italic">
        {name} is thinking
        <span className="inline-flex w-8">
          <span className="animate-pulse">...</span>
        </span>
      </span>
    </div>
  );
}

export function TeamThread({
  messages,
  agents,
  typingAgents = [],
  showThinking = false,
  compact = false,
  className = "",
}: TeamThreadProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  return (
    <div className={`flex flex-col overflow-y-auto ${className}`}>
      {messages.length === 0 && (
        <div className="flex flex-1 items-center justify-center text-[13px] text-gray-400">
          Waiting for agents to start collaborating...
        </div>
      )}

      <div className="space-y-0.5 px-4 py-2">
        {messages.map((event, i) => (
          <MessageBubble
            key={`${event.timestamp}_${i}`}
            event={event}
            agents={agents}
            showThinking={showThinking}
            compact={compact}
          />
        ))}

        {typingAgents.map((id) => (
          <TypingIndicator key={id} agentId={id} agents={agents} />
        ))}
      </div>

      <div ref={bottomRef} />
    </div>
  );
}
