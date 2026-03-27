import React from "react";
import type { DebuggerState } from "../panels/deriveDebuggerState";
import { decisionLabel } from "../panels/deriveDebuggerState";

export interface DecisionTimelineProps {
  decisions: DebuggerState["decisions"];
  selectedDecisionId?: string;
  onSelect?: (decisionId: string) => void;
  className?: string;
}

export function DecisionTimeline({
  decisions,
  selectedDecisionId,
  onSelect,
  className = "",
}: DecisionTimelineProps) {
  if (decisions.length === 0) {
    return (
      <div className={`rounded-2xl border border-dashed border-slate-300 bg-white/70 px-4 py-6 text-sm text-slate-500 ${className}`}>
        No structured decisions have been recorded for this run yet.
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {decisions.map((node, index) => {
        const isSelected = node.decision.decision_id === selectedDecisionId;
        return (
          <button
            key={node.decision.decision_id}
            type="button"
            onClick={() => onSelect?.(node.decision.decision_id)}
            className={`flex w-full items-start gap-3 rounded-2xl border px-4 py-3 text-left transition ${
              isSelected
                ? "border-slate-900 bg-slate-900 text-white"
                : "border-slate-200 bg-white text-slate-900 hover:border-slate-300 hover:bg-slate-50"
            }`}
          >
            <div className={`mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold ${
              isSelected ? "bg-white/15 text-white" : "bg-slate-100 text-slate-700"
            }`}>
              {index + 1}
            </div>
            <div className="min-w-0 flex-1">
              <div className={`text-[11px] font-semibold uppercase tracking-[0.12em] ${isSelected ? "text-white/70" : "text-slate-500"}`}>
                {decisionLabel(node.decision)}
              </div>
              <div className="mt-1 text-sm font-medium leading-6">
                {node.decision.summary}
              </div>
              <div className={`mt-2 flex flex-wrap items-center gap-2 text-[11px] ${isSelected ? "text-white/70" : "text-slate-500"}`}>
                <span>{node.decision.options?.length ?? 0} option(s)</span>
                <span>&bull;</span>
                <span>{node.beforeEventIds.length} earlier event(s)</span>
                {node.branchable ? (
                  <>
                    <span>&bull;</span>
                    <span className={`rounded-full border px-2 py-0.5 font-semibold uppercase tracking-[0.05em] ${
                      isSelected ? "border-white/20 bg-white/10 text-white" : "border-amber-200 bg-amber-50 text-amber-700"
                    }`}>
                      branch-ready
                    </span>
                  </>
                ) : null}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
