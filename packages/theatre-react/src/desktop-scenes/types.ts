export type ClickRippleEntry = {
  id: string;
  x: number;
  y: number;
  type: "click" | "hover";
};

export type HighlightColor = "yellow" | "green";

export type HighlightRegion = {
  keyword: string;
  color: HighlightColor;
  x: number;
  y: number;
  width: number;
  height: number;
};

export type DocumentHighlight = {
  word: string;
  snippet: string;
  color: HighlightColor;
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

export type HighlightPalette = {
  border: string;
  fill: string;
  labelBackground: string;
  labelText: string;
};

export type BrowserFindState = {
  dedupedBrowserKeywords: string[];
  findMatchCount: number;
  findQuery: string;
  showFindOverlay: boolean;
  semanticFindResults: Array<{ term: string; confidence: number }>;
};

export type PdfPlaybackState = {
  pdfPage: number;
  pdfPageTotal: number;
  pdfScrollPercent: number | null;
  pdfScrollDirection: "up" | "down" | "";
  pdfScanRegion: string;
  pdfZoomLevel: number | null;
  pdfZoomReason: string;
  pdfTargetRegion: HighlightRegion | null;
  pdfCompareLeft: string;
  pdfCompareRight: string;
  pdfCompareVerdict: string;
  pdfFindQuery: string;
  pdfFindMatchCount: number;
  pdfSemanticFindResults: Array<{ term: string; confidence: number }>;
  zoomHistory: ZoomHistoryEntry[];
};

export type SceneAnimationState = {
  copyPulseText: string;
  copyPulseVisible: boolean;
  emailBodyScrollRef: React.RefObject<HTMLDivElement | null>;
  typedDocBodyPreview: string;
  typedSheetBodyPreview: string;
};
