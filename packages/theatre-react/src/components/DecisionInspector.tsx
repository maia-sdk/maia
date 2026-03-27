import React from "react";
import type { DebuggerState } from "../panels/deriveDebuggerState";
import { decisionLabel } from "../panels/deriveDebuggerState";

export interface DecisionInspectorProps {
  node?: DebuggerState["decisions"][number];
  branchPlan?: DebuggerState["branchPlans"][number];
  branchRuns?: DebuggerState["branchRuns"];
  onPlanBranch?: (decisionId: string) => void;
  onCreateBranchRun?: (branchId: string) => void;
  className?: string;
}

function formatOverrides(branchPlan: DebuggerState["branchPlans"][number]): string {
  return [branchPlan.overrides.chosenOptionId, branchPlan.overrides.agentId, branchPlan.overrides.model]
    .filter(Boolean)
    .join(" | ");
}

export function DecisionInspector({
  node,
  branchPlan,
  branchRuns = [],
  onPlanBranch,
  onCreateBranchRun,
  className = "",
}: DecisionInspectorProps) {
  if (!node) {
    return (
      <div className={`rounded-2xl border border-dashed border-slate-300 bg-white/70 px-4 py-6 text-sm text-slate-500 ${className}`}>
        Select a decision to inspect its category, rationale, and candidate options.
      </div>
    );
  }

  const linkedBranchRuns = branchPlan
    ? branchRuns.filter((branchRun) => branchRun.branchId === branchPlan.branchId)
    : [];

  return (
    <div className={`rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm ${className}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
            {decisionLabel(node.decision)}
          </div>
          <h4 className="mt-1 text-base font-semibold text-slate-900">{node.decision.summary}</h4>
        </div>
        {node.decision.step_index != null ? (
          <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-600">
            step {node.decision.step_index}
          </span>
        ) : null}
      </div>

      <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Branch planning</div>
            <div className="mt-1 text-sm text-slate-700">
              {node.branchable
                ? "This decision can be used as a branch point."
                : "This decision is not currently marked as branchable."}
            </div>
          </div>
          {node.branchable ? (
            <button
              type="button"
              onClick={() => onPlanBranch?.(node.decision.decision_id)}
              className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-100"
            >
              Plan branch
            </button>
          ) : null}
        </div>
        {node.branchReasons.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {node.branchReasons.map((reason) => (
              <span
                key={reason}
                className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[11px] text-slate-600"
              >
                {reason}
              </span>
            ))}
          </div>
        ) : null}
      </div>

      {node.decision.reasoning ? (
        <div className="mt-4">
          <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Rationale</div>
          <p className="mt-1 text-sm leading-6 text-slate-700">{node.decision.reasoning}</p>
        </div>
      ) : null}

      {node.decision.options && node.decision.options.length > 0 ? (
        <div className="mt-4">
          <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Options</div>
          <div className="mt-2 space-y-2">
            {node.decision.options.map((option: NonNullable<DebuggerState["decisions"][number]["decision"]["options"]>[number]) => {
              const chosen = option.option_id === node.decision.chosen_option_id;
              return (
                <div
                  key={option.option_id}
                  className={`rounded-xl border px-3 py-2 ${
                    chosen ? "border-emerald-200 bg-emerald-50" : "border-slate-200 bg-slate-50"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-slate-900">{option.label}</span>
                    {chosen ? (
                      <span className="rounded-full border border-emerald-200 bg-white px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.05em] text-emerald-700">
                        chosen
                      </span>
                    ) : null}
                    {option.score != null ? (
                      <span className="ml-auto text-[11px] text-slate-500">score {option.score}</span>
                    ) : null}
                  </div>
                  {option.rationale ? (
                    <p className="mt-1 text-[12px] leading-5 text-slate-600">{option.rationale}</p>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      {branchPlan ? (
        <div className="mt-4 rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-indigo-700">Planned branch</div>
              <div className="mt-1 text-sm font-medium text-slate-900">{branchPlan.summary}</div>
            </div>
            <span className="rounded-full border border-indigo-200 bg-white px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.05em] text-indigo-700">
              {branchPlan.status}
            </span>
          </div>
          <div className="mt-3">
            <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Assumptions</div>
            <ul className="mt-1 space-y-1 text-sm leading-6 text-slate-700">
              {branchPlan.assumptions.map((assumption) => (
                <li key={assumption}>- {assumption}</li>
              ))}
            </ul>
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-indigo-100 bg-white px-3 py-2">
              <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Preview window</div>
              <div className="mt-1 text-sm text-slate-700">{branchPlan.previewEventIds.length} event id(s)</div>
            </div>
            <div className="rounded-xl border border-indigo-100 bg-white px-3 py-2">
              <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Overrides</div>
              <div className="mt-1 text-sm text-slate-700">
                {formatOverrides(branchPlan) || "No overrides applied"}
              </div>
            </div>
          </div>
          <div className="mt-3 rounded-xl border border-indigo-100 bg-white px-3 py-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Branch run contract</div>
                <div className="mt-1 text-sm text-slate-700">
                  Persist a branch-run record for this plan before implementing real branched execution.
                </div>
              </div>
              <button
                type="button"
                onClick={() => onCreateBranchRun?.(branchPlan.branchId)}
                className="rounded-xl border border-indigo-300 bg-indigo-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={linkedBranchRuns.length > 0}
              >
                {linkedBranchRuns.length > 0 ? "Branch run created" : "Create branch run"}
              </button>
            </div>
            {linkedBranchRuns.length > 0 ? (
              <div className="mt-3 space-y-2">
                {linkedBranchRuns.map((branchRun) => (
                  <div key={branchRun.branchRunId} className="rounded-xl border border-indigo-100 bg-indigo-50 px-3 py-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium text-slate-900">{branchRun.branchedRunId}</span>
                      <span className="rounded-full border border-indigo-200 bg-white px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.05em] text-indigo-700">
                        {branchRun.status}
                      </span>
                    </div>
                    <div className="mt-1 text-[12px] leading-5 text-slate-600">{branchRun.summary}</div>
                    {branchRun.notes.length > 0 ? (
                      <ul className="mt-2 space-y-1 text-[12px] leading-5 text-slate-600">
                        {branchRun.notes.map((note) => (
                          <li key={note}>- {note}</li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
          <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Before</div>
          <div className="mt-1 text-sm text-slate-700">{node.beforeEventIds.length} event(s)</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
          <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">After</div>
          <div className="mt-1 text-sm text-slate-700">{node.afterEventIds.length} event(s)</div>
        </div>
      </div>
    </div>
  );
}
