/**
 * Theatre — live agent action visualization with visual surfaces.
 * Shows the actual work: browser pages, documents, code editors, dashboards.
 * For conversations, use @maia/teamchat.
 */
import React, { useMemo } from "react";
import type { ACPEvent, ACPActivity } from "@maia/acp";
import { useACPStream } from "../hooks/useACPStream";
import { useReplay } from "../hooks/useReplay";
import { SurfaceRenderer } from "../surfaces/SurfaceRenderer";
import type { SurfaceState, SurfaceType } from "../surfaces/types";
import { ActivityTimeline } from "./ActivityTimeline";
import { CostBar } from "./CostBar";
import { ReplayControls } from "./ReplayControls";

export interface TheatreProps {
  streamUrl?: string | null;
  recordedEvents?: ACPEvent[];
  budgetUsd?: number;
  /** Show visual surface (default true) or just activity timeline. */
  showSurface?: boolean;
  className?: string;
  onEvent?: (event: ACPEvent) => void;
  height?: string;
}

export function Theatre({
  streamUrl = null,
  recordedEvents,
  budgetUsd,
  showSurface = true,
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

  // Derive current surface from the latest activity event
  const currentSurface = useMemo(() => deriveSurface(events), [events]);

  return (
    <div
      className={`flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950 ${className}`}
      style={{ height }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-gray-100 px-4 py-2.5 dark:border-gray-800">
        <h3 className="text-[13px] font-semibold text-gray-800 dark:text-gray-200">Theatre</h3>
        <span className={`h-2 w-2 rounded-full ${connected ? "bg-green-400" : "bg-gray-300"}`} />
        {!isReplayMode && stream.runId && (
          <span className="text-[11px] text-gray-400">Run: {stream.runId.slice(0, 8)}</span>
        )}
      </div>

      {/* Main content: Surface (top) + Timeline (bottom) */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {showSurface && (
          <div className="flex-1 overflow-hidden p-2">
            <SurfaceRenderer surface={currentSurface} className="h-full" />
          </div>
        )}
        <div className={`${showSurface ? "h-36 flex-shrink-0 border-t border-gray-100 dark:border-gray-800" : "flex-1"} overflow-hidden`}>
          <ActivityTimeline events={events} className="h-full" />
        </div>
      </div>

      <CostBar events={events} budgetUsd={budgetUsd} />
      {isReplayMode && <ReplayControls replay={replay} />}
    </div>
  );
}

/**
 * Derive the current visual surface from the latest activity events.
 * Maps ACP activity types to Theatre surface types.
 */
function deriveSurface(events: ACPEvent[]): SurfaceState | null {
  // Find the latest activity event
  for (let i = events.length - 1; i >= 0; i--) {
    const ev = events[i];
    if (ev.event_type !== "event") continue;
    const act = ev.payload as unknown as ACPActivity;
    if (!act?.activity) continue;

    const agentId = act.agent_id ?? ev.agent_id;
    const agentName = agentId.replace("agent://", "");
    const detail = act.detail ?? "";

    const type = mapActivityToSurface(act.activity, act);
    if (type === "idle") continue;

    return {
      type,
      agentId,
      agentName,
      title: detail,
      url: act.browser?.url,
      screenshot: act.browser?.screenshot_url,
      status: `${agentName} is ${act.activity.replace("_", " ")}`,
      content: detail,
    };
  }
  return null;
}

function mapActivityToSurface(activity: string, act: any): SurfaceType {
  if (activity === "browsing") return "browser";
  if (activity === "searching") return "search";
  if (activity === "reading") return "document";
  if (activity === "writing") return "editor";
  if (activity === "coding") return "editor";
  if (activity === "analyzing") return "dashboard";
  if (activity === "tool_calling") {
    const tool = act?.tool?.tool_id ?? "";
    if (tool.includes("sql") || tool.includes("query") || tool.includes("database")) return "database";
    if (tool.includes("email") || tool.includes("gmail")) return "email";
    if (tool.includes("slack") || tool.includes("teams") || tool.includes("discord")) return "chat";
    if (tool.includes("jira") || tool.includes("linear") || tool.includes("trello")) return "kanban";
    if (tool.includes("calendar") || tool.includes("calendly")) return "calendar";
    if (tool.includes("salesforce") || tool.includes("hubspot")) return "crm";
    if (tool.includes("github") && tool.includes("pr")) return "diff";
    if (tool.includes("api") || tool.includes("webhook")) return "api";
    return "terminal";
  }
  if (activity === "reviewing") return "document";
  return "idle";
}