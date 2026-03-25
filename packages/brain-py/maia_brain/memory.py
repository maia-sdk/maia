"""Cross-run agent memory — stores decisions and context between runs."""

from __future__ import annotations

import time
from typing import Any
from dataclasses import dataclass, field


@dataclass
class MemoryEntry:
    key: str
    content: str
    agent_id: str
    run_id: str
    timestamp: float = field(default_factory=time.time)
    metadata: dict[str, Any] = field(default_factory=dict)


class MemoryStore:
    """Simple in-memory store for agent memories. Pluggable backend."""

    def __init__(self, max_entries: int = 500) -> None:
        self._entries: list[MemoryEntry] = []
        self._max = max_entries

    def record(self, key: str, content: str, agent_id: str = "", run_id: str = "", **metadata: Any) -> MemoryEntry:
        """Store a memory entry."""
        entry = MemoryEntry(key=key, content=content, agent_id=agent_id, run_id=run_id, metadata=metadata)
        self._entries.append(entry)
        if len(self._entries) > self._max:
            self._entries = self._entries[-self._max:]
        return entry

    def recall(self, query: str = "", agent_id: str = "", limit: int = 10) -> list[MemoryEntry]:
        """Recall memories matching query and/or agent_id."""
        results = self._entries
        if agent_id:
            results = [e for e in results if e.agent_id == agent_id]
        if query:
            q = query.lower()
            results = [e for e in results if q in e.content.lower() or q in e.key.lower()]
        return results[-limit:]

    def clear(self) -> None:
        self._entries.clear()

    @property
    def count(self) -> int:
        return len(self._entries)