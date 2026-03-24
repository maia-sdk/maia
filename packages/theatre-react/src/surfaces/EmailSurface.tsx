/**
 * EmailSurface — shows an email being composed in Theatre.
 */
import React from "react";
import type { SurfaceState } from "./types";

export function EmailSurface({ surface }: { surface: SurfaceState }) {
  const email = surface.email ?? { to: "", subject: "", body: "" };

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
      {/* Email header */}
      <div className="space-y-1 border-b border-gray-100 bg-gray-50 px-4 py-3 dark:border-gray-700 dark:bg-gray-800">
        <div className="flex items-center gap-2 text-[13px]">
          <span className="w-16 text-right text-gray-400">To:</span>
          <span className="text-gray-700 dark:text-gray-300">{email.to || "..."}</span>
        </div>
        <div className="flex items-center gap-2 text-[13px]">
          <span className="w-16 text-right text-gray-400">Subject:</span>
          <span className="font-medium text-gray-800 dark:text-gray-200">{email.subject || "..."}</span>
        </div>
      </div>

      {/* Email body */}
      <div className="flex-1 overflow-auto p-4 text-[14px] leading-relaxed text-gray-700 dark:text-gray-300">
        {email.body ? (
          <>
            <div className="whitespace-pre-wrap">{email.body}</div>
            <span className="inline-block h-4 w-0.5 animate-pulse bg-gray-400" />
          </>
        ) : (
          <div className="text-gray-400">Composing...</div>
        )}
      </div>

      {/* Status */}
      <div className="flex items-center gap-2 border-t border-gray-100 bg-gray-50 px-3 py-1 dark:border-gray-700 dark:bg-gray-800">
        <span className="text-[11px] text-gray-400">
          \u2709\uFE0F {surface.agentName} {surface.status || "is drafting"}
        </span>
      </div>
    </div>
  );
}