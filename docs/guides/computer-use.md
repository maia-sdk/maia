# Computer Use

Give your agents a real browser. They can navigate, click, type, scroll, and extract content — with full Theatre observability.

## Setup

```bash
npm install @maia/computer-use playwright
npx playwright install chromium
```

## Basic usage

```typescript
import { ComputerUse } from '@maia/computer-use';

const browser = new ComputerUse({
  headless: true,
  agentId: "agent://browser",
});

await browser.launch();

// Navigate to a page
const { screenshot } = await browser.navigate("https://news.ycombinator.com");

// Extract text
const { result } = await browser.extract();
console.log(result.text);

// Click an element
await browser.click("a.storylink");

// Type into a field
await browser.type("input[name=q]", "AI agent protocols");

// Scroll
await browser.scroll("down", 500);

// Take a screenshot
const { screenshot: snap } = await browser.screenshot();

// Close
await browser.close();
```

## Execute a sequence

```typescript
const events = await browser.execute([
  { type: "navigate", url: "https://example.com" },
  { type: "click", selector: "button.login" },
  { type: "type", selector: "#email", text: "user@example.com" },
  { type: "type", selector: "#password", text: "password123" },
  { type: "click", selector: "button[type=submit]" },
  { type: "wait", ms: 2000 },
  { type: "screenshot" },
  { type: "extract" },
]);
```

## Theatre integration

Every browser action automatically emits ACP events. Theatre shows:

- Live screenshots as the agent browses
- URL bar updating in real-time
- Click and type highlights
- Page load progress

```tsx
<Theatre streamUrl="/acp/events" />
```

The browser activity appears in Theatre's Activity Timeline.

## Options

| Option | Default | Description |
|--------|---------|-------------|
| `headless` | `true` | Run without visible browser |
| `browser` | `"chromium"` | Browser engine |
| `width` | `1280` | Viewport width |
| `height` | `720` | Viewport height |
| `agentId` | `"agent://browser"` | Agent ID for ACP events |
| `screenshotQuality` | `60` | JPEG quality (0-100) |
| `autoScreenshot` | `true` | Screenshot after each action |
| `timeout` | `30000` | Page load timeout (ms) |