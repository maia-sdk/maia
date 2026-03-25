# @maia/computer-use

Browser automation for AI agents — Playwright wrapper that emits ACP events for Theatre visualization.

## Install

```bash
npm install @maia/computer-use playwright
```

## Quick Start

```ts
import { ComputerUse } from '@maia/computer-use';

const browser = new ComputerUse({ headless: true });
await browser.launch();

// Navigate and auto-screenshot
const { screenshot } = await browser.navigate("https://example.com");

// Interact
await browser.click("button.submit");
await browser.type("#search", "SaaS pricing data");
await browser.scroll("down", 500);

// Extract text
const { result } = await browser.extract("main");
console.log(result.text);

// Get all ACP events (for Theatre visualization)
const events = browser.getEvents();

await browser.close();
```

## Batch Execution

```ts
const events = await browser.execute([
  { type: "navigate", url: "https://example.com" },
  { type: "click", selector: ".login" },
  { type: "type", selector: "#email", text: "user@test.com" },
  { type: "screenshot" },
  { type: "extract" },
]);
```

## Options

```ts
new ComputerUse({
  headless: true,           // default: true
  browser: "chromium",      // chromium | firefox | webkit
  width: 1280,              // viewport width
  height: 720,              // viewport height
  screenshotQuality: 60,    // JPEG quality 0-100
  autoScreenshot: true,     // screenshot after navigate
  timeout: 30000,           // page load timeout ms
  agentId: "agent://browser",
  runId: "run_123",
});
```

## API

- `launch()` — start the browser
- `navigate(url)` — go to URL + optional auto-screenshot
- `click(selector)` — click an element
- `type(selector, text)` — fill an input
- `scroll(direction, amount)` — scroll up/down
- `extract(selector?)` — get text content
- `screenshot()` — capture the page
- `execute(actions)` — run a batch of actions
- `getEvents()` — get all emitted ACP events
- `getPage()` — access raw Playwright page
- `close()` — close the browser

## License

MIT — [github.com/maia-sdk/maia](https://github.com/maia-sdk/maia)