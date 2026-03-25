"""TeamChat server — serves the agent conversation UI over HTTP with SSE streaming.

Usage:
    from maia_teamchat import TeamChat

    chat = TeamChat(port=8766)
    await chat.serve(events)

    # Or live mode:
    chat = TeamChat(port=8766)
    chat.start()
    chat.push(event)
    chat.stop()
"""

from __future__ import annotations

import asyncio
import json
import webbrowser
from http.server import HTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
from threading import Thread
from typing import Any

from maia_acp import ACPEvent

STATIC_DIR = Path(__file__).parent / "static"


class _SSEHandler(SimpleHTTPRequestHandler):
    events: list[dict[str, Any]] = []
    live_queue: asyncio.Queue | None = None

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        kwargs["directory"] = str(STATIC_DIR)
        super().__init__(*args, **kwargs)

    def do_GET(self) -> None:
        if self.path == "/acp/events":
            self._handle_sse()
        elif self.path == "/health":
            body = json.dumps({"status": "ok", "events": len(self.events)}).encode()
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(body)
        else:
            super().do_GET()

    def _handle_sse(self) -> None:
        self.send_response(200)
        self.send_header("Content-Type", "text/event-stream")
        self.send_header("Cache-Control", "no-cache")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()

        for event in self.events:
            self.wfile.write(f"data: {json.dumps(event)}\n\n".encode())
            self.wfile.flush()

        if self.live_queue is not None:
            try:
                import time
                while True:
                    time.sleep(0.1)
                    while not self.live_queue.empty():
                        event = self.live_queue.get_nowait()
                        if event is None:
                            self.wfile.write(b"data: [DONE]\n\n")
                            self.wfile.flush()
                            return
                        self.wfile.write(f"data: {json.dumps(event)}\n\n".encode())
                        self.wfile.flush()
            except (BrokenPipeError, ConnectionResetError):
                pass

        self.wfile.write(b"data: [DONE]\n\n")
        self.wfile.flush()

    def log_message(self, *args: Any) -> None:
        pass


class TeamChat:
    """Serve the TeamChat UI from Python.

    Args:
        port: HTTP port (default 8766)
        open_browser: Auto-open browser (default True)
        host: Bind address (default "localhost")
    """

    def __init__(self, port: int = 8766, open_browser: bool = True, host: str = "localhost") -> None:
        self.port = port
        self.host = host
        self.open_browser = open_browser
        self._server: HTTPServer | None = None
        self._thread: Thread | None = None
        self._queue: asyncio.Queue | None = None

    async def serve(self, events: list[ACPEvent | dict[str, Any]]) -> None:
        """Serve pre-recorded events. Opens browser and blocks."""
        event_dicts = [e.model_dump() if hasattr(e, "model_dump") else (vars(e) if not isinstance(e, dict) else e) for e in events]
        _SSEHandler.events = event_dicts
        _SSEHandler.live_queue = None
        self._server = HTTPServer((self.host, self.port), _SSEHandler)

        print(f"\n  💬 Maia TeamChat")
        print(f"  http://{self.host}:{self.port}")
        print(f"  {len(events)} events loaded\n")

        if self.open_browser:
            webbrowser.open(f"http://{self.host}:{self.port}")

        try:
            await asyncio.get_event_loop().run_in_executor(None, self._server.serve_forever)
        except KeyboardInterrupt:
            self.stop()

    def start(self) -> None:
        """Start in live mode. Push events with push()."""
        self._queue = asyncio.Queue()
        _SSEHandler.events = []
        _SSEHandler.live_queue = self._queue
        self._server = HTTPServer((self.host, self.port), _SSEHandler)
        self._thread = Thread(target=self._server.serve_forever, daemon=True)
        self._thread.start()

        print(f"\n  💬 Maia TeamChat (live)")
        print(f"  http://{self.host}:{self.port}\n")

        if self.open_browser:
            webbrowser.open(f"http://{self.host}:{self.port}")

    def push(self, event: ACPEvent | dict[str, Any]) -> None:
        """Push a live event."""
        if self._queue is None:
            raise RuntimeError("Not started in live mode. Call start() first.")
        event_dict = event.model_dump() if hasattr(event, "model_dump") else (vars(event) if not isinstance(event, dict) else event)
        _SSEHandler.events.append(event_dict)
        self._queue.put_nowait(event_dict)

    def stop(self) -> None:
        if self._queue:
            self._queue.put_nowait(None)
        if self._server:
            self._server.shutdown()
        self._server = None
        self._thread = None
        self._queue = None