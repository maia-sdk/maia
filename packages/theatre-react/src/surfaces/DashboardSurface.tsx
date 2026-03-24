/**
 * DashboardSurface — charts, KPI cards, metrics.
 * Shows when agents work with Google Analytics, BigQuery, data analysis.
 */
import React from "react";
import type { SurfaceState, DashboardWidget } from "./types";

export function DashboardSurface({ surface }: { surface: SurfaceState }) {
  const widgets = surface.dashboardWidgets ?? [];

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-lg border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-gray-100 bg-white px-4 py-2 dark:border-gray-700 dark:bg-gray-800">
        <span className="text-[14px]">{"\uD83D\uDCCA"}</span>
        <span className="text-[13px] font-semibold text-gray-700 dark:text-gray-300">
          {surface.title || "Dashboard"}
        </span>
      </div>

      {/* Widgets grid */}
      <div className="flex-1 overflow-auto p-4">
        {widgets.length === 0 ? (
          <div className="flex h-full items-center justify-center text-[13px] text-gray-400">
            Loading dashboard...
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {widgets.map((w, i) => <WidgetCard key={i} widget={w} />)}
          </div>
        )}
      </div>

      {/* Status */}
      <div className="border-t border-gray-100 bg-white px-3 py-1 dark:border-gray-700 dark:bg-gray-800">
        <span className="text-[11px] text-gray-400">{surface.agentName} {surface.status || "is analyzing"}</span>
      </div>
    </div>
  );
}

function WidgetCard({ widget }: { widget: DashboardWidget }) {
  if (widget.type === "kpi") {
    const arrow = widget.direction === "up" ? "\u2191" : widget.direction === "down" ? "\u2193" : "";
    const color = widget.direction === "up" ? "text-green-600" : widget.direction === "down" ? "text-red-600" : "text-gray-500";
    return (
      <div className="rounded-lg bg-white p-4 shadow-sm dark:bg-gray-800">
        <div className="text-[11px] text-gray-500">{widget.title}</div>
        <div className="mt-1 text-[22px] font-bold text-gray-900 dark:text-gray-100">{widget.value}</div>
        {widget.change && <div className={`mt-0.5 text-[12px] ${color}`}>{arrow} {widget.change}</div>}
      </div>
    );
  }

  if (widget.type === "bar" || widget.type === "line") {
    const data = widget.data ?? [];
    const max = Math.max(...data, 1);
    return (
      <div className="rounded-lg bg-white p-4 shadow-sm dark:bg-gray-800">
        <div className="text-[11px] text-gray-500">{widget.title}</div>
        <div className="mt-2 flex items-end gap-1" style={{ height: 60 }}>
          {data.map((v, i) => (
            <div key={i} className="flex-1 rounded-t bg-blue-500 transition-all" style={{ height: `${(v / max) * 100}%` }} />
          ))}
        </div>
        {widget.labels && (
          <div className="mt-1 flex justify-between text-[9px] text-gray-400">
            {widget.labels.map((l, i) => <span key={i}>{l}</span>)}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-lg bg-white p-4 shadow-sm dark:bg-gray-800">
      <div className="text-[11px] text-gray-500">{widget.title}</div>
      <div className="mt-1 text-[14px] text-gray-700 dark:text-gray-300">{widget.value ?? "—"}</div>
    </div>
  );
}