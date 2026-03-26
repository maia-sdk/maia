"""Maia SDK - the collaboration and observability layer for AI agents.

One import, everything you need.

Quick start:

    from maia_sdk import ACPClient, Theatre, TeamChat, message, handoff, review

    client = ACPClient(agent_id="agent://researcher")
    msg = message(
        from_agent="agent://researcher",
        to="agent://analyst",
        intent="challenge",
        content="Can you verify the revenue figures?",
    )

Framework adapters:

    from maia_sdk.adapters import langchain, crewai, autogen
"""

__version__ = "0.1.0"

from maia_acp import (
    ACPEvent,
    ACPMessage,
    ACPHandoff,
    ACPReview,
    ACPArtifact,
    ACPActivity,
    ACPCapabilities,
    HandoffTask,
    ReviewIssue,
    AgentPersonality,
    AgentSkill,
    ToolActivity,
    BrowserActivity,
    ProgressInfo,
    CostInfo,
    envelope,
    message,
    handoff,
    review,
    artifact,
    activity,
    capabilities,
    ACPClient,
    parse_sse_line,
    stream_events,
    connect_sse,
)
from maia_teamchat import TeamChat
from maia_theatre import Theatre

__all__ = [
    "ACPEvent",
    "ACPMessage",
    "ACPHandoff",
    "ACPReview",
    "ACPArtifact",
    "ACPActivity",
    "ACPCapabilities",
    "HandoffTask",
    "ReviewIssue",
    "AgentPersonality",
    "AgentSkill",
    "ToolActivity",
    "BrowserActivity",
    "ProgressInfo",
    "CostInfo",
    "envelope",
    "message",
    "handoff",
    "review",
    "artifact",
    "activity",
    "capabilities",
    "ACPClient",
    "parse_sse_line",
    "stream_events",
    "connect_sse",
    "TeamChat",
    "Theatre",
]
