"""Types for computer-use browser automation."""

from __future__ import annotations

from typing import Any, Literal
from pydantic import BaseModel, Field


class ComputerUseOptions(BaseModel):
    headless: bool = True
    browser: Literal["chromium", "firefox", "webkit"] = "chromium"
    width: int = 1280
    height: int = 720
    agent_id: str = "agent://browser"
    run_id: str = ""
    screenshot_quality: int = 60
    auto_screenshot: bool = True
    timeout: int = 30000


class ScreenshotResult(BaseModel):
    data: str  # base64 encoded JPEG
    width: int
    height: int
    url: str = ""
    title: str = ""


class ExtractResult(BaseModel):
    text: str
    url: str = ""
    title: str = ""
    link_count: int = 0


class NavigateResult(BaseModel):
    url: str
    title: str
    screenshot: ScreenshotResult | None = None


class BrowserAction(BaseModel):
    type: Literal["navigate", "click", "type", "scroll", "extract", "screenshot", "wait", "back", "forward"]
    url: str = ""
    selector: str = ""
    text: str = ""
    direction: Literal["up", "down"] = "down"
    amount: int = 500
    ms: int = 1000