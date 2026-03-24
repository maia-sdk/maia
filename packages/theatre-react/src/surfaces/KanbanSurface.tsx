/**
 * KanbanSurface — board with columns and cards.
 * Shows when agents work with Jira, Linear, Asana, Trello, Monday.
 */
import React from "react";
import type { SurfaceState, KanbanCard } from "./types";

const PRIORITY_DOT: Record<string, string> = {
  critical: "bg-red-500",
  high: "bg-orange-400",
  medium: "bg-yellow-400",
  low: "bg-gray-300",
};

export function KanbanSurface({ surface }: { surface: SurfaceState }) {
  const columns = surface.kanbanColumns ?? [];

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-lg border border-gray-200 bg-gray-100 dark:border-gray-700 dark:bg-gray-900">
      {/* Board header */}
      <div className="flex items-center gap-2 border-b border-gray-200 bg-white px-4 py-2 dark:border-gray-700 dark:bg-gray-800">
        <span className="text-[14px]">{"\uD83D\uDCCB"}</span>
        <span className="text-[13px] font-semibold text-gray-700 dark:text-gray-300">
          {surface.title || "Board"}
        </span>
      </div>

      {/* Columns */}
      <div className="flex flex-1 gap-3 overflow-x-auto p-3">
        {columns.length === 0 ? (
          <div className="flex flex-1 items-center justify-center text-[13px] text-gray-400">
            Loading board...
          </div>
        ) : columns.map((col, ci) => (
          <div key={ci} className="flex w-56 flex-shrink-0 flex-col rounded-lg bg-gray-200/60 dark:bg-gray-800">
            {/* Column header */}
            <div className="flex items-center justify-between px-3 py-2">
              <span className="text-[12px] font-semibold text-gray-600 dark:text-gray-400">
                {col.title}
              </span>
              <span className="rounded-full bg-gray-300 px-1.5 text-[10px] text-gray-500 dark:bg-gray-700">
                {col.cards.length}
              </span>
            </div>

            {/* Cards */}
            <div className="flex-1 space-y-2 overflow-auto px-2 pb-2">
              {col.cards.map((card) => <CardItem key={card.id} card={card} />)}
            </div>
          </div>
        ))}
      </div>

      {/* Status */}
      <div className="border-t border-gray-200 bg-white px-3 py-1 dark:border-gray-700 dark:bg-gray-800">
        <span className="text-[11px] text-gray-400">{surface.agentName} {surface.status || "is managing tasks"}</span>
      </div>
    </div>
  );
}

function CardItem({ card }: { card: KanbanCard }) {
  return (
    <div className="rounded-lg bg-white p-2.5 shadow-sm dark:bg-gray-700">
      <div className="flex items-start gap-1.5">
        {card.priority && (
          <span className={`mt-1 h-2 w-2 flex-shrink-0 rounded-full ${PRIORITY_DOT[card.priority] ?? "bg-gray-300"}`} />
        )}
        <span className="text-[12px] font-medium text-gray-800 dark:text-gray-200">
          {card.title}
        </span>
      </div>
      {(card.assignee || card.labels?.length) && (
        <div className="mt-1.5 flex items-center gap-1">
          {card.assignee && (
            <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-500 dark:bg-gray-600">
              {card.assignee}
            </span>
          )}
          {card.labels?.map((l, i) => (
            <span key={i} className="rounded bg-blue-100 px-1.5 py-0.5 text-[10px] text-blue-600 dark:bg-blue-900 dark:text-blue-300">
              {l}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}