/**
 * SearchSurface — Google-like search results in Theatre.
 * Search bar with icon, result cards with URL/title/snippet.
 */
import type { SurfaceState } from "./types";

export function SearchSurface({ surface }: { surface: SurfaceState }) {
  const results = surface.results || [];
  const query = surface.title || "";

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
      {/* Search bar */}
      <div className="border-b border-gray-100 px-4 py-3 dark:border-gray-700">
        <div className="flex items-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-2.5 dark:border-gray-600 dark:bg-gray-800">
          <svg className="h-4 w-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <span className="flex-1 text-[14px] text-gray-700 dark:text-gray-300">{query || "Search..."}</span>
        </div>
        {results.length > 0 && (
          <p className="mt-2 text-[11px] text-gray-400">About {results.length} results</p>
        )}
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto px-4 py-2">
        {results.length > 0 ? results.map((r, i) => (
          <div key={i} className="border-b border-gray-50 py-3 dark:border-gray-800">
            <p className="text-[12px] text-teal-700 dark:text-teal-400">{r.url}</p>
            <p className="mt-0.5 text-[15px] font-medium text-blue-800 dark:text-blue-400">{r.title}</p>
            <p className="mt-1 line-clamp-2 text-[12px] leading-[1.5] text-gray-500 dark:text-gray-400">{r.snippet}</p>
          </div>
        )) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-gray-400">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-blue-500" />
            <span className="text-[12px]">Searching...</span>
          </div>
        )}
      </div>
    </div>
  );
}