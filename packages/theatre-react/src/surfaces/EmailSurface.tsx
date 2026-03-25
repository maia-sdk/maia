/**
 * EmailSurface — email compose view in Theatre.
 * To/Subject fields, body with serif font, blinking cursor.
 */
import type { SurfaceState } from "./types";

export function EmailSurface({ surface }: { surface: SurfaceState }) {
  const email = surface.email || { to: "", subject: "", body: "" };

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
      {/* Header fields */}
      <div className="border-b border-gray-100 dark:border-gray-700">
        <div className="flex items-center border-b border-gray-50 px-4 py-2 dark:border-gray-800">
          <span className="w-16 text-[12px] font-medium text-gray-500">To:</span>
          <span className="flex-1 text-[13px] text-gray-700 dark:text-gray-300">{email.to || surface.title || ""}</span>
        </div>
        <div className="flex items-center px-4 py-2">
          <span className="w-16 text-[12px] font-medium text-gray-500">Subject:</span>
          <span className="flex-1 text-[13px] font-semibold text-gray-800 dark:text-gray-200">{email.subject || ""}</span>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-4">
        {email.body ? (
          <div className="whitespace-pre-wrap font-serif text-[14px] leading-[1.7] text-gray-700 dark:text-gray-300">
            {email.body}
            <span className="inline-block h-[14px] w-[2px] animate-pulse bg-blue-500" />
          </div>
        ) : (
          <div className="text-[14px] text-gray-300">
            <span className="inline-block h-[14px] w-[2px] animate-pulse bg-blue-500" />
          </div>
        )}
      </div>

      {/* Status */}
      <div className="flex items-center gap-2 border-t border-gray-100 bg-gray-50 px-3 py-1 dark:border-gray-700 dark:bg-gray-800">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-blue-400" />
        <span className="text-[11px] text-gray-400">{surface.agentName} is composing</span>
      </div>
    </div>
  );
}