/**
 * ChatSurface — Slack/Teams-like message interface.
 * Shows when agents interact with Slack, Teams, Discord, Intercom.
 */
import React, { useEffect, useRef } from "react";
import type { SurfaceState } from "./types";

export function ChatSurface({ surface }: { surface: SurfaceState }) {
  const msgs = surface.chatMessages ?? [];
  const bottomRef = useRef<HTMLDivElement>(null);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs.length]);

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
      {/* Channel header */}
      <div className="flex items-center gap-2 border-b border-gray-100 bg-gray-50 px-4 py-2 dark:border-gray-700 dark:bg-gray-800">
        <span className="text-[14px]">#</span>
        <span className="text-[13px] font-semibold text-gray-700 dark:text-gray-300">
          {surface.title || "general"}
        </span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-auto px-4 py-2">
        {msgs.map((msg, i) => (
          <div key={i} className="flex gap-2.5 py-1.5">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded bg-gray-200 text-[11px] font-bold text-gray-600 dark:bg-gray-700 dark:text-gray-400">
              {msg.avatar ?? msg.sender.slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="flex items-baseline gap-2">
                <span className="text-[13px] font-semibold text-gray-900 dark:text-gray-100">{msg.sender}</span>
                <span className="text-[10px] text-gray-400">{msg.time}</span>
              </div>
              <div className="text-[13px] text-gray-700 dark:text-gray-300">{msg.text}</div>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div className="border-t border-gray-100 bg-gray-50 px-4 py-2 dark:border-gray-700 dark:bg-gray-800">
        <div className="flex items-center rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-[13px] text-gray-400 dark:border-gray-600 dark:bg-gray-700">
          {surface.agentName} is typing...
          <span className="ml-1 inline-flex gap-0.5">
            <span className="h-1 w-1 animate-bounce rounded-full bg-gray-400" style={{ animationDelay: "0ms" }} />
            <span className="h-1 w-1 animate-bounce rounded-full bg-gray-400" style={{ animationDelay: "150ms" }} />
            <span className="h-1 w-1 animate-bounce rounded-full bg-gray-400" style={{ animationDelay: "300ms" }} />
          </span>
        </div>
      </div>
    </div>
  );
}