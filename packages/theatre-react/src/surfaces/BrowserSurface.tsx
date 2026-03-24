/**
 * BrowserSurface — shows a live webpage in Theatre.
 * Displays URL bar, page screenshot/content, and agent activity indicator.
 */
import React from "react";
import type { SurfaceState } from "./types";

export function BrowserSurface({ surface }: { surface: SurfaceState }) {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
      {/* URL bar */}
      <div className="flex items-center gap-2 border-b border-gray-100 bg-gray-50 px-3 py-1.5 dark:border-gray-700 dark:bg-gray-800">
        <div className="flex gap-1">
          <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-green-400" />
        </div>
        <div className="flex-1 rounded-md bg-white px-3 py-1 text-[12px] text-gray-500 dark:bg-gray-700 dark:text-gray-400">
          {surface.url || "about:blank"}
        </div>
      </div>

      {/* Page content */}
      <div className="flex-1 overflow-hidden">
        {surface.screenshot ? (
          <img
            src={surface.screenshot.startsWith("data:") ? surface.screenshot : `data:image/jpeg;base64,${surface.screenshot}`}
            alt={surface.title}
            className="h-full w-full object-cover object-top"
          />
        ) : surface.content ? (
          <div className="h-full overflow-auto p-4 text-[13px] text-gray-700 dark:text-gray-300"
            dangerouslySetInnerHTML={{ __html: surface.content }}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-[13px] text-gray-400">
            Loading page...
          </div>
        )}
      </div>

      {/* Status bar */}
      <div className="flex items-center gap-2 border-t border-gray-100 bg-gray-50 px-3 py-1 dark:border-gray-700 dark:bg-gray-800">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-400" />
        <span className="text-[11px] text-gray-400">
          {surface.agentName} {surface.status || "is browsing"}
        </span>
      </div>
    </div>
  );
}