/**
 * KanbanSurface — board with columns and cards in Theatre.
 * Horizontal scroll, priority dots, assignee chips.
 */
import type { SurfaceState } from "./types";

const PRIORITY_COLORS: Record<string, string> = {
  critical: "bg-red-500", high: "bg-orange-400", medium: "bg-yellow-400", low: "bg-gray-300",
};

export function KanbanSurface({ surface }: { surface: SurfaceState }) {
  const columns = surface.kanbanColumns || [];

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-lg border border-gray-200 bg-gray-100 dark:border-gray-700 dark:bg-gray-900">
      <div className="flex items-center gap-2 border-b border-gray-200 bg-white px-3 py-2 dark:border-gray-700 dark:bg-gray-800">
        <svg className="h-4 w-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="5" height="18" rx="1"/><rect x="10" y="3" width="5" height="12" rx="1"/><rect x="17" y="3" width="5" height="15" rx="1"/></svg>
        <span className="text-[13px] font-semibold text-gray-700 dark:text-gray-300">{surface.title || "Board"}</span>
        <span className="ml-auto text-[10px] text-gray-400">{surface.agentName}</span>
      </div>

      <div className="flex flex-1 gap-3 overflow-x-auto p-3">
        {columns.map((col, ci) => (
          <div key={ci} className="flex w-[220px] min-w-[220px] flex-col rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
            <div className="flex items-center gap-2 border-b border-gray-100 px-3 py-2 dark:border-gray-700">
              <span className="text-[12px] font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300">{col.title}</span>
              <span className="min-w-[20px] rounded-full bg-gray-100 px-1.5 text-center text-[10px] font-semibold text-gray-500 dark:bg-gray-700 dark:text-gray-400">{col.cards.length}</span>
            </div>
            <div className="flex-1 space-y-2 overflow-y-auto p-2">
              {col.cards.map((card) => (
                <div key={card.id} className="rounded-lg border border-gray-100 bg-white p-2.5 shadow-sm dark:border-gray-700 dark:bg-gray-900">
                  <div className="flex items-start gap-1.5">
                    <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${PRIORITY_COLORS[card.priority || "low"]}`} />
                    <span className="text-[12px] font-medium text-gray-700 dark:text-gray-300">{card.title}</span>
                  </div>
                  <div className="mt-1.5 flex flex-wrap items-center gap-1">
                    {card.assignee && <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[9px] text-gray-500 dark:bg-gray-700 dark:text-gray-400">{card.assignee}</span>}
                    {card.labels?.map((l, li) => <span key={li} className="rounded-full bg-purple-50 px-2 py-0.5 text-[9px] text-purple-600 dark:bg-purple-900/30 dark:text-purple-400">{l}</span>)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
        {columns.length === 0 && (
          <div className="flex flex-1 items-center justify-center text-[12px] text-gray-400">Loading board...</div>
        )}
      </div>
    </div>
  );
}