import { describe, it, expect } from "vitest";
import { ComputerUse, takeScreenshot, extractPageText, clickElement } from "./index";
import type { ComputerUseOptions, BrowserAction, ScreenshotResult } from "./index";

describe("computer-use exports", () => {
  it("exports ComputerUse class", () => {
    expect(ComputerUse).toBeDefined();
    expect(typeof ComputerUse).toBe("function");
  });

  it("ComputerUse constructor accepts options", () => {
    const cu = new ComputerUse({ headless: true });
    expect(cu).toBeDefined();
  });

  it("exports takeScreenshot function", () => {
    expect(takeScreenshot).toBeDefined();
    expect(typeof takeScreenshot).toBe("function");
  });

  it("exports extractPageText function", () => {
    expect(extractPageText).toBeDefined();
    expect(typeof extractPageText).toBe("function");
  });

  it("exports clickElement function", () => {
    expect(clickElement).toBeDefined();
    expect(typeof clickElement).toBe("function");
  });
});

describe("ComputerUse types", () => {
  it("ComputerUseOptions type compiles", () => {
    const opts: ComputerUseOptions = { headless: true };
    expect(opts.headless).toBe(true);
  });

  it("BrowserAction type compiles", () => {
    const action: BrowserAction = { type: "navigate", url: "https://example.com" };
    expect(action.type).toBe("navigate");
  });
});
