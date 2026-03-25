/**
 * APISurface — REST API request/response viewer in Theatre.
 * Method badge, URL, status code, split request/response JSON panels.
 */
import type { SurfaceState } from "./types";

const METHOD_COLORS: Record<string, string> = {
  GET: "bg-green-500", POST: "bg-blue-500", PUT: "bg-yellow-500",
  PATCH: "bg-orange-500", DELETE: "bg-red-500", OPTIONS: "bg-gray-500",
};

function statusColor(status?: number): string {
  if (!status) return "text-gray-400";
  if (status < 300) return "text-green-600";
  if (status < 400) return "text-yellow-600";
  return "text-red-600";
}

function prettyJson(raw?: string): string {
  if (!raw) return "";
  try { return JSON.stringify(JSON.parse(raw), null, 2); } catch { return raw; }
}

export function APISurface({ surface }: { surface: SurfaceState }) {
  const api = surface.apiCall;
  const method = (api?.method || "GET").toUpperCase();

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
      {/* Request line */}
      <div className="flex items-center gap-2 border-b border-gray-100 bg-white px-3 py-2 dark:border-gray-700 dark:bg-gray-800">
        <span className={`rounded px-2 py-0.5 text-[10px] font-bold text-white ${METHOD_COLORS[method] || "bg-gray-500"}`}>{method}</span>
        <span className="flex-1 truncate font-mono text-[12px] text-gray-600 dark:text-gray-400">{api?.url || surface.title || "/api/..."}</span>
        {api?.status != null && (
          <span className={`font-mono text-[12px] font-semibold ${statusColor(api.status)}`}>{api.status}</span>
        )}
        {api?.duration && <span className="text-[10px] text-gray-400">{api.duration}</span>}
      </div>

      {/* Panels */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Request body */}
        {api?.requestBody && (
          <div className="flex-1 overflow-auto border-b border-gray-100 dark:border-gray-700">
            <div className="sticky top-0 bg-gray-50 px-3 py-1 text-[9px] font-semibold uppercase tracking-wider text-gray-400 dark:bg-gray-800">Request</div>
            <pre className="whitespace-pre-wrap p-3 font-mono text-[11px] leading-[1.5] text-gray-600 dark:text-gray-400">{prettyJson(api.requestBody)}</pre>
          </div>
        )}
        {/* Response body */}
        <div className="flex-1 overflow-auto">
          <div className="sticky top-0 bg-gray-50 px-3 py-1 text-[9px] font-semibold uppercase tracking-wider text-gray-400 dark:bg-gray-800">Response</div>
          {api?.responseBody ? (
            <pre className="whitespace-pre-wrap p-3 font-mono text-[11px] leading-[1.5] text-gray-600 dark:text-gray-400">{prettyJson(api.responseBody)}</pre>
          ) : (
            <div className="flex items-center justify-center p-6 text-[12px] text-gray-400">
              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-500" />
              Waiting for response...
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 border-t border-gray-100 bg-gray-50 px-3 py-1 dark:border-gray-700 dark:bg-gray-800">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-blue-400" />
        <span className="text-[11px] text-gray-400">{surface.agentName}</span>
      </div>
    </div>
  );
}