/**
 * Surface types — what Theatre shows for each kind of agent work.
 */

export type SurfaceType =
  | "browser" | "document" | "editor" | "spreadsheet"
  | "email" | "terminal" | "search"
  | "chat" | "dashboard" | "kanban" | "database"
  | "crm" | "diff" | "api" | "calendar"
  | "idle";

export interface SurfaceState {
  type: SurfaceType;
  agentId: string;
  agentName: string;
  title: string;
  url?: string;
  screenshot?: string;
  content?: string;
  text?: string;
  language?: string;
  status?: string;
  results?: SearchResult[];
  email?: EmailDraft;
  terminalLines?: string[];
  tableData?: TableData;
  chatMessages?: ChatMessage[];
  dashboardWidgets?: DashboardWidget[];
  kanbanColumns?: KanbanColumn[];
  crmRecords?: CRMRecord[];
  diffHunks?: DiffHunk[];
  apiCall?: APICall;
  calendarEvents?: CalendarEvent[];
}

// ── Existing ─────────────────────────────────────────────────
export interface SearchResult { title: string; url: string; snippet: string; }
export interface EmailDraft { to: string; subject: string; body: string; }

// ── P0: New ──────────────────────────────────────────────────
export interface TableData { headers: string[]; rows: string[][]; query?: string; }

export interface ChatMessage { sender: string; text: string; time: string; avatar?: string; }

export interface DashboardWidget {
  type: "kpi" | "bar" | "line" | "pie" | "table";
  title: string;
  value?: string;
  change?: string;
  direction?: "up" | "down" | "flat";
  data?: number[];
  labels?: string[];
}

export interface KanbanColumn { title: string; cards: KanbanCard[]; }
export interface KanbanCard {
  id: string; title: string; assignee?: string;
  priority?: "low" | "medium" | "high" | "critical";
  labels?: string[];
}

// ── P1: New ──────────────────────────────────────────────────
export interface CRMRecord {
  type: "contact" | "deal" | "lead";
  name: string; company?: string; value?: string;
  stage?: string; email?: string;
}

export interface DiffHunk { file: string; additions: string[]; deletions: string[]; }

export interface APICall {
  method: string; url: string; status?: number;
  requestBody?: string; responseBody?: string; duration?: string;
}

export interface CalendarEvent { title: string; start: string; end: string; color?: string; }