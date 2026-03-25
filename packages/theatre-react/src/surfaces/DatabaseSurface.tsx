/**
 * DatabaseSurface — SQL query + data table in Theatre.
 * Dark query bar, sticky headers, hover highlight, row count.
 */
import type { SurfaceState } from "./types";

export function DatabaseSurface({ surface }: { surface: SurfaceState }) {
  const table = surface.tableData;
  const query = table?.query || surface.title || "";
  const headers = table?.headers || [];
  const rows = table?.rows || [];

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
      {/* Query bar */}
      <div className="border-b border-[#313244] bg-[#1e1e2e] px-4 py-2.5">
        <pre className="whitespace-pre-wrap font-mono text-[12px] leading-[1.5] text-cyan-300">{query || "SELECT * FROM ..."}</pre>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto bg-white dark:bg-gray-900">
        {headers.length > 0 ? (
          <table className="w-full border-collapse text-[12px]">
            <thead>
              <tr>
                {headers.map((h, i) => (
                  <th key={i} className="sticky top-0 z-10 border-b-2 border-gray-200 bg-gray-50 px-3 py-2 text-left font-semibold text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i} className={`transition-colors hover:bg-blue-50 dark:hover:bg-blue-950/20 ${i % 2 === 1 ? "bg-gray-50/50 dark:bg-gray-800/30" : ""}`}>
                  {row.map((cell, j) => (
                    <td key={j} className="border-b border-gray-100 px-3 py-2 text-gray-600 dark:border-gray-800 dark:text-gray-400">{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-gray-400">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-cyan-500" />
            <span className="text-[12px]">Executing query...</span>
          </div>
        )}
      </div>

      {/* Status */}
      <div className="flex items-center gap-2 border-t border-gray-100 bg-gray-50 px-3 py-1 dark:border-gray-700 dark:bg-gray-800">
        <svg className="h-3.5 w-3.5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>
        <span className="text-[11px] text-gray-400">{rows.length} rows — {surface.agentName}</span>
      </div>
    </div>
  );
}