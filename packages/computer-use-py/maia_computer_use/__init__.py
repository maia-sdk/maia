"""maia-computer-use — Browser automation for AI agents.

Usage:
    from maia_computer_use import ComputerUse

    cu = ComputerUse(headless=True, agent_id="agent://researcher")
    await cu.launch()
    result = await cu.navigate("https://example.com")
    print(result.title, result.screenshot.data[:50])
    text = await cu.extract()
    print(text.text[:200])
    await cu.close()
"""

from maia_computer_use.computer_use import ComputerUse
from maia_computer_use.types import (
    ComputerUseOptions,
    ScreenshotResult,
    ExtractResult,
    NavigateResult,
    BrowserAction,
)

__version__ = "0.1.0"
__all__ = [
    "ComputerUse",
    "ComputerUseOptions",
    "ScreenshotResult",
    "ExtractResult",
    "NavigateResult",
    "BrowserAction",
]