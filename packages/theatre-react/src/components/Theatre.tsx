/**
 * Theatre — live agent action visualization.
 * Shows tool calls, browsing, searching, cost — NOT conversations.
 * For conversations, use @maia/teamchat.
 *
 * Usage:
 *   <Theatre streamUrl="/acp/events" />
 */
import React from "react";
import type { ACPEvent } from "@maia/acp";
import { useACPStream } from "../hooks/useACPStream";
import { useReplay } from "../hooks/useReplay";
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
  /** Custom class name. */
  className?: string;
  /** Callback for each event. */
  onEvent?: (event: ACPEvent) => void;
  /** Height (default "100%"). */
  height?: string;
}

export function Theatre({
  streamUrl = null,
  recordedEvents,
  budgetUsd,
  className = "",
  onEvent,
  height = "100%",
}: TheatreProps) {
  const isReplayMode = !!recordedEvents && !streamUrl;

  const stream = useACPStream({
    url: streamUrl,
    autoConnect: !!streamUrl,
    onEvent,
  });

  const replay = useReplay({
    events: recordedEvents ?? [],
    autoPlay: false,
  });

  const events = isReplayMode ? replay.visibleEvents : stream.events;
  const connected = isReplayMode ? true : stream.connected;

  return (
    <div
      className={`flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950 ${className}`}
      style={{ height }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-gray-100 px-4 py-2.5 dark:border-gray-800">
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

      {/* Activity timeline */}
      <div className="flex-1 overflow-hidden">
        <ActivityTimeline events={events} className="h-full" />
      </div>

      {/* Cost bar */}
      <CostBar events={events} budgetUsd={budgetUsd} />

      {/* Replay controls */}
      {isReplayMode && <ReplayControls replay={replay} />}
    </div>
  );
}