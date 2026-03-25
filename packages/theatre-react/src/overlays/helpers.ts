/**
 * Overlay helper utilities.
 * Ported from the Maia platform to the SDK.
 */

import type { HighlightColor, HighlightPalette } from "./types";

const PALETTES: Record<HighlightColor, HighlightPalette> = {
  yellow: {
    border: "rgba(234, 179, 8, 0.5)",
    fill: "rgba(234, 179, 8, 0.12)",
    labelBackground: "#fbbf24",
    labelText: "#78350f",
  },
  green: {
    border: "rgba(34, 197, 94, 0.5)",
    fill: "rgba(34, 197, 94, 0.12)",
    labelBackground: "#4ade80",
    labelText: "#14532d",
  },
};

export function highlightPalette(color: HighlightColor): HighlightPalette {
  return PALETTES[color] || PALETTES.yellow;
}