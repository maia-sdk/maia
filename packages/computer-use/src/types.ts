/**
 * Types for @maia/computer-use.
 */

export interface ComputerUseOptions {
  /** Run browser in headless mode (default: true). */
  headless?: boolean;
  /** Browser type: chromium, firefox, webkit (default: chromium). */
  browser?: "chromium" | "firefox" | "webkit";
  /** Viewport width (default: 1280). */
  width?: number;
  /** Viewport height (default: 720). */
  height?: number;
  /** Agent ID for ACP events (default: agent://browser). */
  agentId?: string;
  /** Run ID for ACP events. */
  runId?: string;
  /** Screenshot quality 0-100 (default: 60). */
  screenshotQuality?: number;
  /** Auto-screenshot after each action (default: true). */
  autoScreenshot?: boolean;
  /** Max page load timeout in ms (default: 30000). */
  timeout?: number;
}

export type BrowserAction =
  | { type: "navigate"; url: string }
  | { type: "click"; selector: string }
  | { type: "type"; selector: string; text: string }
  | { type: "scroll"; direction: "up" | "down"; amount?: number }
  | { type: "extract"; selector?: string }
  | { type: "screenshot" }
  | { type: "wait"; ms: number }
  | { type: "back" }
  | { type: "forward" };

export interface ScreenshotResult {
  /** Base64-encoded PNG image. */
  data: string;
  /** Width in pixels. */
  width: number;
  /** Height in pixels. */
  height: number;
  /** Current page URL. */
  url: string;
  /** Page title. */
  title: string;
}

export interface ExtractResult {
  /** Extracted text content. */
  text: string;
  /** Page URL. */
  url: string;
  /** Page title. */
  title: string;
  /** Number of links found. */
  linkCount: number;
}