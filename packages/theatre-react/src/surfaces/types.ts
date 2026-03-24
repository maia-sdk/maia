/**
 * Surface types — what Theatre shows for each kind of agent work.
 */

export type SurfaceType =
  | "browser"
  | "document"
  | "editor"
  | "spreadsheet"
  | "email"
  | "terminal"
  | "search"
  | "idle";

export interface SurfaceState {
  type: SurfaceType;
  agentId: string;
  agentName: string;
  title: string;
  /** Browser: current URL. Document: file name. Editor: file name. */
  url?: string;
  /** Browser: page screenshot (base64 or URL). */
  screenshot?: string;
  /** Browser: page HTML snippet. Document: highlighted text. */
  content?: string;
  /** Editor: code/text being written. */
  text?: string;
  /** Editor: language for syntax highlighting. */
  language?: string;
  /** Search: list of results. */
  results?: SearchResult[];
  /** Email: draft fields. */
  email?: EmailDraft;
  /** Terminal: command output lines. */
  terminalLines?: string[];
  /** Spreadsheet: table data. */
  tableData?: string[][];
  /** Status label shown at bottom. */
  status?: string;
}

export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
}

export interface EmailDraft {
  to: string;
  subject: string;
  body: string;
}