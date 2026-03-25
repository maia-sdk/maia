"""LLM caller — supports OpenAI and Anthropic with auto-detection."""

from __future__ import annotations

import json
from typing import Any

import httpx

from maia_brain.types import LLMConfig, LLMResult

# Cost per million tokens
_RATES: dict[str, dict[str, float]] = {
    "gpt-4o-mini": {"input": 0.15, "output": 0.6},
    "gpt-4o": {"input": 2.5, "output": 10},
    "claude-sonnet-4-20250514": {"input": 3, "output": 15},
    "claude-haiku-4-5-20251001": {"input": 0.8, "output": 4},
}


def _estimate_cost(model: str, input_tokens: int, output_tokens: int) -> float:
    rates = _RATES.get(model, _RATES["gpt-4o-mini"])
    return (input_tokens * rates["input"] + output_tokens * rates["output"]) / 1_000_000


def _detect_provider(config: LLMConfig) -> str:
    if config.provider and config.provider != "auto":
        return config.provider
    if config.api_key.startswith("sk-ant-"):
        return "anthropic"
    return "openai"


async def call_llm(config: LLMConfig, system_prompt: str, user_prompt: str) -> LLMResult:
    """Call an LLM and return the result."""
    provider = _detect_provider(config)

    async with httpx.AsyncClient(timeout=60.0) as client:
        if provider == "openai":
            base = config.base_url or "https://api.openai.com/v1"
            resp = await client.post(
                f"{base}/chat/completions",
                headers={"Authorization": f"Bearer {config.api_key}"},
                json={
                    k: v for k, v in {
                        "model": config.model,
                        "messages": [
                            {"role": "system", "content": system_prompt},
                            {"role": "user", "content": user_prompt},
                        ],
                        "temperature": config.temperature,
                        "max_tokens": config.max_tokens or None,
                    }.items() if v is not None
                },
            )
            resp.raise_for_status()
            data = resp.json()
            content = data["choices"][0]["message"]["content"]
            inp = data.get("usage", {}).get("prompt_tokens", 0)
            out = data.get("usage", {}).get("completion_tokens", 0)
            return LLMResult(content=content, tokens=inp + out, cost=_estimate_cost(config.model, inp, out))

        elif provider == "anthropic":
            resp = await client.post(
                "https://api.anthropic.com/v1/messages",
                headers={
                    "x-api-key": config.api_key,
                    "anthropic-version": "2023-06-01",
                    "Content-Type": "application/json",
                },
                json={
                    k: v for k, v in {
                        "model": config.model,
                        "max_tokens": config.max_tokens or 4096,
                        "system": system_prompt,
                    "messages": [{"role": "user", "content": user_prompt}],
                    }.items() if v is not None},
            )
            resp.raise_for_status()
            data = resp.json()
            content = data["content"][0]["text"] if data.get("content") else ""
            inp = data.get("usage", {}).get("input_tokens", 0)
            out = data.get("usage", {}).get("output_tokens", 0)
            return LLMResult(content=content, tokens=inp + out, cost=_estimate_cost(config.model, inp, out))

        else:
            raise ValueError(f"Unknown provider: {provider}")


async def call_llm_json(config: LLMConfig, system_prompt: str, user_prompt: str) -> dict[str, Any]:
    """Call LLM and parse JSON from the response."""
    result = await call_llm(config, system_prompt, user_prompt)
    try:
        # Find JSON in the response
        import re
        match = re.search(r"[\[{][\s\S]*[\]}]", result.content)
        if match:
            return json.loads(match.group())
    except (json.JSONDecodeError, AttributeError):
        pass
    return {}