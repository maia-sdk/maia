/**
 * ActivityTimeline — vertical timeline of all agent activities.
 * Shows tool calls, browser actions, searches, file reads, etc.
 * Complements the TeamThread (chat) with a structured work log.
 */
import React from "react";
import type { ACPEvent, ACPActivity } from "@maia/acp";
import { AgentAvatar } from "./AgentAvatar";

export interface ActivityTimelineProps {
  events: ACPEvent[];
  className?: string;
}

const ACTIVITY_ICONS: Record<string, string> = {
  thinking: "\u{1F914}",
  searching: "\u{1F50D}",
  reading: "\u{1F4D6}",
  writing: "\u{270F}",
  browsing: "\u{1F310}",
  coding: "\u{1F4BB}",
  analyzing: "\u{1F4CA}",
  tool_calling: "\u{1F527}",
  waiting: "\u{23F3}",
  reviewing: "\u{1F50E}",
  idle: "\u{1F4A4}",
  error: "\u{26A0}",
};

const ACTIVITY_COLORS: Record<string, string> = {
  thinking: "border-yellow-300 bg-yellow-50",
  searching: "border-blue-300 bg-blue-50",
  reading: "border-indigo-300 bg-indigo-50",
  writing: "border-green-300 bg-green-50",
  browsing: "border-cyan-300 bg-cyan-50",
  coding: "border-violet-300 bg-violet-50",
  analyzing: "border-orange-300 bg-orange-50",
  tool_calling: "border-gray-300 bg-gray-50",
  waiting: "border-gray-200 bg-gray-50",
  reviewing: "border-purple-300 bg-purple-50",
  error: "border-red-300 bg-red-50",
};

function formatTime(ts: string): string {
  try {
    return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  } catch {
    return "";
  }
}

function ActivityItem({ event }: { event: ACPEvent }) {
  const act = event.payload as unknown as ACPActivity;
  const icon = ACTIVITY_ICONS[act.activity] ?? "\u{2022}";
  const color = ACTIVITY_COLORS[act.activity] ?? "border-gray-300 bg-gray-50";
  const agentName = (act.agent_id ?? event.agent_id).replace("agent://", "");

  return (
    <div className="flex gap-3 py-1.5">
      {/* Timeline line + dot */}
      <div className="flex flex-col items-center">
        <div className={`flex h-6 w-6 items-center justify-center rounded-full border text-[12px] ${color}`}>
          {icon}
        </div>
        <div className="w-px flex-1 bg-gray-200 dark:bg-gray-700" />
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1 pb-2">
        <div className="flex items-center gap-2">
          <span className="text-[12px] font-medium text-gray-700 dark:text-gray-300">
            {agentName}
          </span>
          <span className="text-[11px] text-gray-400">
            {act.activity.replace("_", " ")}
          </span>
          <span className="text-[10px] text-gray-300">
            {formatTime(event.timestamp)}
          </span>
        </div>

        {act.detail && (
          <p className="mt-0.5 text-[12px] text-gray-500 dark:text-gray-400">
            {act.detail}
          </p>
        )}

        {/* Tool call details */}
        {act.tool && (
          <div className="mt-1 rounded bg-gray-100 px-2 py-1 text-[11px] font-mono text-gray-600 dark:bg-gray-800 dark:text-gray-400">
            {act.tool.tool_name ?? act.tool.tool_id}
            {act.tool.status && (
              <span className={`ml-2 ${act.tool.status === "failed" ? "text-red-500" : "text-green-500"}`}>
                ({act.tool.status})
              </span>
            )}
          </div>
        )}

        {/* Browser details */}
        {act.browser && (
          <div className="mt-1 flex items-center gap-1.5 rounded bg-cyan-50 px-2 py-1 text-[11px] dark:bg-cyan-900/20">
            <span>{act.browser.action ?? "navigate"}</span>
            <span className="truncate text-cyan-600 dark:text-cyan-400">
              {act.browser.url}
            </span>
          </div>
        )}

        {/* Progress bar */}
        {act.progress && act.progress.total > 0 && (
          <div className="mt-1 h-1.5 w-32 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
            <div
              className="h-full rounded-full bg-blue-500 transition-all"
              style={{ width: `${act.progress.percentage ?? (act.progress.current / act.progress.total) * 100}%` }}
            />
          </div>
        )}

        {/* Cost */}
        {act.cost && act.cost.cost_usd > 0 && (
          <span className="mt-0.5 inline-block text-[10px] text-gray-400">
            ${act.cost.cost_usd.toFixed(4)} ({act.cost.tokens_used} tokens)
          </span>
        )}
      </div>
    </div>
  );
}

export function ActivityTimeline({ events, className = "" }: ActivityTimelineProps) {
  const activityEvents = events.filter((e) => e.event_type === "event");

  return (
    <div className={`overflow-y-auto px-4 py-2 ${className}`}>
      {activityEvents.length === 0 && (
        <div className="py-8 text-center text-[13px] text-gray-400">
          No activity yet
        </div>
      )}
      {activityEvents.map((event, i) => (
        <ActivityItem key={`${event.timestamp}_${i}`} event={event} />
      ))}
    </div>
  );
}
