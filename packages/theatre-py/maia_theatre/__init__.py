"""maia-theatre — Live agent visualization for Python.

Usage:
    from maia_theatre import Theatre

    # Replay recorded events
    theatre = Theatre(port=8765)
    await theatre.serve(events)

    # Or stream live events
    theatre = Theatre(port=8765)
    theatre.start()
    theatre.push(event)
    theatre.stop()
"""

from maia_theatre.server import Theatre

__version__ = "0.1.0"
__all__ = ["Theatre"]