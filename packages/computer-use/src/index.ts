/**
 * @maia/computer-use — Browser automation that emits ACP events.
 *
 * Wraps Playwright to give AI agents browser control with full
 * Theatre observability (live screenshots, click highlights, URL tracking).
 *
 * Usage:
 *   import { ComputerUse } from '@maia/computer-use';
 *
 *   const browser = new ComputerUse({ headless: true });
 *   await browser.launch();
 *
 *   for await (const event of browser.navigate("https://example.com")) {
 *     // ACP events: browsing activity, screenshots, extracted text
 *   }
 */

export { ComputerUse } from "./computer-use";
export type { ComputerUseOptions, BrowserAction, ScreenshotResult } from "./types";
export { takeScreenshot, extractPageText, clickElement } from "./actions";