export type {
  SurfaceState, SurfaceType,
  SearchResult, EmailDraft, TableData,
  ChatMessage, DashboardWidget,
  KanbanColumn, KanbanCard,
  CRMRecord, DiffHunk, APICall, CalendarEvent,
} from "./types";

export { SurfaceRenderer } from "./SurfaceRenderer";
export type { SurfaceRendererProps } from "./SurfaceRenderer";

// Original 6
export { BrowserSurface } from "./BrowserSurface";
export { DocumentSurface } from "./DocumentSurface";
export { EditorSurface } from "./EditorSurface";
export { SearchSurface } from "./SearchSurface";
export { EmailSurface } from "./EmailSurface";
export { TerminalSurface } from "./TerminalSurface";

// P0
export { ChatSurface } from "./ChatSurface";
export { DashboardSurface } from "./DashboardSurface";
export { KanbanSurface } from "./KanbanSurface";
export { DatabaseSurface } from "./DatabaseSurface";

// P1
export { CRMSurface } from "./CRMSurface";
export { DiffSurface } from "./DiffSurface";
export { APISurface } from "./APISurface";
export { CalendarSurface } from "./CalendarSurface";