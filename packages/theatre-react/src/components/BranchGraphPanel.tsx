import React from "react";
import type { DebuggerBranchGraph } from "../panels/deriveDebuggerState";

export interface BranchGraphPanelProps {
  graph: DebuggerBranchGraph;
  className?: string;
}

const KIND_LABELS: Record<DebuggerBranchGraph["nodes"][number]["kind"], string> = {
  source_run: "Source Run",
  branch_plan: "Branch Plan",
  branch_run: "Branch Run",
};

const KIND_STYLES: Record<DebuggerBranchGraph["nodes"][number]["kind"], string> = {
  source_run: "border-slate-300 bg-slate-50 text-slate-700",
  branch_plan: "border-amber-300 bg-amber-50 text-amber-800",
  branch_run: "border-emerald-300 bg-emerald-50 text-emerald-800",
};

export function BranchGraphPanel({ graph, className = "" }: BranchGraphPanelProps) {
  if (graph.nodes.length === 0) {
    return (
      <div className={`rounded-2xl border border-dashed border-slate-300 bg-white/70 px-4 py-6 text-sm text-slate-500 ${className}`}>
        No branch lineage has been recorded for this run yet.
      </div>
    );
  }

  return (
    <div className={`rounded-3xl border border-slate-200 bg-white p-4 ${className}`}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
            Branch Graph
          </div>
          <div className="mt-1 text-sm font-medium text-slate-900">
            Root run: <span className="font-mono text-xs">{graph.rootRunId}</span>
          </div>
        </div>
        <div className="text-xs text-slate-500">
          {graph.nodes.length} node(s) · {graph.edges.length} edge(s)
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {graph.nodes.map((node) => {
          const outgoingEdges = graph.edges.filter((edge) => edge.fromNodeId === node.nodeId);
          return (
            <div key={node.nodeId} className={`rounded-2xl border px-4 py-3 ${KIND_STYLES[node.kind]}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.12em] opacity-80">
                    {KIND_LABELS[node.kind]}
                  </div>
                  <div className="mt-1 text-sm font-medium leading-6">
                    {node.label}
                  </div>
                </div>
                <span className="rounded-full bg-white/70 px-2 py-1 text-[11px] font-semibold capitalize">
                  {node.status.replace(/_/g, " ")}
                </span>
              </div>
              <div className="mt-2 flex flex-wrap gap-3 text-[11px] opacity-80">
                {node.runId && <span>run: {node.runId}</span>}
                {node.branchId && <span>branch: {node.branchId}</span>}
                {typeof node.eventCount === "number" && <span>{node.eventCount} event(s)</span>}
                {typeof node.decisionCount === "number" && <span>{node.decisionCount} decision(s)</span>}
              </div>
              {outgoingEdges.length > 0 && (
                <div className="mt-3 space-y-1 text-[11px]">
                  {outgoingEdges.map((edge) => (
                    <div key={edge.edgeId} className="flex items-center gap-2 opacity-80">
                      <span aria-hidden="true">→</span>
                      <span>{edge.label}</span>
                      <span className="font-mono">{edge.toNodeId}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
