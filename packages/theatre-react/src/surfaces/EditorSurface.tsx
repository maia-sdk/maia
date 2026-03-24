/**
 * EditorSurface — shows text/code being written in Theatre.
 * Displays file name, live text appearing, and a blinking cursor.
 */
import React from "react";
import type { SurfaceState } from "./types";

export function EditorSurface({ surface }: { surface: SurfaceState }) {
  const isCode = surface.language || surface.title?.match(/\.(ts|js|py|go|rs|java|c|cpp|rb|sh)$/);

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
      {/* Tab bar */}
      <div className="flex items-center gap-1 border-b border-gray-100 bg-gray-50 px-2 py-1 dark:border-gray-700 dark:bg-gray-800">
        <div className="rounded-t-md bg-white px-3 py-1 text-[12px] font-medium text-gray-700 dark:bg-gray-900 dark:text-gray-300">
          {surface.title || "untitled"}
        </div>
      </div>

      {/* Editor content */}
      <div className={`flex-1 overflow-auto p-4 ${isCode ? "bg-gray-950 font-mono text-[13px] text-green-400" : "bg-white text-[14px] text-gray-800 dark:bg-gray-950 dark:text-gray-200"}`}>
        {surface.text ? (
          <>
            <pre className="whitespace-pre-wrap">{surface.text}</pre>
            <span className="inline-block h-4 w-0.5 animate-pulse bg-current" />
          </>
        ) : (
          <div className="flex h-full items-center justify-center text-gray-500">
            <span className="inline-block h-4 w-0.5 animate-pulse bg-gray-400" />
          </div>
        )}
      </div>

      {/* Status bar */}
      <div className="flex items-center justify-between border-t border-gray-100 bg-gray-50 px-3 py-1 dark:border-gray-700 dark:bg-gray-800">
        <span className="text-[11px] text-gray-400">
          \u270F\uFE0F {surface.agentName} {surface.status || "is writing"}
        </span>
        {surface.language && (
          <span className="text-[10px] text-gray-400">{surface.language}</span>
        )}
      </div>
    </div>
  );
}