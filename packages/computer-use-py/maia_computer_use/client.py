from __future__ import annotations

import json
from dataclasses import asdict
from typing import Callable, Iterator, Any

from maia_computer_use.core import request_json, stream_lines
from maia_computer_use.types import (
    ComputerUseActiveModelResponse,
    ComputerUseClientConfig,
    ComputerUsePolicyResponse,
    ComputerUseSessionListRecord,
    ComputerUseSessionRecord,
    ComputerUseSLOSummaryResponse,
    ComputerUseStreamEvent,
    NavigateComputerUseSessionResponse,
    StartComputerUseSessionInput,
    StartComputerUseSessionResponse,
    StreamComputerUseSessionOptions,
)


class ComputerUseClient:
    def __init__(self, config: ComputerUseClientConfig | None = None) -> None:
        self.config = config or ComputerUseClientConfig()

    def start_session(self, body: StartComputerUseSessionInput | dict[str, Any]) -> StartComputerUseSessionResponse:
        payload = body if isinstance(body, StartComputerUseSessionInput) else StartComputerUseSessionInput(**body)
        query = f"?request_id={payload.request_id}" if payload.request_id else ""
        data = request_json(self.config, "POST", f"/api/computer-use/sessions{query}", json_body={"url": payload.url})
        return StartComputerUseSessionResponse(**data)

    def get_session(self, session_id: str) -> ComputerUseSessionRecord:
        data = request_json(self.config, "GET", f"/api/computer-use/sessions/{session_id}")
        return ComputerUseSessionRecord(**data)

    def list_sessions(self) -> list[ComputerUseSessionListRecord]:
        data = request_json(self.config, "GET", "/api/computer-use/sessions")
        return [ComputerUseSessionListRecord(**item) for item in (data or [])]

    def navigate_session(self, session_id: str, url: str) -> NavigateComputerUseSessionResponse:
        data = request_json(
            self.config,
            "POST",
            f"/api/computer-use/sessions/{session_id}/navigate",
            json_body={"url": url},
        )
        return NavigateComputerUseSessionResponse(**data)

    def cancel_session(self, session_id: str) -> None:
        request_json(self.config, "DELETE", f"/api/computer-use/sessions/{session_id}")

    def get_active_model(self) -> ComputerUseActiveModelResponse:
        data = request_json(self.config, "GET", "/api/computer-use/active-model")
        return ComputerUseActiveModelResponse(**data)

    def get_policy(self) -> ComputerUsePolicyResponse:
        data = request_json(self.config, "GET", "/api/computer-use/policy")
        return ComputerUsePolicyResponse(**data)

    def get_slo_summary(self, window_seconds: int | None = None) -> ComputerUseSLOSummaryResponse:
        path = "/api/computer-use/slo/summary"
        if isinstance(window_seconds, int):
            path = f"{path}?window_seconds={window_seconds}"
        data = request_json(self.config, "GET", path)
        return ComputerUseSLOSummaryResponse(**data)

    def stream_session(
        self,
        session_id: str,
        options: StreamComputerUseSessionOptions | dict[str, Any],
        *,
        on_event: Callable[[ComputerUseStreamEvent], None] | None = None,
        on_done: Callable[[], None] | None = None,
        on_error: Callable[[Exception], None] | None = None,
    ) -> Iterator[ComputerUseStreamEvent]:
        params = options if isinstance(options, StreamComputerUseSessionOptions) else StreamComputerUseSessionOptions(**options)
        path = f"/api/computer-use/sessions/{session_id}/stream"
        query = {
            "task": params.task,
            "model": params.model,
            "max_iterations": params.max_iterations,
            "run_id": params.run_id,
        }
        try:
            with stream_lines(self.config, path, query) as response:
                response.raise_for_status()
                for raw_line in response.iter_lines():
                    line = str(raw_line or "").strip()
                    if not line or not line.startswith("data:"):
                        continue
                    chunk = line[5:].strip()
                    if chunk == "[DONE]":
                        if on_done:
                            on_done()
                        break
                    payload = json.loads(chunk)
                    event = ComputerUseStreamEvent(**payload)
                    if on_event:
                        on_event(event)
                    yield event
        except Exception as error:
            if on_error:
                on_error(error)
                return
            raise


def create_computer_use_client(config: ComputerUseClientConfig | None = None) -> ComputerUseClient:
    return ComputerUseClient(config)


_default_client = create_computer_use_client()


def start_computer_use_session(body: StartComputerUseSessionInput | dict[str, Any]) -> StartComputerUseSessionResponse:
    return _default_client.start_session(body)


def get_computer_use_session(session_id: str) -> ComputerUseSessionRecord:
    return _default_client.get_session(session_id)


def list_computer_use_sessions() -> list[ComputerUseSessionListRecord]:
    return _default_client.list_sessions()


def navigate_computer_use_session(session_id: str, url: str) -> NavigateComputerUseSessionResponse:
    return _default_client.navigate_session(session_id, url)


def cancel_computer_use_session(session_id: str) -> None:
    _default_client.cancel_session(session_id)


def get_computer_use_active_model() -> ComputerUseActiveModelResponse:
    return _default_client.get_active_model()


def get_computer_use_policy() -> ComputerUsePolicyResponse:
    return _default_client.get_policy()


def get_computer_use_slo_summary(window_seconds: int | None = None) -> ComputerUseSLOSummaryResponse:
    return _default_client.get_slo_summary(window_seconds)


def stream_computer_use_session(
    session_id: str,
    options: StreamComputerUseSessionOptions | dict[str, Any],
    *,
    on_event: Callable[[ComputerUseStreamEvent], None] | None = None,
    on_done: Callable[[], None] | None = None,
    on_error: Callable[[Exception], None] | None = None,
) -> Iterator[ComputerUseStreamEvent]:
    return _default_client.stream_session(
        session_id,
        options,
        on_event=on_event,
        on_done=on_done,
        on_error=on_error,
    )

