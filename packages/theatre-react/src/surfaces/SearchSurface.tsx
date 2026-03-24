/**
 * SearchSurface — shows search results appearing in Theatre.
 * Displays search query, results list updating live.
 */
import React from "react";
import type { SurfaceState } from "./types";

export function SearchSurface({ surface }: { surface: SurfaceState }) {
  const results = surface.results ?? [];

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
      {/* Search bar */}
      <div className="border-b border-gray-100 bg-gray-50 px-4 py-3 dark:border-gray-700 dark:bg-gray-800">
        <div className="flex items-center gap-2 rounded-full bg-white px-4 py-2 shadow-sm dark:bg-gray-700">
          <span className="text-[14px]">\uD83D\uDD0D</span>
          <span className="text-[14px] text-gray-700 dark:text-gray-300">
            {surface.title || "Searching..."}
          </span>
        </div>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-auto px-4 py-3">
        {results.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <div className="flex items-center gap-2 text-[13px] text-gray-400">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-500" />
              Searching...
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {results.map((result, i) => (
              <div key={i} className="group">
                <div className="text-[12px] text-green-700 dark:text-green-400">
                  {result.url}
                </div>
                <div className="text-[15px] font-medium text-blue-700 group-hover:underline dark:text-blue-400">
                  {result.title}
                </div>
                <div className="mt-0.5 text-[13px] text-gray-600 dark:text-gray-400">
                  {result.snippet}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Status */}
      <div className="flex items-center gap-2 border-t border-gray-100 bg-gray-50 px-3 py-1 dark:border-gray-700 dark:bg-gray-800">
        <span className="text-[11px] text-gray-400">
          {results.length > 0 ? `${results.length} results` : "Searching"} — {surface.agentName}
        </span>
      </div>
    </div>
  );
}