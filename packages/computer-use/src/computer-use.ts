/**
 * ComputerUse — high-level browser automation with ACP event emission.
 *
 * Usage:
 *   const cu = new ComputerUse({ headless: true });
 *   await cu.launch();
 *   const events = await cu.navigate("https://example.com");
 *   const { text } = await cu.extract();
 *   await cu.click("button.submit");
 *   await cu.close();
 */

import type { ACPEvent } from "@maia/acp";
import { envelope, activity } from "@maia/acp";
import type { ComputerUseOptions, BrowserAction, ScreenshotResult, ExtractResult } from "./types";
import { takeScreenshot, extractPageText, clickElement } from "./actions";

export class ComputerUse {
  private options: Required<ComputerUseOptions>;
  private browser: any = null;
  private context: any = null;
  private page: any = null;
  private events: ACPEvent[] = [];

  constructor(opts: ComputerUseOptions = {}) {
    this.options = {
      headless: opts.headless ?? true,
      browser: opts.browser ?? "chromium",
      width: opts.width ?? 1280,
      height: opts.height ?? 720,
      agentId: opts.agentId ?? "agent://browser",
      runId: opts.runId ?? `run_${Date.now()}`,
      screenshotQuality: opts.screenshotQuality ?? 60,
      autoScreenshot: opts.autoScreenshot ?? true,
      timeout: opts.timeout ?? 30000,
    };
  }

  /** Launch the browser. */
  async launch(): Promise<ACPEvent> {
    const pw = await import("playwright");
    const browserType = pw[this.options.browser];
    this.browser = await browserType.launch({ headless: this.options.headless });
    this.context = await this.browser.newContext({
      viewport: { width: this.options.width, height: this.options.height },
    });
    this.page = await this.context.newPage();
    this.page.setDefaultTimeout(this.options.timeout);

    const event = this.emit("event", activity({
      agentId: this.options.agentId,
      activity: "browsing",
      detail: `Browser launched (${this.options.browser}, ${this.options.width}x${this.options.height})`,
    }));
    return event;
  }

  /** Navigate to a URL. */
  async navigate(url: string): Promise<{ event: ACPEvent; screenshot?: ScreenshotResult }> {
    this.ensurePage();

    const navEvent = this.emit("event", activity({
      agentId: this.options.agentId,
      activity: "browsing",
      detail: `Navigating to ${url}`,
      browser: { url, action: "navigate" },
    }));

    await this.page.goto(url, { waitUntil: "domcontentloaded" });
    const title = await this.page.title();

    let screenshot: ScreenshotResult | undefined;
    if (this.options.autoScreenshot) {
      const result = await takeScreenshot(
        this.page, this.options.agentId, this.options.runId, this.options.screenshotQuality,
      );
      this.events.push(result.event);
      screenshot = result.screenshot;
    }

    return { event: navEvent, screenshot };
  }

  /** Click an element. */
  async click(selector: string): Promise<ACPEvent> {
    this.ensurePage();
    const event = await clickElement(this.page, selector, this.options.agentId, this.options.runId);
    this.events.push(event);
    return event;
  }

  /** Type text into an element. */
  async type(selector: string, text: string): Promise<ACPEvent> {
    this.ensurePage();
    await this.page.fill(selector, text);

    const event = this.emit("event", activity({
      agentId: this.options.agentId,
      activity: "browsing",
      detail: `Typed ${text.length} chars into ${selector}`,
      browser: { url: this.page.url(), action: "type" },
    }));
    return event;
  }

  /** Scroll the page. */
  async scroll(direction: "up" | "down", amount: number = 500): Promise<ACPEvent> {
    this.ensurePage();
    const delta = direction === "down" ? amount : -amount;
    await this.page.mouse.wheel(0, delta);

    const event = this.emit("event", activity({
      agentId: this.options.agentId,
      activity: "browsing",
      detail: `Scrolled ${direction} ${amount}px`,
      browser: { url: this.page.url(), action: "scroll" },
    }));
    return event;
  }

  /** Extract text from the page or a specific selector. */
  async extract(selector?: string): Promise<{ event: ACPEvent; result: ExtractResult }> {
    this.ensurePage();
    const { event, result } = await extractPageText(
      this.page, this.options.agentId, this.options.runId, selector,
    );
    this.events.push(event);
    return { event, result };
  }

  /** Take a screenshot. */
  async screenshot(): Promise<{ event: ACPEvent; screenshot: ScreenshotResult }> {
    this.ensurePage();
    const result = await takeScreenshot(
      this.page, this.options.agentId, this.options.runId, this.options.screenshotQuality,
    );
    this.events.push(result.event);
    return result;
  }

  /** Execute a sequence of browser actions. */
  async execute(actions: BrowserAction[]): Promise<ACPEvent[]> {
    const results: ACPEvent[] = [];
    for (const action of actions) {
      switch (action.type) {
        case "navigate": results.push((await this.navigate(action.url)).event); break;
        case "click": results.push(await this.click(action.selector)); break;
        case "type": results.push(await this.type(action.selector, action.text)); break;
        case "scroll": results.push(await this.scroll(action.direction, action.amount)); break;
        case "extract": results.push((await this.extract(action.selector)).event); break;
        case "screenshot": results.push((await this.screenshot()).event); break;
        case "wait": await new Promise((r) => setTimeout(r, action.ms)); break;
        case "back": await this.page.goBack(); break;
        case "forward": await this.page.goForward(); break;
      }
    }
    return results;
  }

  /** Get all emitted ACP events. */
  getEvents(): ACPEvent[] {
    return [...this.events];
  }

  /** Get the underlying Playwright page (for advanced use). */
  getPage(): any {
    return this.page;
  }

  /** Close the browser. */
  async close(): Promise<void> {
    await this.browser?.close();
    this.browser = null;
    this.context = null;
    this.page = null;
  }

  private ensurePage(): void {
    if (!this.page) throw new Error("Browser not launched. Call launch() first.");
  }

  private emit(eventType: string, payload: any): ACPEvent {
    const event = envelope(this.options.agentId, this.options.runId, eventType, payload);
    this.events.push(event);
    return event;
  }
}