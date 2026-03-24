/**
 * Browser actions — low-level Playwright wrappers that return ACP events.
 */

import type { ACPEvent } from "@maia/acp";
import { envelope, activity } from "@maia/acp";
import type { ScreenshotResult, ExtractResult } from "./types";

type Page = any; // Playwright Page — imported dynamically

export async function takeScreenshot(
  page: Page,
  agentId: string,
  runId: string,
  quality: number = 60,
): Promise<{ event: ACPEvent; screenshot: ScreenshotResult }> {
  const buffer = await page.screenshot({ type: "jpeg", quality });
  const data = buffer.toString("base64");
  const url = page.url();
  const title = await page.title();
  const viewport = page.viewportSize() || { width: 1280, height: 720 };

  const screenshot: ScreenshotResult = {
    data,
    width: viewport.width,
    height: viewport.height,
    url,
    title,
  };

  const event = envelope(agentId, runId, "event", activity({
    agentId,
    activity: "browsing",
    detail: `Screenshot: ${title}`,
    browser: { url, title, action: "navigate" },
  }));

  return { event, screenshot };
}

export async function extractPageText(
  page: Page,
  agentId: string,
  runId: string,
  selector?: string,
): Promise<{ event: ACPEvent; result: ExtractResult }> {
  const target = selector ? await page.$(selector) : page;
  const text = target
    ? await target.evaluate((el: any) => el.innerText || el.textContent || "")
    : "";
  const url = page.url();
  const title = await page.title();
  const linkCount = await page.$$eval("a[href]", (links: any[]) => links.length);

  const result: ExtractResult = { text, url, title, linkCount };

  const event = envelope(agentId, runId, "event", activity({
    agentId,
    activity: "reading",
    detail: `Extracted ${text.length} chars from ${title}`,
    browser: { url, title, action: "extract" },
  }));

  return { event, result };
}

export async function clickElement(
  page: Page,
  selector: string,
  agentId: string,
  runId: string,
): Promise<ACPEvent> {
  await page.click(selector);
  const url = page.url();
  const title = await page.title();

  return envelope(agentId, runId, "event", activity({
    agentId,
    activity: "browsing",
    detail: `Clicked: ${selector}`,
    browser: { url, title, action: "click" },
  }));
}