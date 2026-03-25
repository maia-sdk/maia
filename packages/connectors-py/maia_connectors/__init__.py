"""maia-connectors — 49 pre-built SaaS connectors for AI agents.

Usage:
    from maia_connectors import get_connector, get_all_connectors

    gmail = get_connector("gmail")
    result = await gmail.execute("send_email", {"to": "user@test.com", "subject": "Hi"}, credentials)
"""

from maia_connectors.catalog import (
    get_connector,
    get_all_connectors,
    get_connector_ids,
    ConnectorDefinition,
    ConnectorTool,
)
from maia_connectors.base import BaseConnector

__version__ = "0.1.0"
__all__ = [
    "get_connector",
    "get_all_connectors",
    "get_connector_ids",
    "ConnectorDefinition",
    "ConnectorTool",
    "BaseConnector",
]