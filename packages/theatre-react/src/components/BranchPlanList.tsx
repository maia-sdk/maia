import React from "react";
import type { DebuggerState } from "../panels/deriveDebuggerState";

export interface BranchPlanListProps {
  branchPlans: DebuggerState["branchPlans"];
  selectedBranchId?: string;
  onSelect?: (branchId: string, sourceDecisionId: string) => void;
  className?: string;
}

export function BranchPlanList({
  branchPlans,
  selectedBranchId,
  onSelect,
  className = "",
}: BranchPlanListProps) {
  if (branchPlans.length === 0) {
    return (
      <div className={`rounded-2xl border border-dashed border-slate-300 bg-white/70 px-4 py-6 text-sm text-slate-500 ${className}`}>
        No persisted branch plans have been recorded for this run yet.
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {branchPlans.map((plan, index) => {
        const isSelected = plan.branchId === selectedBranchId;
        return (
          <button
            key={plan.branchId}
            type="button"
            onClick={() => onSelect?.(plan.branchId, plan.sourceDecisionId)}
            className={`flex w-full items-start gap-3 rounded-2xl border px-4 py-3 text-left transition ${
              isSelected
                ? "border-indigo-600 bg-indigo-600 text-white"
                : "border-slate-200 bg-white text-slate-900 hover:border-slate-300 hover:bg-slate-50"
            }`}
          >
            <div className={`mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold ${
              isSelected ? "bg-white/15 text-white" : "bg-indigo-50 text-indigo-700"
            }`}>
              {index + 1}
            </div>
            <div className="min-w-0 flex-1">
              <div className={`text-[11px] font-semibold uppercase tracking-[0.12em] ${isSelected ? "text-white/70" : "text-slate-500"}`}>
                branch plan
              </div>
              <div className="mt-1 text-sm font-medium leading-6">
                {plan.summary}
              </div>
              <div className={`mt-2 flex flex-wrap items-center gap-2 text-[11px] ${isSelected ? "text-white/70" : "text-slate-500"}`}>
                <span>{plan.status}</span>
                <span>&bull;</span>
                <span>{plan.previewEventIds.length} preview event(s)</span>
                <span>&bull;</span>
                <span>{plan.assumptions.length} assumption(s)</span>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
