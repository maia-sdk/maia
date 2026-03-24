/**
 * CRMSurface — contact/deal cards with pipeline view.
 * Shows when agents work with Salesforce, HubSpot.
 */
import React from "react";
import type { SurfaceState, CRMRecord } from "./types";

const STAGE_COLORS: Record<string, string> = {
  lead: "bg-gray-100 text-gray-700",
  qualified: "bg-blue-100 text-blue-700",
  proposal: "bg-yellow-100 text-yellow-700",
  negotiation: "bg-orange-100 text-orange-700",
  won: "bg-green-100 text-green-700",
  lost: "bg-red-100 text-red-700",
};

export function CRMSurface({ surface }: { surface: SurfaceState }) {
  const records = surface.crmRecords ?? [];

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-lg border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900">
      <div className="flex items-center gap-2 border-b border-gray-100 bg-white px-4 py-2 dark:border-gray-700 dark:bg-gray-800">
        <span className="text-[14px]">{"\uD83D\uDCBC"}</span>
        <span className="text-[13px] font-semibold text-gray-700 dark:text-gray-300">{surface.title || "CRM"}</span>
        <span className="text-[11px] text-gray-400">{records.length} records</span>
      </div>

      <div className="flex-1 overflow-auto p-3">
        {records.length === 0 ? (
          <div className="flex h-full items-center justify-center text-[13px] text-gray-400">Loading records...</div>
        ) : (
          <div className="space-y-2">
            {records.map((r, i) => <RecordCard key={i} record={r} />)}
          </div>
        )}
      </div>

      <div className="border-t border-gray-100 bg-white px-3 py-1 dark:border-gray-700 dark:bg-gray-800">
        <span className="text-[11px] text-gray-400">{surface.agentName} {surface.status || "is managing CRM"}</span>
      </div>
    </div>
  );
}

function RecordCard({ record }: { record: CRMRecord }) {
  const icon = record.type === "deal" ? "\uD83D\uDCB0" : record.type === "lead" ? "\u2B50" : "\uD83D\uDC64";
  const stageClass = STAGE_COLORS[record.stage?.toLowerCase() ?? ""] ?? "bg-gray-100 text-gray-600";

  return (
    <div className="rounded-lg bg-white p-3 shadow-sm dark:bg-gray-800">
      <div className="flex items-center gap-2">
        <span className="text-[14px]">{icon}</span>
        <span className="text-[13px] font-semibold text-gray-800 dark:text-gray-200">{record.name}</span>
        {record.stage && (
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${stageClass}`}>{record.stage}</span>
        )}
      </div>
      <div className="mt-1 flex items-center gap-3 text-[11px] text-gray-500">
        {record.company && <span>{record.company}</span>}
        {record.value && <span className="font-medium text-green-600">{record.value}</span>}
        {record.email && <span>{record.email}</span>}
      </div>
    </div>
  );
}