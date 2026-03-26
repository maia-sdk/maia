import type { ActivityEventLike, PreviewTab } from "./types";

function eventMetadataString(event: ActivityEventLike | null, key: string): string {
  if (!event || !event.metadata) return "";
  const value = event.metadata[key];
  return typeof value === "string" ? value.trim() : "";
}

function findRecentMetadataString(events: ActivityEventLike[], key: string): string {
  for (let idx = events.length - 1; idx >= 0; idx -= 1) {
    const value = eventMetadataString(events[idx], key);
    if (value) return value;
  }
  return "";
}

function sampleFilmstripEvents(
  events: ActivityEventLike[],
  activeIndex: number,
  maxItems = 72,
): Array<{ event: ActivityEventLike; index: number }> {
  void activeIndex;
  void maxItems;
  return events
    .filter((event) => String(event.event_type || "").trim().toLowerCase() !== "interaction_suggestion")
    .map((event, index) => ({ event, index }));
}

function tabForEventType(eventType: string): PreviewTab {
  const normalized = String(eventType || "").toLowerCase();
  if (normalized.startsWith("browser_") || normalized.startsWith("browser.") || normalized.startsWith("web_") || normalized.startsWith("web.") || normalized.startsWith("brave.") || normalized.startsWith("bing.")) return "browser";
  if (normalized.startsWith("email_") || normalized.startsWith("email.") || normalized.startsWith("gmail.") || normalized.startsWith("gmail_")) return "email";
  if (normalized.startsWith("document_") || normalized.startsWith("document.") || normalized.startsWith("pdf_") || normalized.startsWith("pdf.") || normalized.startsWith("doc_") || normalized.startsWith("doc.") || normalized.startsWith("docs.") || normalized.startsWith("sheet_") || normalized.startsWith("sheet.") || normalized.startsWith("sheets.") || normalized.startsWith("drive.")) return "document";
  return "system";
}

export { eventMetadataString, findRecentMetadataString, sampleFilmstripEvents, tabForEventType };
export type { PreviewTab };
