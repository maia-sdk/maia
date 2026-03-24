/**
 * DatabaseSurface — SQL query + table results.
 * Shows when agents query PostgreSQL, Supabase, BigQuery.
 */
import React from "react";
import type { SurfaceState } from "./types";

export function DatabaseSurface({ surface }: { surface: SurfaceState }) {
  const table = surface.tableData ?? { headers: [], rows: [], query: "" };

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
      {/* Query bar */}
      {table.query && (
        <div className="border-b border-gray-100 bg-gray-950 px-4 py-2 dark:border-gray-700">
          <pre className="font-mono text-[12px] text-cyan-400">{table.query}</pre>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-2 border-b border-gray-100 bg-gray-50 px-4 py-1.5 dark:border-gray-700 dark:bg-gray-800">
        <span className="text-[13px]">{"\uD83D\uDDC4"}</span>
        <span className="text-[12px] font-medium text-gray-600 dark:text-gray-400">
          {surface.title || "Query Results"}
        </span>
        {table.rows.length > 0 && (
          <span className="text-[11px] text-gray-400">{table.rows.length} rows</span>
        )}
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        {table.headers.length === 0 ? (
          <div className="flex h-full items-center justify-center text-[13px] text-gray-400">
            Executing query...
          </div>
        ) : (
          <table className="w-full text-[12px]">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
                {table.headers.map((h, i) => (
                  <th key={i} className="px-3 py-1.5 text-left font-semibold text-gray-600 dark:text-gray-400">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {table.rows.map((row, ri) => (
                <tr key={ri} className="border-b border-gray-50 hover:bg-blue-50 dark:border-gray-800 dark:hover:bg-gray-800">
                  {row.map((cell, ci) => (
                    <td key={ci} className="px-3 py-1.5 text-gray-700 dark:text-gray-300">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Status */}
      <div className="border-t border-gray-100 bg-gray-50 px-3 py-1 dark:border-gray-700 dark:bg-gray-800">
        <span className="text-[11px] text-gray-400">{surface.agentName} {surface.status || "is querying"}</span>
      </div>
    </div>
  );
}