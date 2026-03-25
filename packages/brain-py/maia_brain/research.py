"""Research orchestration — web search, source filtering, page extraction."""

from __future__ import annotations

from typing import Any
from dataclasses import dataclass

import httpx

from maia_brain.types import ResearchConfig

_DEFAULT_BRAVE_KEY = "BSA2dv5on3gPCMpb3rlI3jFSQ6cLMGN"


@dataclass
class SearchResult:
    title: str
    url: str
    snippet: str


async def brave_search(query: str, count: int = 5, api_key: str = "") -> list[SearchResult]:
    """Search the web using Brave Search API."""
    key = api_key or _DEFAULT_BRAVE_KEY
    url = f"https://api.search.brave.com/res/v1/web/search?q={query}&count={min(20, max(3, count))}"

    async with httpx.AsyncClient(timeout=15.0) as client:
        try:
            resp = await client.get(url, headers={"Accept": "application/json", "X-Subscription-Token": key})
            resp.raise_for_status()
            data = resp.json()
            return [
                SearchResult(title=r.get("title", ""), url=r.get("url", ""), snippet=r.get("description", ""))
                for r in (data.get("web", {}).get("results", []))[:count]
            ]
        except Exception:
            return []


def filter_results(
    results: list[SearchResult],
    prefer: list[str] | None = None,
    block: list[str] | None = None,
) -> list[SearchResult]:
    """Filter and sort search results by preference/block lists."""
    filtered = results

    # Remove blocked domains
    if block:
        filtered = [r for r in filtered if not any(d in r.url for d in block)]

    # Sort preferred domains first
    if prefer:
        def score(r: SearchResult) -> int:
            return 0 if any(d in r.url for d in prefer) else 1
        filtered.sort(key=score)

    return filtered


async def resolve_research_strategy(
    config: ResearchConfig,
    task: str,
    call_llm_fn: Any,
) -> dict[str, Any]:
    """If config has auto values (0 or empty), ask the LLM to decide."""
    needs_auto = (
        config.depth == 0
        or config.search_count == 0
        or (not config.prefer_sources and not config.block_sources)
    )

    if not needs_auto:
        return {
            "depth": config.depth,
            "search_count": config.search_count,
            "prefer_sources": config.prefer_sources,
            "block_sources": config.block_sources,
        }

    # Ask Brain to decide
    result = await call_llm_fn(
        "You decide research strategy. Output JSON only.",
        f'Task: "{task}"\n'
        f"Current: depth={config.depth}, search_count={config.search_count}\n"
        "Output JSON: {\"depth\": N, \"search_count\": N, \"prefer_sources\": [...], \"block_sources\": [...]}"
    )

    import json, re
    try:
        match = re.search(r"\{[\s\S]*\}", result.content)
        strat = json.loads(match.group()) if match else {}
    except Exception:
        strat = {}

    return {
        "depth": config.depth or min(10, max(1, strat.get("depth", 2))),
        "search_count": config.search_count or min(20, max(3, strat.get("search_count", 5))),
        "prefer_sources": config.prefer_sources or strat.get("prefer_sources", []),
        "block_sources": config.block_sources or strat.get("block_sources", []),
    }