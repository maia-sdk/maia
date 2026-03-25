"""ComputerUse — browser automation with ACP event emission.

Usage:
    from maia_computer_use import ComputerUse

    cu = ComputerUse(headless=True)
    await cu.launch()
    result = await cu.navigate("https://example.com")
    text = await cu.extract()
    await cu.scroll("down", 500)
    await cu.close()
"""

from __future__ import annotations

import base64
import time
from typing import Any

from maia_acp import ACPEvent, envelope, activity

from maia_computer_use.types import (
    ComputerUseOptions,
    ScreenshotResult,
    ExtractResult,
    NavigateResult,
    BrowserAction,
)


class ComputerUse:
    """Browser automation that emits ACP events for Theatre visualization."""

    def __init__(self, **kwargs: Any) -> None:
        self.options = ComputerUseOptions(**kwargs)
        if not self.options.run_id:
            self.options.run_id = f"run_{int(time.time())}"
        self._browser: Any = None
        self._context: Any = None
        self._page: Any = None
        self._events: list[ACPEvent] = []

    async def launch(self) -> ACPEvent:
        """Launch the browser."""
        from playwright.async_api import async_playwright
        pw = await async_playwright().start()
        browser_type = getattr(pw, self.options.browser)
        self._browser = await browser_type.launch(headless=self.options.headless)
        self._context = await self._browser.new_context(
            viewport={"width": self.options.width, "height": self.options.height},
        )
        self._page = await self._context.new_page()
        self._page.set_default_timeout(self.options.timeout)
        return self._emit("browsing", f"Browser launched ({self.options.browser}, {self.options.width}x{self.options.height})")

    async def navigate(self, url: str) -> NavigateResult:
        """Navigate to a URL and optionally take a screenshot."""
        self._ensure_page()
        self._emit("browsing", f"Navigating to {url}", browser={"url": url, "action": "navigate"})
        try:
            await self._page.goto(url, wait_until="domcontentloaded")
        except Exception:
            pass  # Timeout is ok
        title = await self._page.title()
        screenshot = await self._take_screenshot() if self.options.auto_screenshot else None
        return NavigateResult(url=self._page.url, title=title, screenshot=screenshot)

    async def click(self, selector: str) -> ACPEvent:
        """Click an element."""
        self._ensure_page()
        await self._page.click(selector)
        return self._emit("browsing", f"Clicked: {selector}", browser={"url": self._page.url, "action": "click"})

    async def type_text(self, selector: str, text: str) -> ACPEvent:
        """Type text into an element."""
        self._ensure_page()
        await self._page.fill(selector, text)
        return self._emit("browsing", f"Typed {len(text)} chars into {selector}", browser={"url": self._page.url, "action": "type"})

    async def scroll(self, direction: str = "down", amount: int = 500) -> ACPEvent:
        """Scroll the page."""
        self._ensure_page()
        delta = amount if direction == "down" else -amount
        await self._page.mouse.wheel(0, delta)
        return self._emit("browsing", f"Scrolled {direction} {amount}px", browser={"url": self._page.url, "action": "scroll"})

    async def extract(self, selector: str | None = None) -> ExtractResult:
        """Extract text from the page or a specific element."""
        self._ensure_page()
        if selector:
            el = await self._page.query_selector(selector)
            text = await el.inner_text() if el else ""
        else:
            text = await self._page.evaluate("() => document.body?.innerText || ''")
        url = self._page.url
        title = await self._page.title()
        links = await self._page.evaluate("() => document.querySelectorAll('a[href]').length")
        self._emit("reading", f"Extracted {len(text)} chars from {title}", browser={"url": url, "action": "extract"})
        return ExtractResult(text=text[:10000], url=url, title=title, link_count=links)

    async def screenshot(self) -> ScreenshotResult:
        """Take a screenshot."""
        self._ensure_page()
        return await self._take_screenshot()

    async def execute(self, actions: list[BrowserAction]) -> list[ACPEvent]:
        """Execute a sequence of browser actions."""
        import asyncio
        results: list[ACPEvent] = []
        for action in actions:
            if action.type == "navigate":
                r = await self.navigate(action.url)
                results.append(self._events[-1])
            elif action.type == "click":
                results.append(await self.click(action.selector))
            elif action.type == "type":
                results.append(await self.type_text(action.selector, action.text))
            elif action.type == "scroll":
                results.append(await self.scroll(action.direction, action.amount))
            elif action.type == "extract":
                await self.extract(action.selector or None)
                results.append(self._events[-1])
            elif action.type == "screenshot":
                await self.screenshot()
                results.append(self._events[-1])
            elif action.type == "wait":
                await asyncio.sleep(action.ms / 1000)
            elif action.type == "back":
                await self._page.go_back()
            elif action.type == "forward":
                await self._page.go_forward()
        return results

    def get_events(self) -> list[ACPEvent]:
        """Get all emitted ACP events."""
        return list(self._events)

    def get_page(self) -> Any:
        """Get the underlying Playwright page."""
        return self._page

    async def close(self) -> None:
        """Close the browser."""
        if self._browser:
            await self._browser.close()
            self._browser = None
            self._context = None
            self._page = None

    def _ensure_page(self) -> None:
        if not self._page:
            raise RuntimeError("Browser not launched. Call launch() first.")

    async def _take_screenshot(self) -> ScreenshotResult:
        buf = await self._page.screenshot(type="jpeg", quality=self.options.screenshot_quality)
        data = base64.b64encode(buf).decode()
        url = self._page.url
        title = await self._page.title()
        vp = self._page.viewport_size or {"width": self.options.width, "height": self.options.height}
        self._emit("browsing", f"Screenshot: {title}", browser={"url": url, "action": "screenshot"})
        return ScreenshotResult(data=data, width=vp["width"], height=vp["height"], url=url, title=title)

    def _emit(self, activity_type: str, detail: str, **extra: Any) -> ACPEvent:
        event = envelope(
            self.options.agent_id,
            self.options.run_id,
            "event",
            activity(agent_id=self.options.agent_id, activity_type=activity_type, detail=detail, **extra),
        )
        self._events.append(event)
        return event