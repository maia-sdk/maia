/**
 * CRMSurface — contact/deal/lead cards in Theatre.
 * Record type icons, stage badges with pipeline colors.
 */
import type { SurfaceState } from "./types";

const TYPE_ICONS: Record<string, string> = { deal: "\uD83D\uDCB0", lead: "\u2B50", contact: "\uD83D\uDC64" };
const STAGE_COLORS: Record<string, string> = {
  lead: "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300",
  qualified: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  proposal: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  negotiation: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  won: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  lost: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

export function CRMSurface({ surface }: { surface: SurfaceState }) {
  const records = surface.crmRecords || [];

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
      <div className="flex items-center gap-2 border-b border-gray-100 bg-white px-3 py-2 dark:border-gray-700 dark:bg-gray-800">
        <svg className="h-4 w-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>
        <span className="text-[13px] font-semibold text-gray-700 dark:text-gray-300">{surface.title || "CRM"}</span>
        <span className="ml-auto rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-500 dark:bg-gray-700 dark:text-gray-400">{records.length} records</span>
      </div>

      <div className="flex-1 overflow-y-auto">
        {records.map((r, i) => (
          <div key={i} className="flex items-center gap-3 border-b border-gray-50 px-4 py-3 transition-colors hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800/50">
            <span className="text-[18px]">{TYPE_ICONS[r.type] || "\uD83D\uDC64"}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="truncate text-[13px] font-semibold text-gray-800 dark:text-gray-200">{r.name}</span>
                {r.stage && (
                  <span className={`ml-auto shrink-0 rounded-full px-2 py-0.5 text-[9px] font-semibold ${STAGE_COLORS[r.stage.toLowerCase()] || STAGE_COLORS.lead}`}>
                    {r.stage}
                  </span>
                )}
              </div>
              <div className="mt-0.5 flex items-center gap-3 text-[11px] text-gray-500">
                {r.company && <span>{r.company}</span>}
                {r.value && <span className="font-medium text-green-600">{r.value}</span>}
                {r.email && <span className="truncate text-gray-400">{r.email}</span>}
              </div>
            </div>
          </div>
        ))}
        {records.length === 0 && (
          <div className="flex h-full items-center justify-center text-[12px] text-gray-400">Loading records...</div>
        )}
      </div>

      <div className="flex items-center gap-2 border-t border-gray-100 bg-gray-50 px-3 py-1 dark:border-gray-700 dark:bg-gray-800">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-blue-400" />
        <span className="text-[11px] text-gray-400">{surface.agentName}</span>
      </div>
    </div>
  );
}