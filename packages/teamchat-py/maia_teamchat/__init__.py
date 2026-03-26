"""maia-teamchat - legacy Python TeamChat server for Maia conversation UI.

Usage:
    from maia_teamchat import TeamChat

    chat = TeamChat(port=8766)
    await chat.serve(events)

    # Or live:
    chat = TeamChat(port=8766)
    chat.start()
    chat.push(event)
    chat.stop()

Prefer the JS `@maia/conversation` package for new conversation UI work.
"""

from maia_teamchat.server import TeamChat

__version__ = "0.1.0"
__all__ = ["TeamChat"]
