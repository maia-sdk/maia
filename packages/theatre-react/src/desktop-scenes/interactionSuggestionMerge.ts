const INTERACTION_SUGGESTION_MIN_CONFIDENCE = 0.4;

export type InteractionSuggestionSource = "llm_suggestion";

export type InteractionSuggestion = {
  action: string;
  targetLabel: string;
  highlightText?: string;
  primary: boolean;
  cursorX: number | null;
  cursorY: number | null;
  scrollPercent: number | null;
  confidence: number;
  reason: string;
  advisory: true;
  noExecution: true;
  source: InteractionSuggestionSource;
  stepIndex: number | null;
  eventId: string;
  runId: string;
};

export type InteractionSuggestionRejectReason = "low_confidence" | "missing_advisory_guard";

export type MergedInteractionSource = "deterministic" | "suggested" | "synthetic_fallback" | "none";

export type MergedInteractionState = {
  cursorX: number | null;
  cursorY: number | null;
  action: string;
  targetLabel: string;
  scrollPercent: number | null;
  source: MergedInteractionSource;
  suggestionConfidence: number | null;
  suggestionReason: string | null;
};

function clampPercent(value: number | null): number | null {
  if (value === null || !Number.isFinite(value)) {
    return null;
  }
  return Math.max(0, Math.min(100, Number(value)));
}

function mergeSuggestion(
  deterministicCursorX: number | null,
  deterministicCursorY: number | null,
  deterministicAction: string,
  deterministicTargetLabel: string,
  deterministicScrollPercent: number | null,
  suggestions: InteractionSuggestion[] | null,
  confidenceThreshold: number = INTERACTION_SUGGESTION_MIN_CONFIDENCE,
  syntheticFallbackCursor: { x: number | null; y: number | null } | null = null,
  onRejected?: (reason: InteractionSuggestionRejectReason, suggestion: InteractionSuggestion) => void,
): MergedInteractionState {
  const suggestion = suggestions
    ? [...suggestions].sort((left, right) => right.confidence - left.confidence)[0] ?? null
    : null;

  if (deterministicCursorX !== null && deterministicCursorY !== null) {
    return {
      cursorX: deterministicCursorX,
      cursorY: deterministicCursorY,
      action: String(deterministicAction || "").trim().toLowerCase(),
      targetLabel: String(deterministicTargetLabel || "").trim(),
      scrollPercent: clampPercent(deterministicScrollPercent),
      source: "deterministic",
      suggestionConfidence: null,
      suggestionReason: null,
    };
  }

  if (suggestion) {
    if (suggestion.advisory !== true || suggestion.noExecution !== true) {
      onRejected?.("missing_advisory_guard", suggestion);
    } else if (suggestion.confidence < confidenceThreshold) {
      onRejected?.("low_confidence", suggestion);
    } else {
      const mergedAction =
        String(deterministicAction || "").trim().toLowerCase() ||
        String(suggestion.action || "").trim().toLowerCase();
      const deterministicScroll = clampPercent(deterministicScrollPercent);
      const suggestionScroll = mergedAction === "scroll" ? clampPercent(suggestion.scrollPercent) : null;
      return {
        cursorX: suggestion.cursorX,
        cursorY: suggestion.cursorY,
        action: mergedAction,
        targetLabel:
          String(deterministicTargetLabel || "").trim() || String(suggestion.targetLabel || "").trim(),
        scrollPercent: deterministicScroll ?? suggestionScroll,
        source: "suggested",
        suggestionConfidence: suggestion.confidence,
        suggestionReason: suggestion.reason || null,
      };
    }
  }

  const fallbackX = clampPercent(syntheticFallbackCursor?.x ?? null);
  const fallbackY = clampPercent(syntheticFallbackCursor?.y ?? null);
  if (fallbackX !== null && fallbackY !== null) {
    return {
      cursorX: fallbackX,
      cursorY: fallbackY,
      action: String(deterministicAction || "").trim().toLowerCase(),
      targetLabel: String(deterministicTargetLabel || "").trim(),
      scrollPercent: clampPercent(deterministicScrollPercent),
      source: "synthetic_fallback",
      suggestionConfidence: null,
      suggestionReason: null,
    };
  }

  return {
    cursorX: null,
    cursorY: null,
    action: String(deterministicAction || "").trim().toLowerCase(),
    targetLabel: String(deterministicTargetLabel || "").trim(),
    scrollPercent: clampPercent(deterministicScrollPercent),
    source: "none",
    suggestionConfidence: null,
    suggestionReason: null,
  };
}

export { INTERACTION_SUGGESTION_MIN_CONFIDENCE, mergeSuggestion };
