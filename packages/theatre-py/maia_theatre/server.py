"""Theatre server — serves the full Theatre UI over HTTP with SSE event streaming.

Usage:
    from maia_theatre import Theatre

    theatre = Theatre(port=8765)
    await theatre.serve(events)  # opens browser, streams events to Theatre UI

    # Or stream live events:
    theatre = Theatre(port=8765)
    theatre.start()
    theatre.push(event)  # push events one at a time
    theatre.push(event2)
    theatre.stop()
"""

from __future__ import annotations

import asyncio
import json
import os
import webbrowser
from http.server import HTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
from threading import Thread
from typing import Any

from maia_acp import ACPEvent

STATIC_DIR = Path(__file__).parent / "static"


class _SSEHandler(SimpleHTTPRequestHandler):
    """HTTP handler that serves static files and SSE event stream."""

    events: list[dict[str, Any]] = []
    live_queue: asyncio.Queue | None = None

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        kwargs["directory"] = str(STATIC_DIR)
        super().__init__(*args, **kwargs)

    def do_GET(self) -> None:
        if self.path == "/acp/events":
            self._handle_sse()
        elif self.path == "/health":
            self._json_response({"status": "ok", "events": len(self.events)})
        else:
            super().do_GET()

    def _handle_sse(self) -> None:
        self.send_response(200)
        self.send_header("Content-Type", "text/event-stream")
        self.send_header("Cache-Control", "no-cache")
        self.send_header("Connection", "keep-alive")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()

        # Send all existing events
        for event in self.events:
            self.wfile.write(f"data: {json.dumps(event)}\n\n".encode())
            self.wfile.flush()

        # If live mode, keep connection open and stream new events
        if self.live_queue is not None:
            try:
                while True:
                    # Poll for new events (blocking with timeout)
                    import time
                    time.sleep(0.1)
                    while not self.live_queue.empty():
                        event = self.live_queue.get_nowait()
                        if event is None:  # Sentinel to stop
                            self.wfile.write(b"data: [DONE]\n\n")
                            self.wfile.flush()
                            return
                        self.wfile.write(f"data: {json.dumps(event)}\n\n".encode())
                        self.wfile.flush()
            except (BrokenPipeError, ConnectionResetError):
                pass

        self.wfile.write(b"data: [DONE]\n\n")
        self.wfile.flush()

    def _json_response(self, data: dict[str, Any]) -> None:
        body = json.dumps(data).encode()
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, format: str, *args: Any) -> None:
        pass  # Suppress default logging


class Theatre:
    """Serve the Theatre UI from Python.

    Args:
        port: HTTP port (default 8765)
        open_browser: Auto-open browser (default True)
        host: Bind address (default "localhost")
    """

    def __init__(self, port: int = 8765, open_browser: bool = True, host: str = "localhost") -> None:
        self.port = port
        self.host = host
        self.open_browser = open_browser
        self._server: HTTPServer | None = None
        self._thread: Thread | None = None
        self._queue: asyncio.Queue | None = None

    async def serve(self, events: list[ACPEvent | dict[str, Any]]) -> None:
        """Serve pre-recorded events. Opens browser and blocks until Ctrl+C."""
        event_dicts = [e.model_dump() if hasattr(e, "model_dump") else (vars(e) if not isinstance(e, dict) else e) for e in events]
        _SSEHandler.events = event_dicts
        _SSEHandler.live_queue = None

        self._start_server()
        print(f"\n  🎭 Maia Theatre")
        print(f"  http://{self.host}:{self.port}")
        print(f"  {len(events)} events loaded\n")

        if self.open_browser:
            webbrowser.open(f"http://{self.host}:{self.port}")

        try:
            await asyncio.get_event_loop().run_in_executor(None, self._server.serve_forever)
        except KeyboardInterrupt:
            self.stop()

    def start(self) -> None:
        """Start the Theatre server in live mode. Push events with push()."""
        self._queue = asyncio.Queue()
        _SSEHandler.events = []
        _SSEHandler.live_queue = self._queue

        self._start_server()
        self._thread = Thread(target=self._server.serve_forever, daemon=True)
        self._thread.start()

        print(f"\n  🎭 Maia Theatre (live)")
        print(f"  http://{self.host}:{self.port}\n")

        if self.open_browser:
            webbrowser.open(f"http://{self.host}:{self.port}")

    def push(self, event: ACPEvent | dict[str, Any]) -> None:
        """Push a live event to all connected Theatre clients."""
        if self._queue is None:
            raise RuntimeError("Theatre not started in live mode. Call start() first.")
        event_dict = event.model_dump() if hasattr(event, "model_dump") else (vars(event) if not isinstance(event, dict) else event)
        _SSEHandler.events.append(event_dict)
        self._queue.put_nowait(event_dict)

    def stop(self) -> None:
        """Stop the Theatre server."""
        if self._queue:
            self._queue.put_nowait(None)  # Sentinel
        if self._server:
            self._server.shutdown()
            self._server = None
        self._thread = None
        self._queue = None

    def _start_server(self) -> None:
        self._server = HTTPServer((self.host, self.port), _SSEHandler)