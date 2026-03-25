/**
 * DocumentSurface — document viewer in Theatre.
 * PDF/doc icon, serif font, reading indicator.
 */
import type { SurfaceState } from "./types";

export function DocumentSurface({ surface }: { surface: SurfaceState }) {
  const isPdf = (surface.url || surface.title || "").toLowerCase().endsWith(".pdf");
  const icon = isPdf ? "\uD83D\uDCC4" : "\uD83D\uDCC3";

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
      <div className="flex items-center gap-2 border-b border-gray-100 bg-gray-50 px-3 py-2 dark:border-gray-700 dark:bg-gray-800">
        <span className="text-[16px]">{icon}</span>
        <span className="flex-1 truncate text-[13px] font-semibold text-gray-700 dark:text-gray-300">{surface.title || "Document"}</span>
        {surface.url && <span className="truncate text-[10px] text-gray-400">{surface.url}</span>}
      </div>
      <div className="flex-1 overflow-y-auto p-6">
        {surface.content ? (
          <div className="prose prose-sm max-w-none font-serif text-[14px] leading-[1.7] text-gray-700 dark:text-gray-300" dangerouslySetInnerHTML={{ __html: surface.content }} />
        ) : surface.text ? (
          <div className="whitespace-pre-wrap font-serif text-[14px] leading-[1.7] text-gray-700 dark:text-gray-300">{surface.text}</div>
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-gray-400">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-purple-500" />
            <span className="text-[12px]">Loading document...</span>
          </div>
        )}
      </div>
      <div className="flex items-center gap-2 border-t border-gray-100 bg-gray-50 px-3 py-1 dark:border-gray-700 dark:bg-gray-800">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-400" />
        <span className="text-[11px] text-gray-400">{surface.agentName} is reading</span>
      </div>
    </div>
  );
}