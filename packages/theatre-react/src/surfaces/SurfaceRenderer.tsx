/**
 * SurfaceRenderer — picks the right visual surface based on agent activity.
 * 15 surfaces covering browser, docs, code, data, CRM, PM, and more.
 */
import React from "react";
import type { SurfaceState, SurfaceType } from "./types";
import { BrowserSurface } from "./BrowserSurface";
import { DocumentSurface } from "./DocumentSurface";
import { EditorSurface } from "./EditorSurface";
import { SearchSurface } from "./SearchSurface";
import { EmailSurface } from "./EmailSurface";
import { TerminalSurface } from "./TerminalSurface";
import { ChatSurface } from "./ChatSurface";
import { DashboardSurface } from "./DashboardSurface";
import { KanbanSurface } from "./KanbanSurface";
import { DatabaseSurface } from "./DatabaseSurface";
import { CRMSurface } from "./CRMSurface";
import { DiffSurface } from "./DiffSurface";
import { APISurface } from "./APISurface";
import { CalendarSurface } from "./CalendarSurface";

export interface SurfaceRendererProps {
  surface: SurfaceState | null;
  className?: string;
}

export function SurfaceRenderer({ surface, className = "" }: SurfaceRendererProps) {
  if (!surface || surface.type === "idle") {
    return (
      <div className={`flex items-center justify-center rounded-lg border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900 ${className}`}>
        <div className="text-center">
          <div className="text-[32px]">{"\uD83D\uDCA4"}</div>
          <div className="mt-2 text-[13px] text-gray-400">Waiting for agents to start working...</div>
        </div>
      </div>
    );
  }

  const Component = SURFACE_MAP[surface.type] ?? FallbackSurface;
  return (
    <div className={className}>
      <Component surface={surface} />
    </div>
  );
}

const SURFACE_MAP: Record<SurfaceType, React.FC<{ surface: SurfaceState }>> = {
  browser: BrowserSurface,
  document: DocumentSurface,
  editor: EditorSurface,
  search: SearchSurface,
  email: EmailSurface,
  terminal: TerminalSurface,
  chat: ChatSurface,
  dashboard: DashboardSurface,
  kanban: KanbanSurface,
  database: DatabaseSurface,
  crm: CRMSurface,
  diff: DiffSurface,
  api: APISurface,
  calendar: CalendarSurface,
  spreadsheet: FallbackSurface,
  idle: FallbackSurface,
};

function FallbackSurface({ surface }: { surface: SurfaceState }) {
  return (
    <div className="flex h-full flex-col items-center justify-center rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
      <div className="text-[24px]">{EMOJI[surface.type] ?? "\u2728"}</div>
      <div className="mt-2 text-[14px] font-medium text-gray-700 dark:text-gray-300">{surface.agentName}</div>
      <div className="mt-1 text-[13px] text-gray-500">{surface.status || surface.type}</div>
    </div>
  );
}

const EMOJI: Record<string, string> = {
  browser: "\uD83C\uDF10", document: "\uD83D\uDCD6", editor: "\u270F\uFE0F",
  spreadsheet: "\uD83D\uDCCA", email: "\u2709\uFE0F", terminal: "\uD83D\uDCBB",
  search: "\uD83D\uDD0D", chat: "\uD83D\uDCAC", dashboard: "\uD83D\uDCCA",
  kanban: "\uD83D\uDCCB", database: "\uD83D\uDDC4", crm: "\uD83D\uDCBC",
  diff: "\uD83D\uDD00", api: "\uD83D\uDD27", calendar: "\uD83D\uDCC5",
};