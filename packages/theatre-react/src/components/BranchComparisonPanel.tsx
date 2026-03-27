import React from "react";
import type { DebuggerBranchRunComparison } from "../panels/deriveDebuggerState";

export interface BranchComparisonPanelProps {
  comparison?: DebuggerBranchRunComparison;
  className?: string;
}

export function BranchComparisonPanel({ comparison, className = "" }: BranchComparisonPanelProps) {
  if (!comparison) {
    return (
      <div className={`rounded-2xl border border-dashed border-slate-300 bg-white/70 px-4 py-6 text-sm text-slate-500 ${className}`}>
        Execute a branch run to compare the original path with the descendant run.
      </div>
    );
  }

  const diverged = comparison.originalChosenOptionId !== comparison.branchChosenOptionId;

  return (
    <div className={`rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm ${className}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Branch comparison</div>
          <h4 className="mt-1 text-base font-semibold text-slate-900">{comparison.branchedRunId}</h4>
        </div>
        <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.05em] text-slate-700">
          {comparison.branchStatus}
        </span>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
          <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Source run</div>
          <div className="mt-1 text-sm text-slate-700">{comparison.sourceRunId}</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
          <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Branch run</div>
          <div className="mt-1 text-sm text-slate-700">{comparison.branchedRunId}</div>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
          <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Inherited prefix</div>
          <div className="mt-1 text-sm text-slate-700">{comparison.inheritedPrefixCount} event(s)</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
          <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Source tail</div>
          <div className="mt-1 text-sm text-slate-700">{comparison.sourceTailCount} event(s)</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
          <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Branch events</div>
          <div className="mt-1 text-sm text-slate-700">{comparison.branchEventCount} event(s)</div>
        </div>
      </div>

      <div className={`mt-4 rounded-xl border px-3 py-3 ${diverged ? "border-amber-200 bg-amber-50" : "border-emerald-200 bg-emerald-50"}`}>
        <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Decision delta</div>
        <div className="mt-2 grid gap-3 sm:grid-cols-2">
          <div>
            <div className="text-xs font-semibold text-slate-600">Original option</div>
            <div className="mt-1 text-sm text-slate-900">{comparison.originalChosenOptionId ?? "none captured"}</div>
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-600">Branch option</div>
            <div className="mt-1 text-sm text-slate-900">{comparison.branchChosenOptionId ?? "none captured"}</div>
          </div>
        </div>
      </div>

      <div className="mt-4">
        <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Outcome</div>
        <p className="mt-1 text-sm leading-6 text-slate-700">{comparison.divergenceSummary}</p>
      </div>
    </div>
  );
}