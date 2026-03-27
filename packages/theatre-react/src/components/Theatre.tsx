/**
 * Theatre - the main component. Drop it in and watch agents collaborate.
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
import { ProvenancePanel } from "./ProvenancePanel";
import { DecisionTimeline } from "./DecisionTimeline";
import { DecisionInspector } from "./DecisionInspector";
import { BranchPlanList } from "./BranchPlanList";
import { BranchComparisonPanel } from "./BranchComparisonPanel";
import { CostBar } from "./CostBar";
import { ReplayControls } from "./ReplayControls";
import { resolveTheatreTheme } from "../theme";
import type { TheatreThemeOverride } from "../theme";
import {
  compareDebuggerBranchRun,
  createDebuggerBranchPlanEvent,
  deriveDebuggerState,
  executeDebuggerBranchRun,
  planDebuggerBranch,
} from "../panels/deriveDebuggerState";
import type { DebuggerBranchExecution } from "../panels/deriveDebuggerState";

export interface TheatreProps {
  streamUrl?: string | null;
  recordedEvents?: ACPEvent[];
  budgetUsd?: number;
  showThinking?: boolean;
  defaultTab?: "chat" | "activity" | "proof" | "debug";
  compact?: boolean;
  className?: string;
  onEvent?: (event: ACPEvent) => void;
  onBranchPlanEvent?: (event: ACPEvent) => void | Promise<void>;
  onBranchRunEvent?: (event: ACPEvent) => void | Promise<void>;
  onBranchExecution?: (execution: DebuggerBranchExecution) => void | Promise<void>;
  height?: string;
  theme?: TheatreThemeOverride;
}

type Tab = "chat" | "activity" | "proof" | "debug";

export function Theatre({
  streamUrl = null,
  recordedEvents,
  budgetUsd,
  showThinking = false,
  defaultTab = "chat",
  compact = false,
  className = "",
  onEvent,
  onBranchPlanEvent,
  onBranchRunEvent,
  onBranchExecution,
  height = "100%",
  theme,
}: TheatreProps) {
  const [tab, setTab] = useState<Tab>(defaultTab);
  const [selectedDecisionId, setSelectedDecisionId] = useState<string>("");
  const [selectedBranchId, setSelectedBranchId] = useState<string>("");
  const [plannedBranchDecisionId, setPlannedBranchDecisionId] = useState<string>("");
  const [localDebugEvents, setLocalDebugEvents] = useState<ACPEvent[]>([]);
  const resolvedTheme = resolveTheatreTheme(theme);
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

  const sourceEvents = isReplayMode ? replay.visibleEvents : stream.events;
  const persistedBranchPlanIds = new Set(
    sourceEvents
      .filter((event) => event.event_type === "branch_plan")
      .map((event) => ((event.payload as { branch_id?: string }).branch_id))
      .filter(Boolean),
  );
  const persistedBranchRunIds = new Set(
    sourceEvents
      .filter((event) => event.event_type === "branch_run")
      .map((event) => ((event.payload as { branch_run_id?: string }).branch_run_id))
      .filter(Boolean),
  );
  const events = [
    ...sourceEvents,
    ...localDebugEvents.filter((event) => {
      if (event.event_type === "branch_plan") {
        const branchId = (event.payload as { branch_id?: string }).branch_id;
        return !branchId || !persistedBranchPlanIds.has(branchId);
      }
      if (event.event_type === "branch_run") {
        const branchRunId = (event.payload as { branch_run_id?: string }).branch_run_id;
        return !branchRunId || !persistedBranchRunIds.has(branchRunId);
      }
      return true;
    }),
  ];
  const communicationEvents = events.filter(
    (event) =>
      event.event_type === "message" ||
      event.event_type === "handoff" ||
      event.event_type === "review",
  );
  const provenanceEvents = events.filter((event) => event.event_type === "provenance");
  const debuggerState = deriveDebuggerState(events);
  const activeDecision =
    debuggerState.decisions.find((node) => node.decision.decision_id === selectedDecisionId)
    ?? debuggerState.decisions[0];
  const selectedPersistedBranchPlan = debuggerState.branchPlans.find((plan) => plan.branchId === selectedBranchId);
  const persistedBranchPlan = activeDecision
    ? debuggerState.branchPlans.find((plan) => plan.sourceDecisionId === activeDecision.decision.decision_id)
    : undefined;
  const activeBranchPlan = selectedPersistedBranchPlan
    ?? persistedBranchPlan
    ?? (
      activeDecision?.decision.decision_id === plannedBranchDecisionId
        ? planDebuggerBranch(events, plannedBranchDecisionId)
        : undefined
    );
  const activeBranchRuns = activeBranchPlan
    ? debuggerState.branchRuns.filter((branchRun) => branchRun.branchId === activeBranchPlan.branchId)
    : [];
  const activeBranchRun = activeBranchRuns.at(-1);
  const activeBranchComparison = activeBranchRun
    ? compareDebuggerBranchRun(events, activeBranchRun.branchRunId)
    : undefined;
  const connected = isReplayMode ? true : stream.connected;

  function mergeLocalDebugEvent(nextEvent: ACPEvent, key: "branch_id" | "branch_run_id") {
    setLocalDebugEvents((current) => {
      const value = (nextEvent.payload as Record<string, unknown>)[key];
      const next = current.filter((event) => {
        if (event.event_type !== nextEvent.event_type) {
          return true;
        }
        return (event.payload as Record<string, unknown>)[key] !== value;
      });
      return [...next, nextEvent];
    });
  }

  function mergeLocalDebugEvents(nextEvents: ACPEvent[]) {
    for (const event of nextEvents) {
      if (event.event_type === "branch_plan") {
        mergeLocalDebugEvent(event, "branch_id");
      } else if (event.event_type === "branch_run") {
        mergeLocalDebugEvent(event, "branch_run_id");
      } else {
        setLocalDebugEvents((current) => [...current, event]);
      }
    }
  }

  function handleCreateBranchPlan(decisionId: string) {
    const decisionNode = debuggerState.decisions.find((node) => node.decision.decision_id === decisionId);
    if (!decisionNode) {
      return;
    }
    const branchEvent = createDebuggerBranchPlanEvent(sourceEvents, {
      agentId: decisionNode.decision.agent_id,
      decisionId,
    });
    if (!branchEvent) {
      return;
    }
    const branchId = (branchEvent.payload as { branch_id?: string }).branch_id;
    mergeLocalDebugEvent(branchEvent, "branch_id");
    setSelectedBranchId(branchId ?? "");
    setSelectedDecisionId(decisionId);
    setPlannedBranchDecisionId("");
    if (onBranchPlanEvent) {
      void Promise.resolve(onBranchPlanEvent(branchEvent));
    }
  }

  function handleExecuteBranchRun(branchId: string) {
    const branchPlan = debuggerState.branchPlans.find((plan) => plan.branchId === branchId);
    if (!branchPlan) {
      return;
    }
    const sourceDecision =
      debuggerState.decisions.find((node) => node.decision.decision_id === branchPlan.sourceDecisionId)
      ?? activeDecision;
    const execution = executeDebuggerBranchRun(events, {
      agentId: sourceDecision?.decision.agent_id ?? "agent://debugger",
      branchId,
      notes: ["Created from Theatre debugger branch-run contract."],
    });
    if (!execution) {
      return;
    }
    mergeLocalDebugEvents([...execution.lineageEvents, ...execution.branchEvents]);
    setSelectedBranchId(branchId);
    setSelectedDecisionId(branchPlan.sourceDecisionId);
    if (onBranchRunEvent) {
      for (const event of execution.lineageEvents) {
        void Promise.resolve(onBranchRunEvent(event));
      }
    }
    if (onBranchExecution) {
      void Promise.resolve(onBranchExecution(execution));
    }
  }

  return (
    <div className={`${resolvedTheme.theatre.shell} ${className}`} style={{ height }}>
      <div className={resolvedTheme.theatre.header}>
        <div className="flex items-center gap-3">
          <h3 className={resolvedTheme.theatre.title}>Theatre</h3>
          <span
            className={`h-2 w-2 rounded-full ${connected ? resolvedTheme.theatre.statusConnected : resolvedTheme.theatre.statusDisconnected}`}
            title={connected ? "Connected" : "Disconnected"}
          />
          {!isReplayMode && stream.runId && (
            <span className={resolvedTheme.theatre.statusMeta}>
              Run: {stream.runId.slice(0, 8)}
            </span>
          )}
        </div>

        <div className={resolvedTheme.theatre.tabsWrap}>
          <button
            onClick={() => setTab("chat")}
            className={`${resolvedTheme.theatre.tabBase} ${
              tab === "chat"
                ? resolvedTheme.theatre.tabActive
                : resolvedTheme.theatre.tabInactive
            }`}
          >
            Team Chat
            {communicationEvents.length > 0 && (
              <span className={resolvedTheme.theatre.statusMeta}>({communicationEvents.length})</span>
            )}
          </button>
          <button
            onClick={() => setTab("activity")}
            className={`${resolvedTheme.theatre.tabBase} ${
              tab === "activity"
                ? resolvedTheme.theatre.tabActive
                : resolvedTheme.theatre.tabInactive
            }`}
          >
            Activity
          </button>
          <button
            onClick={() => setTab("proof")}
            className={`${resolvedTheme.theatre.tabBase} ${
              tab === "proof"
                ? resolvedTheme.theatre.tabActive
                : resolvedTheme.theatre.tabInactive
            }`}
          >
            Proof
            {(provenanceEvents.length > 0 || events.length > 0) && (
              <span className={resolvedTheme.theatre.statusMeta}>
                ({provenanceEvents.length > 0 ? provenanceEvents.length : "derived"})
              </span>
            )}
          </button>
          <button
            onClick={() => setTab("debug")}
            className={`${resolvedTheme.theatre.tabBase} ${
              tab === "debug"
                ? resolvedTheme.theatre.tabActive
                : resolvedTheme.theatre.tabInactive
            }`}
          >
            Debug
            {debuggerState.decisions.length > 0 && (
              <span className={resolvedTheme.theatre.statusMeta}>({debuggerState.decisions.length})</span>
            )}
          </button>
        </div>
      </div>

      <div className={resolvedTheme.theatre.content}>
        {tab === "chat" ? (
          <TeamThread
            messages={communicationEvents}
            agents={stream.agents}
            showThinking={showThinking}
            compact={compact}
            theme={resolvedTheme}
            className="h-full"
          />
        ) : tab === "proof" ? (
          <ProvenancePanel events={events} className="h-full" />
        ) : tab === "debug" ? (
          <div className="grid h-full gap-4 xl:grid-cols-[0.9fr_1.05fr_1fr]">
            <BranchPlanList
              branchPlans={debuggerState.branchPlans}
              selectedBranchId={selectedPersistedBranchPlan?.branchId}
              onSelect={(branchId, sourceDecisionId) => {
                setSelectedBranchId(branchId);
                setSelectedDecisionId(sourceDecisionId);
                setPlannedBranchDecisionId("");
              }}
            />
            <DecisionTimeline
              decisions={debuggerState.decisions}
              selectedDecisionId={activeDecision?.decision.decision_id}
              onSelect={(decisionId) => {
                setSelectedDecisionId(decisionId);
                setSelectedBranchId("");
                if (plannedBranchDecisionId && plannedBranchDecisionId !== decisionId) {
                  setPlannedBranchDecisionId("");
                }
              }}
            />
            <div className="grid gap-4">
              <DecisionInspector
                node={activeDecision}
                branchPlan={activeBranchPlan}
                branchRuns={activeBranchRuns}
                onPlanBranch={handleCreateBranchPlan}
                onExecuteBranchRun={handleExecuteBranchRun}
              />
              <BranchComparisonPanel comparison={activeBranchComparison} />
            </div>
          </div>
        ) : (
          <ActivityTimeline events={events} theme={resolvedTheme} className="h-full" />
        )}
      </div>

      <CostBar events={events} budgetUsd={budgetUsd} />

      {isReplayMode && <ReplayControls replay={replay} />}
    </div>
  );
}
