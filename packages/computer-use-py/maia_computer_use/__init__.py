"""maia-computer-use - Maia computer runtime client for Python.

Usage:
    from maia_computer_use import create_computer_use_client

    client = create_computer_use_client()
    session = client.start_session({"url": "https://example.com"})
    print(session.session_id)
"""

from maia_computer_use.client import (
    ComputerUseClient,
    cancel_computer_use_session,
    create_computer_use_client,
    get_computer_use_active_model,
    get_computer_use_policy,
    get_computer_use_session,
    get_computer_use_slo_summary,
    list_computer_use_sessions,
    navigate_computer_use_session,
    start_computer_use_session,
    stream_computer_use_session,
)
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

__version__ = "0.1.0"
__all__ = [
    "ComputerUseClient",
    "ComputerUseClientConfig",
    "StartComputerUseSessionInput",
    "StartComputerUseSessionResponse",
    "ComputerUseSessionRecord",
    "ComputerUseSessionListRecord",
    "NavigateComputerUseSessionResponse",
    "ComputerUseActiveModelResponse",
    "ComputerUsePolicyResponse",
    "ComputerUseSLOSummaryResponse",
    "ComputerUseStreamEvent",
    "StreamComputerUseSessionOptions",
    "create_computer_use_client",
    "start_computer_use_session",
    "get_computer_use_session",
    "list_computer_use_sessions",
    "navigate_computer_use_session",
    "cancel_computer_use_session",
    "get_computer_use_active_model",
    "get_computer_use_policy",
    "get_computer_use_slo_summary",
    "stream_computer_use_session",
]
