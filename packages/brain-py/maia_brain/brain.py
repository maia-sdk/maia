"""Brain — multi-agent orchestration runtime.

Usage:
    from maia_brain import Brain, BrainConfig, LLMConfig

    brain = Brain(BrainConfig(
        llm=LLMConfig(api_key="sk-...", model="gpt-4o-mini"),
    ))
    result = await brain.run("Analyze SaaS pricing trends")
"""

from __future__ import annotations

import time
from typing import Any, Callable

from maia_acp import envelope, message, handoff, review, activity, capabilities, ACPEvent

from maia_brain.types import BrainConfig, BrainResult, BrainStep, LLMResult
from maia_brain.llm import call_llm, call_llm_json
from maia_brain.env import resolve_api_key
from maia_brain.roles import get_all_roles, infer_role
from maia_brain.memory import MemoryStore
from maia_brain.research import brave_search, filter_results, resolve_research_strategy


class Brain:
    """Multi-agent orchestrator. Plans, delegates, executes, reviews."""

    def __init__(self, config: BrainConfig) -> None:
        # Resolve API key from env if needed
        config.llm.api_key = resolve_api_key(config.llm.api_key)
        self.config = config
        self.memory = MemoryStore()
        self._events: list[ACPEvent] = []
        self._run_id = ""
        self._total_cost = 0.0
        self._total_tokens = 0
        self._on_event: Callable[[ACPEvent], None] | None = None

    async def run(self, goal: str, on_event: Callable[[ACPEvent], None] | None = None) -> BrainResult:
        """Execute a multi-agent task. Returns the final result."""
        self._run_id = f"run_{int(time.time())}_{id(self)}"
        self._events = []
        self._total_cost = 0.0
        self._total_tokens = 0
        self._on_event = on_event

        steps: list[BrainStep] = []

        # Resolve agents — auto-assemble if empty
        agents = self.config.agents
        if not agents:
            roles = get_all_roles()
            # Default team: researcher, analyst, writer
            agents = []  # Brain auto-selects based on task

        # Phase 1: Plan
        self._emit("agent://brain", "event", activity(
            agent_id="agent://brain", activity_type="thinking", detail="Planning task breakdown...",
        ))

        plan_result = await self._call_llm(
            "You are a team orchestrator. Plan this task. Output a JSON array: [{\"agent\":\"researcher|analyst|writer\",\"task\":\"...\"}]",
            f"Task: {goal}",
        )

        import json, re
        try:
            match = re.search(r"\[[\s\S]*\]", plan_result.content)
            plan = json.loads(match.group()) if match else []
        except Exception:
            plan = [
                {"agent": "researcher", "task": f"Research: {goal}"},
                {"agent": "analyst", "task": "Analyze findings"},
                {"agent": "writer", "task": "Write summary"},
            ]

        if not plan:
            plan = [{"agent": "researcher", "task": f"Research: {goal}"}]

        # Execute each step
        context_so_far = ""
        for i, step_plan in enumerate(plan):
            agent_role = infer_role(step_plan.get("agent", "researcher"))
            agent_id = f"agent://{agent_role.id}" if agent_role else "agent://researcher"
            agent_name = agent_role.name if agent_role else "Agent"
            task = step_plan.get("task", goal)

            self._emit(agent_id, "event", activity(
                agent_id=agent_id, activity_type="thinking", detail=f"Working on: {task[:80]}",
            ))

            # If researcher, do web search
            search_context = ""
            if agent_role and agent_role.id in ("researcher", "browser"):
                strategy = await resolve_research_strategy(
                    self.config.research, task,
                    lambda sys, usr: self._call_llm(sys, usr),
                )
                results = await brave_search(
                    goal, count=strategy["search_count"],
                    api_key=self.config.research.search_api_key,
                )
                results = filter_results(results, strategy["prefer_sources"], strategy["block_sources"])
                search_context = "\n".join(f"- {r.title}: {r.snippet} ({r.url})" for r in results)

            # LLM call for this step
            prompt = f"Task: {task}"
            if search_context:
                prompt += f"\n\nWeb search results:\n{search_context}"
            if context_so_far:
                prompt += f"\n\nPrevious work:\n{context_so_far}"

            step_result = await self._call_llm(
                f"You are {agent_name}. Complete the assigned task. Be specific and data-driven.",
                prompt,
            )

            # Record step
            step = BrainStep(
                agent_id=agent_id, agent_name=agent_name, task=task,
                output=step_result.content, tokens=step_result.tokens, cost=step_result.cost,
            )
            steps.append(step)
            context_so_far += f"\n\n{agent_name}: {step_result.content}"

            self._emit(agent_id, "message", message(
                from_agent=agent_id, to="agent://brain",
                intent="inform", content=step_result.content, mood="confident",
            ))

            # Memory
            self.memory.record(f"step_{i}", step_result.content, agent_id=agent_id, run_id=self._run_id)

        # Final output is the last step's content
        output = steps[-1].output if steps else ""

        return BrainResult(
            output=output,
            steps=steps,
            total_cost_usd=self._total_cost,
            total_tokens=self._total_tokens,
            run_id=self._run_id,
            events=[e.model_dump() if hasattr(e, "model_dump") else vars(e) for e in self._events],
        )

    async def _call_llm(self, system_prompt: str, user_prompt: str) -> LLMResult:
        result = await call_llm(self.config.llm, system_prompt, user_prompt)
        self._total_cost += result.cost
        self._total_tokens += result.tokens
        return result

    def _emit(self, agent_id: str, event_type: str, payload: Any) -> ACPEvent:
        event = envelope(agent_id, self._run_id, event_type, payload)
        self._events.append(event)
        if self._on_event:
            self._on_event(event)
        return event