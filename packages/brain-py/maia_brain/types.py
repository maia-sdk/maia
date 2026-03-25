"""Brain runtime types â€” configuration, results, steps, agents."""

from __future__ import annotations

from typing import Any, Callable
from pydantic import BaseModel, Field


class ResearchConfig(BaseModel):
    """Controls how agents search and browse the web."""
    depth: int = Field(0, description="Pages to visit. 0 = Brain decides.")
    search_count: int = Field(0, description="Results to fetch. 0 = Brain decides.")
    prefer_sources: list[str] = Field(default_factory=list, description="Domains to prioritize. Empty = Brain decides.")
    block_sources: list[str] = Field(default_factory=list, description="Domains to exclude. Empty = Brain decides.")
    search_api_key: str = Field("", description="Search API key (Brave). Empty = built-in.")
    search_provider: str = Field("brave", description="Search provider: brave, google, bing.")


class LLMConfig(BaseModel):
    """LLM provider configuration."""
    api_key: str = ""  # Auto-detects from .env or OPENAI_API_KEY/ANTHROPIC_API_KEY env vars
    model: str  # Required. e.g. "gpt-4o-mini", "claude-sonnet-4-20250514"
    provider: str = "auto"  # "auto" | "openai" | "anthropic" — auto-detects from API key
    base_url: str | None = None
    temperature: float | None = None  # None = provider default
    max_tokens: int = 0  # 0 = provider default. Developer decides.


class AgentDefinition(BaseModel):
    """An agent available to the Brain."""
    id: str
    name: str
    role: str
    instructions: str = ""
    tools: list[str] = Field(default_factory=list)
    personality: dict[str, Any] = Field(default_factory=dict)


class BrainConfig(BaseModel):
    """Configuration for the Brain orchestrator."""
    agents: list[AgentDefinition] = Field(default_factory=list, description="Pass [] to auto-assemble from built-in roles.")
    llm: LLMConfig
    research: ResearchConfig = Field(default_factory=ResearchConfig)
    max_review_rounds: int = Field(0, description="0 = no limit. Developer decides.")
    max_conversation_turns: int = Field(0, description="0 = no limit. Developer decides.")
    max_steps: int = Field(0, description="0 = no limit. Developer decides.")
    budget_usd: float = Field(0.0, description="0 = no limit. Developer decides.")


class LLMResult(BaseModel):
    """Result from an LLM call."""
    content: str
    tokens: int = 0
    cost: float = 0.0


class BrainStep(BaseModel):
    """A single step in the Brain's execution."""
    agent_id: str
    agent_name: str
    task: str
    output: str = ""
    tokens: int = 0
    cost: float = 0.0


class BrainResult(BaseModel):
    """Final result from a Brain.run() call."""
    output: str
    steps: list[BrainStep] = Field(default_factory=list)
    total_cost_usd: float = 0.0
    total_tokens: int = 0
    run_id: str = ""
    events: list[dict[str, Any]] = Field(default_factory=list)