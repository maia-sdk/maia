/**
 * Theatre — the main component. Drop it in and watch agents collaborate.
 *
 * Usage:
 *   <Theatre streamUrl="/acp/events" />
 *
 * That's it. Works with ACP-native and non-ACP SSE streams.
 */
import React, { useState } from "react";
import type { ACPEvent } from "@maia/acp";
import { useACPStream } from "../hooks/useACPStream";
import { useReplay } from "../hooks/useReplay";
import { TeamThread } from "./TeamThread";
import { ActivityTimeline } from "./ActivityTimeline";
import { CostBar } from "./CostBar";
import { ReplayControls } from "./ReplayControls";

export interface TheatreProps {
  /** SSE endpoint URL for live mode. */
  streamUrl?: string | null;
  /** Pre-recorded events for replay mode. */
  recordedEvents?: ACPEvent[];
  /** Budget in USD — shows a budget bar with warning. */
  budgetUsd?: number;
  /** Show agent thinking/reasoning text. */
  showThinking?: boolean;
  /** Initial tab: "chat" or "activity". */
  defaultTab?: "chat" | "activity";
  /** Compact mode — smaller, no avatars. */
  compact?: boolean;
  /** Custom class name for the container. */
  className?: string;
  /** Callback for each event. */
  onEvent?: (event: ACPEvent) => void;
  /** Height of the Theatre (default "100%"). */
  height?: string;
}

type Tab = "chat" | "activity";

export function Theatre({
  streamUrl = null,
  recordedEvents,
  budgetUsd,
  showThinking = false,
  defaultTab = "chat",
  compact = false,
  className = "",
  onEvent,
  height = "100%",
}: TheatreProps) {
  const [tab, setTab] = useState<Tab>(defaultTab);
  const isReplayMode = !!recordedEvents && !streamUrl;

  // Live mode
  const stream = useACPStream({
    url: streamUrl,
    autoConnect: !!streamUrl,
    onEvent,
  });

  // Replay mode
  const replay = useReplay({
    events: recordedEvents ?? [],
    autoPlay: false,
  });

  // Pick the right event source
  const events = isReplayMode ? replay.visibleEvents : stream.events;
  const messages = events.filter((e) => e.event_type === "message");
  const connected = isReplayMode ? true : stream.connected;

  return (
    <div
      className={`flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950 ${className}`}
      style={{ height }}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-100 px-4 py-2 dark:border-gray-800">
        <div className="flex items-center gap-3">
          <h3 className="text-[13px] font-semibold text-gray-800 dark:text-gray-200">
            Theatre
          </h3>
          <span
            className={`h-2 w-2 rounded-full ${connected ? "bg-green-400" : "bg-gray-300"}`}
            title={connected ? "Connected" : "Disconnected"}
          />
          {!isReplayMode && stream.runId && (
            <span className="text-[11px] text-gray-400">
              Run: {stream.runId.slice(0, 8)}
            </span>
          )}
        </div>

        {/* Tabs */}
        <div className="flex rounded-lg bg-gray-100 p-0.5 dark:bg-gray-800">
          <button
            onClick={() => setTab("chat")}
            className={`rounded-md px-3 py-1 text-[12px] font-medium transition-colors ${
              tab === "chat"
                ? "bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-gray-100"
                : "text-gray-500 hover:text-gray-700 dark:text-gray-400"
            }`}
          >
            Team Chat
            {messages.length > 0 && (
              <span className="ml-1 text-[10px] text-gray-400">
                ({messages.length})
              </span>
            )}
          </button>
          <button
            onClick={() => setTab("activity")}
            className={`rounded-md px-3 py-1 text-[12px] font-medium transition-colors ${
              tab === "activity"
                ? "bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-gray-100"
                : "text-gray-500 hover:text-gray-700 dark:text-gray-400"
            }`}
          >
            Activity
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {tab === "chat" ? (
          <TeamThread
            messages={messages}
            agents={stream.agents}
            showThinking={showThinking}
            compact={compact}
            className="h-full"
          />
        ) : (
          <ActivityTimeline events={events} className="h-full" />
        )}
      </div>

      {/* Cost bar */}
      <CostBar events={events} budgetUsd={budgetUsd} />

      {/* Replay controls (only in replay mode) */}
      {isReplayMode && <ReplayControls replay={replay} />}
    </div>
  );
}
