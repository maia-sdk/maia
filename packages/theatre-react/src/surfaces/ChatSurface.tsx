/**
 * ChatSurface — Slack/Teams-like message interface in Theatre.
 * Avatar bubbles, timestamps, typing indicator with staggered dots.
 */
import { useEffect, useRef } from "react";
import type { SurfaceState } from "./types";

function avatarColor(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h << 5) - h + name.charCodeAt(i);
  return `hsl(${Math.abs(h) % 360} 65% 55%)`;
}

function initials(name: string): string {
  const parts = name.trim().split(/[\s_\-.]+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return (parts[0] || "A").slice(0, 2).toUpperCase();
}

export function ChatSurface({ surface }: { surface: SurfaceState }) {
  const messages = surface.chatMessages || [];
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
      {/* Channel header */}
      <div className="flex items-center gap-2 border-b border-gray-100 bg-white px-3 py-2 dark:border-gray-700 dark:bg-gray-800">
        <span className="text-[14px] font-semibold text-gray-700 dark:text-gray-300">#{surface.title || "general"}</span>
        {messages.length > 0 && <span className="text-[11px] text-gray-400">{messages.length} messages</span>}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-2">
        {messages.map((msg, i) => (
          <div key={i} className="mb-3 flex items-start gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-[11px] font-semibold text-white" style={{ backgroundColor: avatarColor(msg.sender) }}>
              {msg.avatar || initials(msg.sender)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline gap-2">
                <span className="text-[13px] font-semibold text-gray-800 dark:text-gray-200">{msg.sender}</span>
                <span className="text-[10px] text-gray-400">{msg.time}</span>
              </div>
              <p className="mt-0.5 text-[13px] leading-[1.5] text-gray-600 dark:text-gray-400">{msg.text}</p>
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        <div className="flex items-center gap-2 py-1">
          <div className="flex gap-1">
            {[0, 150, 300].map((delay) => (
              <span key={delay} className="h-1.5 w-1.5 rounded-full bg-gray-400" style={{ animation: `bounce 1.4s infinite ${delay}ms` }} />
            ))}
          </div>
          <span className="text-[11px] text-gray-400">{surface.agentName} is typing...</span>
        </div>
        <div ref={endRef} />
      </div>

      {/* Input bar */}
      <div className="border-t border-gray-100 px-3 py-2 dark:border-gray-700">
        <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-[12px] text-gray-400 dark:border-gray-600 dark:bg-gray-800">
          Message #{surface.title || "general"}
        </div>
      </div>

      <style>{`@keyframes bounce { 0%,60%,100% { opacity:.3; transform:translateY(0) } 30% { opacity:1; transform:translateY(-4px) } }`}</style>
    </div>
  );
}