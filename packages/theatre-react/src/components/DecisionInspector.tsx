import React from "react";
import type { DebuggerState } from "../panels/deriveDebuggerState";
import { decisionLabel } from "../panels/deriveDebuggerState";

export interface DecisionInspectorProps {
  node?: DebuggerState["decisions"][number];
  className?: string;
}

export function DecisionInspector({ node, className = "" }: DecisionInspectorProps) {
  if (!node) {
    return (
      <div className={`rounded-2xl border border-dashed border-slate-300 bg-white/70 px-4 py-6 text-sm text-slate-500 ${className}`}>
        Select a decision to inspect its category, rationale, and candidate options.
      </div>
    );
  }

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
