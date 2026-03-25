/**
 * BrowserSurface — live webpage visualization in Theatre.
 * URL bar with traffic lights, screenshot/content, loading skeleton, status bar.
 */
import type { SurfaceState } from "./types";

export function BrowserSurface({ surface }: { surface: SurfaceState }) {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
      {/* URL bar */}
      <div className="flex items-center gap-2 border-b border-gray-100 bg-gray-50 px-3 py-1.5 dark:border-gray-700 dark:bg-gray-800">
        <div className="flex gap-1.5">
          <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
          <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
          <span className="h-3 w-3 rounded-full bg-[#28c840]" />
        </div>
        <div className="flex-1 truncate rounded-full bg-white px-3 py-1 text-[12px] text-gray-500 dark:bg-gray-700 dark:text-gray-400" title={surface.url || ""}>
          {surface.url || "about:blank"}
        </div>
      </div>

      {/* Page content */}
      <div className="relative flex-1 overflow-hidden">
        {surface.screenshot ? (
          <img
            src={surface.screenshot.startsWith("data:") ? surface.screenshot : `data:image/jpeg;base64,${surface.screenshot}`}
            alt={surface.title || "Page"}
            className="h-full w-full object-contain object-top"
          />
        ) : surface.content ? (
          <div className="h-full overflow-auto p-4 text-[13px] leading-[1.6] text-gray-700 dark:text-gray-300" dangerouslySetInnerHTML={{ __html: surface.content }} />
        ) : (
          /* Loading skeleton */
          <div className="space-y-3 p-4">
            <div className="h-6 w-3/4 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
            <div className="h-4 w-full animate-pulse rounded bg-gray-100 dark:bg-gray-800" />
            <div className="h-4 w-5/6 animate-pulse rounded bg-gray-100 dark:bg-gray-800" />
            <div className="h-4 w-2/3 animate-pulse rounded bg-gray-100 dark:bg-gray-800" />
            <div className="mt-4 h-32 w-full animate-pulse rounded bg-gray-100 dark:bg-gray-800" />
            <div className="h-4 w-full animate-pulse rounded bg-gray-100 dark:bg-gray-800" />
            <div className="h-4 w-4/5 animate-pulse rounded bg-gray-100 dark:bg-gray-800" />
          </div>
        )}
      </div>

      {/* Status bar */}
      <div className="flex items-center gap-2 border-t border-gray-100 bg-gray-50 px-3 py-1 dark:border-gray-700 dark:bg-gray-800">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-400" />
        <span className="text-[11px] text-gray-400">{surface.agentName} {surface.status || "is browsing"}</span>
      </div>
    </div>
  );
}