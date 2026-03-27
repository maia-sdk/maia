"""maia-brain — Multi-agent orchestration runtime.

Usage:
    from maia_brain import Brain, BrainConfig, LLMConfig, ResearchConfig

    brain = Brain(BrainConfig(
        llm=LLMConfig(api_key="sk-...", model="gpt-4o-mini"),
        research=ResearchConfig(
            depth=3,
            search_count=10,
            prefer_sources=["wikipedia.org", "arxiv.org"],
            block_sources=["reddit.com", "twitter.com"],
        ),
    ))

    result = await brain.run("Analyze SaaS pricing trends")
    print(result.output)
"""

from maia_brain.brain import Brain
from maia_brain.types import (
    BrainConfig,
    BrainResult,
    BrainStep,
    LLMConfig,
    LLMResult,
    ResearchConfig,
    AgentDefinition,
)
from maia_brain.roles import get_role, get_all_roles, infer_role, AgentRole
from maia_brain.memory import MemoryStore, MemoryEntry
from maia_brain.llm import call_llm, call_llm_json
from maia_brain.collaboration import (
    CollaborationContext,
    CollaborationParticipant,
    ConversationMove,
    MessageDraft,
    MoveSuggestionResult,
    MessageDraftResult,
    ThreadDigest,
    ThreadDigestResult,
    suggest_conversation_move,
    draft_conversation_message,
    summarize_conversation_thread,
)
from maia_brain.provenance import (
    build_provenance_graph,
    detect_contradictions,
    extract_claims_from_text,
    stale_claims,
)
from maia_brain.challenge import (
    ChallengeResolutionResult,
    challenge_claim,
    resolve_challenge,
)
from maia_brain.research import brave_search, filter_results, SearchResult
from maia_brain.env import load_env, resolve_api_key

__version__ = "0.1.0"
__all__ = [
    "Brain",
    "BrainConfig",
    "BrainResult",
    "BrainStep",
    "LLMConfig",
    "LLMResult",
    "ResearchConfig",
    "AgentDefinition",
    "AgentRole",
    "MemoryStore",
    "MemoryEntry",
    "SearchResult",
    "CollaborationContext",
    "CollaborationParticipant",
    "ConversationMove",
    "MessageDraft",
    "MoveSuggestionResult",
    "MessageDraftResult",
    "ThreadDigest",
    "ThreadDigestResult",
    "get_role",
    "get_all_roles",
    "infer_role",
    "call_llm",
    "call_llm_json",
    "suggest_conversation_move",
    "draft_conversation_message",
    "summarize_conversation_thread",
    "build_provenance_graph",
    "detect_contradictions",
    "extract_claims_from_text",
    "stale_claims",
    "ChallengeResolutionResult",
    "challenge_claim",
    "resolve_challenge",
    "brave_search",
    "filter_results",
]
