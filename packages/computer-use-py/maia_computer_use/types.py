from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any


@dataclass(slots=True)
class ComputerUseClientConfig:
    api_base: str | None = None
    user_id: str | None = None
    headers: dict[str, str] = field(default_factory=dict)
    timeout_seconds: float = 60.0


@dataclass(slots=True)
class StartComputerUseSessionInput:
    url: str
    request_id: str | None = None


@dataclass(slots=True)
class StartComputerUseSessionResponse:
    session_id: str
    url: str


@dataclass(slots=True)
class ComputerUseSessionRecord:
    session_id: str
    url: str
    viewport: dict[str, Any] | None = None


@dataclass(slots=True)
class ComputerUseSessionListRecord:
    session_id: str
    user_id: str
    start_url: str
    status: str
    live: bool
    date_created: str
    date_closed: str | None = None


@dataclass(slots=True)
class NavigateComputerUseSessionResponse:
    session_id: str
    url: str
    title: str


@dataclass(slots=True)
class ComputerUseActiveModelResponse:
    model: str
    source: str


@dataclass(slots=True)
class ComputerUsePolicyResponse:
    mode: str
    max_task_chars: int
    blocked_terms_count: int
    blocked_terms_preview: list[str]


@dataclass(slots=True)
class ComputerUseSLOSummaryResponse:
    window_seconds: int
    run_count: int
    success_rate: float
    error_rate: float
    p50_latency_ms: float
    p95_latency_ms: float
    p99_latency_ms: float
    avg_latency_ms: float
    avg_event_count: float
    avg_action_count: float
    status_counts: dict[str, int]


@dataclass(slots=True)
class ComputerUseStreamEvent:
    event_type: str
    iteration: int | None = None
    detail: str | None = None
    url: str | None = None
    screenshot_b64: str | None = None
    text: str | None = None
    action: str | None = None
    input: dict[str, Any] | None = None
    tool_id: str | None = None


@dataclass(slots=True)
class StreamComputerUseSessionOptions:
    task: str
    model: str | None = None
    max_iterations: int | None = None
    run_id: str | None = None
