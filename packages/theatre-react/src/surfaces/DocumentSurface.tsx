/**
 * DocumentSurface — shows a document being read in Theatre.
 * Displays file name, content with highlights, and reading indicator.
 */
import React from "react";
import type { SurfaceState } from "./types";

export function DocumentSurface({ surface }: { surface: SurfaceState }) {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
      {/* File header */}
      <div className="flex items-center gap-2 border-b border-gray-100 bg-gray-50 px-3 py-2 dark:border-gray-700 dark:bg-gray-800">
        <span className="text-[14px]">{surface.url?.endsWith(".pdf") ? "\uD83D\uDCC4" : "\uD83D\uDCC3"}</span>
        <span className="text-[13px] font-medium text-gray-700 dark:text-gray-300">
          {surface.title || surface.url || "Document"}
        </span>
      </div>

      {/* Document content */}
      <div className="flex-1 overflow-auto bg-white p-6 font-serif text-[14px] leading-relaxed text-gray-800 dark:bg-gray-950 dark:text-gray-200">
        {surface.content ? (
          <div dangerouslySetInnerHTML={{ __html: surface.content }} />
        ) : surface.text ? (
          <pre className="whitespace-pre-wrap font-serif">{surface.text}</pre>
        ) : (
          <div className="flex h-full items-center justify-center text-gray-400">
            Opening document...
          </div>
        )}
      </div>

      {/* Status */}
      <div className="flex items-center gap-2 border-t border-gray-100 bg-gray-50 px-3 py-1 dark:border-gray-700 dark:bg-gray-800">
        <span className="text-[11px] text-gray-400">
          \uD83D\uDCD6 {surface.agentName} {surface.status || "is reading"}
        </span>
      </div>
    </div>
  );
}