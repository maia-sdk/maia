/**
 * Shared types for Theatre overlay components.
 * Ported from the Maia platform to the SDK.
 */

export type HighlightColor = "yellow" | "green";

export type HighlightRegion = {
  keyword: string;
  color: HighlightColor;
  x: number;
  y: number;
  width: number;
  height: number;
};

export type HighlightPalette = {
  border: string;
  fill: string;
  labelBackground: string;
  labelText: string;
};

export type ZoomHistoryEntry = {
  eventRef: string;
  eventType: string;
  eventIndex: number | null;
  timestamp: string;
  action: "zoom_in" | "zoom_out" | "zoom_reset" | "zoom_to_region";
  sceneSurface: string;
  sceneRef: string;
  graphNodeId: string;
  zoomLevel: number | null;
  zoomReason: string;
  zoomPolicyTriggers: string[];
};

export type BrowserFindState = {
  dedupedBrowserKeywords: string[];
  findMatchCount: number;
  findQuery: string;
  showFindOverlay: boolean;
  semanticFindResults: Array<{ term: string; confidence: number }>;
};

export type TracePoint = { x: number; y: number };

export type ClickRippleEntry = {
  id: string;
  x: number;
  y: number;
  type: "click" | "hover";
};