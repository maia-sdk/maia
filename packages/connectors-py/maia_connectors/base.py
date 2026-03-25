"""Base connector class — extend to create custom connectors."""

from __future__ import annotations

from typing import Any

import httpx

from maia_acp import envelope, activity


class BaseConnector:
    """Base class for all Maia connectors.

    Provides HTTP client, ACP event emission, and auth injection.
    Extend this to create custom connectors.
    """

    def __init__(
        self,
        connector_id: str,
        name: str,
        agent_id: str = "agent://connector",
        run_id: str = "",
    ) -> None:
        self.connector_id = connector_id
        self.name = name
        self.agent_id = agent_id
        self.run_id = run_id or f"run_{id(self)}"
        self._client: httpx.AsyncClient | None = None

    @property
    def client(self) -> httpx.AsyncClient:
        if self._client is None:
            self._client = httpx.AsyncClient(timeout=30.0)
        return self._client

    async def execute(
        self,
        tool_id: str,
        params: dict[str, Any],
        credentials: dict[str, Any],
    ) -> dict[str, Any]:
        """Execute a connector tool. Override in subclasses."""
        raise NotImplementedError(f"Tool {tool_id} not implemented for {self.name}")

    def emit_activity(self, detail: str, tool_id: str = "") -> dict[str, Any]:
        """Emit an ACP activity event for this connector action."""
        return envelope(
            self.agent_id,
            self.run_id,
            "event",
            activity(
                agent_id=self.agent_id,
                activity_type="tool_calling",
                detail=f"{self.name}: {detail}",
                tool={"tool_id": tool_id, "tool_name": self.name, "status": "running"} if tool_id else None,
            ),
        )

    async def request(
        self,
        method: str,
        url: str,
        credentials: dict[str, Any],
        **kwargs: Any,
    ) -> httpx.Response:
        """Make an authenticated HTTP request."""
        headers = kwargs.pop("headers", {})

        # Auto-inject auth based on credential type
        if "access_token" in credentials:
            headers["Authorization"] = f"Bearer {credentials['access_token']}"
        elif "api_key" in credentials:
            headers["Authorization"] = f"Bearer {credentials['api_key']}"
        elif "bot_token" in credentials:
            headers["Authorization"] = f"Bearer {credentials['bot_token']}"

        return await self.client.request(method, url, headers=headers, **kwargs)

    async def close(self) -> None:
        if self._client:
            await self._client.aclose()
            self._client = None