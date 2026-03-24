/**
 * APISurface — request/response JSON viewer.
 * Shows when agents call REST APIs, webhooks.
 */
import React from "react";
import type { SurfaceState } from "./types";

const METHOD_COLORS: Record<string, string> = {
  GET: "bg-green-100 text-green-700",
  POST: "bg-blue-100 text-blue-700",
  PUT: "bg-yellow-100 text-yellow-700",
  PATCH: "bg-orange-100 text-orange-700",
  DELETE: "bg-red-100 text-red-700",
};

export function APISurface({ surface }: { surface: SurfaceState }) {
  const api = surface.apiCall ?? { method: "GET", url: "" };
  const statusColor = !api.status ? "text-gray-400"
    : api.status < 300 ? "text-green-600"
    : api.status < 400 ? "text-yellow-600"
    : "text-red-600";

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
      {/* Request line */}
      <div className="flex items-center gap-2 border-b border-gray-100 bg-gray-50 px-4 py-2 dark:border-gray-700 dark:bg-gray-800">
        <span className={`rounded px-2 py-0.5 text-[11px] font-bold ${METHOD_COLORS[api.method] ?? "bg-gray-100 text-gray-700"}`}>
          {api.method}
        </span>
        <span className="truncate font-mono text-[12px] text-gray-600 dark:text-gray-400">{api.url}</span>
        {api.status && (
          <span className={`ml-auto font-mono text-[12px] font-bold ${statusColor}`}>{api.status}</span>
        )}
        {api.duration && (
          <span className="text-[11px] text-gray-400">{api.duration}</span>
        )}
      </div>

      {/* Body panels */}
      <div className="flex flex-1 overflow-hidden">
        {/* Request */}
        {api.requestBody && (
          <div className="flex-1 border-r border-gray-100 dark:border-gray-700">
            <div className="bg-gray-50 px-3 py-1 text-[10px] font-semibold text-gray-500 dark:bg-gray-800">REQUEST</div>
            <pre className="overflow-auto p-3 font-mono text-[11px] text-gray-700 dark:text-gray-300">
              {formatJson(api.requestBody)}
            </pre>
          </div>
        )}

        {/* Response */}
        <div className="flex-1">
          <div className="bg-gray-50 px-3 py-1 text-[10px] font-semibold text-gray-500 dark:bg-gray-800">RESPONSE</div>
          <pre className="overflow-auto p-3 font-mono text-[11px] text-gray-700 dark:text-gray-300">
            {api.responseBody ? formatJson(api.responseBody) : (
              <span className="text-gray-400">Waiting for response...</span>
            )}
          </pre>
        </div>
      </div>

      <div className="border-t border-gray-100 bg-gray-50 px-3 py-1 dark:border-gray-700 dark:bg-gray-800">
        <span className="text-[11px] text-gray-400">{surface.agentName} {surface.status || "is calling API"}</span>
      </div>
    </div>
  );
}

function formatJson(str: string): string {
  try { return JSON.stringify(JSON.parse(str), null, 2); }
  catch { return str; }
}