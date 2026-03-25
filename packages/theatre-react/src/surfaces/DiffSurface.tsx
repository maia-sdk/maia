/**
 * DiffSurface — code diff with red/green lines in Theatre.
 * File headers, line numbers, addition/deletion coloring.
 */
import type { SurfaceState } from "./types";

export function DiffSurface({ surface }: { surface: SurfaceState }) {
  const hunks = surface.diffHunks || [];

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
      <div className="flex items-center gap-2 border-b border-gray-100 bg-white px-3 py-2 dark:border-gray-700 dark:bg-gray-800">
        <svg className="h-4 w-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 3v18M3 12h18"/></svg>
        <span className="text-[13px] font-semibold text-gray-700 dark:text-gray-300">{surface.title || "Diff"}</span>
        {hunks.length > 0 && (
          <span className="ml-auto text-[10px] text-gray-400">
            <span className="text-green-600">+{hunks.reduce((a, h) => a + h.additions.length, 0)}</span>
            {" / "}
            <span className="text-red-500">-{hunks.reduce((a, h) => a + h.deletions.length, 0)}</span>
          </span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto bg-white font-mono text-[12px] dark:bg-gray-950">
        {hunks.map((hunk, hi) => (
          <div key={hi}>
            {/* File header */}
            <div className="sticky top-0 z-10 border-b border-gray-200 bg-gray-100 px-3 py-1.5 text-[11px] font-semibold text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
              {hunk.file}
            </div>
            {/* Deletions */}
            {hunk.deletions.map((line, i) => (
              <div key={`d${i}`} className="flex border-b border-red-100/50 bg-red-50 dark:border-red-900/20 dark:bg-red-950/20">
                <span className="w-10 shrink-0 select-none border-r border-red-100 py-0.5 pr-2 text-right text-[10px] text-red-300 dark:border-red-900/30 dark:text-red-800">{i + 1}</span>
                <span className="px-2 py-0.5 text-red-700 dark:text-red-400">- {line}</span>
              </div>
            ))}
            {/* Separator */}
            {hunk.deletions.length > 0 && hunk.additions.length > 0 && (
              <div className="border-b border-gray-100 bg-gray-50 px-3 py-0.5 text-[9px] text-gray-300 dark:border-gray-800 dark:bg-gray-900">...</div>
            )}
            {/* Additions */}
            {hunk.additions.map((line, i) => (
              <div key={`a${i}`} className="flex border-b border-green-100/50 bg-green-50 dark:border-green-900/20 dark:bg-green-950/20">
                <span className="w-10 shrink-0 select-none border-r border-green-100 py-0.5 pr-2 text-right text-[10px] text-green-300 dark:border-green-900/30 dark:text-green-800">{i + 1}</span>
                <span className="px-2 py-0.5 text-green-700 dark:text-green-400">+ {line}</span>
              </div>
            ))}
          </div>
        ))}
        {hunks.length === 0 && (
          <div className="flex h-full items-center justify-center text-[12px] text-gray-400">No changes to display</div>
        )}
      </div>
    </div>
  );
}