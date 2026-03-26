from __future__ import annotations

import os
from typing import Any
from urllib.parse import urlencode

import httpx

from maia_computer_use.types import ComputerUseClientConfig


def normalize_api_base(raw: str | None) -> str:
    return str(raw or "").strip().rstrip("/")


def sanitize_user_id(raw: str | None) -> str | None:
    value = str(raw or "").strip()
    return value or None


def infer_api_base(explicit_base: str | None = None) -> str:
    configured = normalize_api_base(explicit_base)
    if configured:
        return configured
    env_base = normalize_api_base(os.getenv("MAIA_API_BASE_URL"))
    if env_base:
        return env_base
    return "http://127.0.0.1:8000"


def infer_user_id(explicit_user_id: str | None = None) -> str | None:
    configured = sanitize_user_id(explicit_user_id)
    if configured:
        return configured
    return sanitize_user_id(os.getenv("MAIA_USER_ID"))


def with_user_id_query(path: str, user_id: str | None = None) -> str:
    resolved_user_id = infer_user_id(user_id)
    if not resolved_user_id or "user_id=" in path:
        return path
    separator = "&" if "?" in path else "?"
    return f"{path}{separator}user_id={resolved_user_id}"


def build_url(config: ComputerUseClientConfig, path: str) -> str:
    return f"{infer_api_base(config.api_base)}{with_user_id_query(path, config.user_id)}"


def build_headers(config: ComputerUseClientConfig, extra: dict[str, str] | None = None) -> dict[str, str]:
    headers = dict(config.headers or {})
    if extra:
        headers.update(extra)
    user_id = infer_user_id(config.user_id)
    if user_id and "Authorization" not in headers and "X-User-Id" not in headers:
        headers["X-User-Id"] = user_id
    return headers


def request_json(
    config: ComputerUseClientConfig,
    method: str,
    path: str,
    *,
    json_body: dict[str, Any] | None = None,
) -> Any:
    response = httpx.request(
        method,
        build_url(config, path),
        json=json_body,
        headers=build_headers(config, {"Content-Type": "application/json"} if json_body is not None else None),
        timeout=config.timeout_seconds,
    )
    response.raise_for_status()
    if response.status_code == 204 or not response.text.strip():
        return None
    return response.json()


def stream_lines(config: ComputerUseClientConfig, path: str, query: dict[str, Any]) -> Any:
    encoded_query = urlencode({k: v for k, v in query.items() if v is not None})
    url = build_url(config, f"{path}?{encoded_query}" if encoded_query else path)
    return httpx.stream("GET", url, headers=build_headers(config), timeout=None)
