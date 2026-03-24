/**
 * DiffSurface — code diff with red/green lines.
 * Shows when agents work with GitHub PRs, code review.
 */
import React from "react";
import type { SurfaceState } from "./types";

export function DiffSurface({ surface }: { surface: SurfaceState }) {
  const hunks = surface.diffHunks ?? [];

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
      <div className="flex items-center gap-2 border-b border-gray-100 bg-gray-50 px-4 py-2 dark:border-gray-700 dark:bg-gray-800">
        <span className="text-[14px]">{"\uD83D\uDD00"}</span>
        <span className="text-[13px] font-semibold text-gray-700 dark:text-gray-300">{surface.title || "Diff"}</span>
      </div>

      <div className="flex-1 overflow-auto">
        {hunks.length === 0 ? (
          <div className="flex h-full items-center justify-center text-[13px] text-gray-400">Loading diff...</div>
        ) : hunks.map((hunk, hi) => (
          <div key={hi} className="border-b border-gray-100 dark:border-gray-800">
            <div className="bg-gray-50 px-4 py-1 text-[12px] font-mono font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-400">
              {hunk.file}
            </div>
            <div className="font-mono text-[12px]">
              {hunk.deletions.map((line, i) => (
                <div key={`d${i}`} className="bg-red-50 px-4 py-0.5 text-red-700 dark:bg-red-950 dark:text-red-400">
                  <span className="mr-2 text-red-400">-</span>{line}
                </div>
              ))}
              {hunk.additions.map((line, i) => (
                <div key={`a${i}`} className="bg-green-50 px-4 py-0.5 text-green-700 dark:bg-green-950 dark:text-green-400">
                  <span className="mr-2 text-green-400">+</span>{line}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-gray-100 bg-gray-50 px-3 py-1 dark:border-gray-700 dark:bg-gray-800">
        <span className="text-[11px] text-gray-400">{surface.agentName} {surface.status || "is reviewing code"}</span>
      </div>
    </div>
  );
}