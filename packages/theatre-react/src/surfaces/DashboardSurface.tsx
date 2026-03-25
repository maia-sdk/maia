/**
 * DashboardSurface — KPI cards and metrics in Theatre.
 * 2-column grid, large values, change arrows, bar visualizations.
 */
import type { SurfaceState } from "./types";

export function DashboardSurface({ surface }: { surface: SurfaceState }) {
  const widgets = surface.dashboardWidgets || [];

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-lg border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900">
      <div className="flex items-center gap-2 border-b border-gray-100 bg-white px-3 py-2 dark:border-gray-700 dark:bg-gray-800">
        <svg className="h-4 w-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
        <span className="text-[13px] font-semibold text-gray-700 dark:text-gray-300">{surface.title || "Dashboard"}</span>
        <span className="ml-auto text-[10px] text-gray-400">{surface.agentName}</span>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        <div className="grid grid-cols-2 gap-3">
          {widgets.map((w, i) => (
            <div key={i} className="rounded-xl border border-gray-100 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">{w.title}</p>
              {w.type === "kpi" || !w.type ? (
                <>
                  <p className="mt-1 text-[24px] font-bold text-gray-800 dark:text-gray-100">{w.value || "—"}</p>
                  {w.change && (
                    <p className={`mt-1 text-[11px] font-medium ${w.direction === "up" ? "text-green-600" : w.direction === "down" ? "text-red-500" : "text-gray-400"}`}>
                      {w.direction === "up" ? "\u2191" : w.direction === "down" ? "\u2193" : "\u2192"} {w.change}
                    </p>
                  )}
                </>
              ) : (w.type === "bar" || w.type === "line") && w.data ? (
                <div className="mt-2 flex items-end gap-1" style={{ height: 48 }}>
                  {w.data.map((v, j) => {
                    const max = Math.max(...(w.data || [1]));
                    const h = max > 0 ? (v / max) * 100 : 0;
                    return <div key={j} className="flex-1 rounded-t bg-purple-500 transition-all" style={{ height: `${h}%`, minHeight: 2 }} />;
                  })}
                </div>
              ) : (
                <p className="mt-1 text-[18px] font-bold text-gray-800 dark:text-gray-100">{w.value || "—"}</p>
              )}
            </div>
          ))}
        </div>
        {widgets.length === 0 && (
          <div className="flex h-full items-center justify-center text-[12px] text-gray-400">Loading metrics...</div>
        )}
      </div>
    </div>
  );
}