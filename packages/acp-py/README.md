# maia-acp

Agent Collaboration Protocol — Python client for agent-to-agent communication.

## Install

```bash
pip install maia-acp
```

## Quick Start

```python
from maia_acp import ACPClient, message, handoff, review

# Create a client
client = ACPClient(agent_id="agent://researcher")

# Build messages
msg = message(
    from_agent="agent://researcher",
    to="agent://analyst",
    intent="propose",
    content="Found 3 pricing trends.",
)

# Build handoffs
h = handoff(
    from_agent="agent://brain",
    to="agent://writer",
    task="Write a client-ready report",
)

# Build reviews
r = review(
    reviewer="agent://brain",
    author="agent://writer",
    verdict="revise",
    feedback="Add segment breakdown",
    score=0.75,
)
```

## SSE Streaming

```python
from maia_acp import parse_sse_line, stream_events

# Parse individual SSE lines
event = parse_sse_line('data: {"acp_version":"1.0",...}')

# Stream from an endpoint
async for event in stream_events("http://localhost:8765/acp/events"):
    print(event.event_type, event.payload)
```

## API

### Builders
- `message(from_agent, to, intent, content)` — agent-to-agent message
- `handoff(from_agent, to, task)` — delegate a task
- `review(reviewer, author, verdict)` — review work
- `artifact(kind, title, content)` — attach a file
- `activity(agent_id, activity, detail)` — log an action
- `capabilities(agent_id, name, skills)` — announce skills

### Client
- `ACPClient(agent_id)` — create a client
- `client.emit_message(msg)` — emit event
- `client.on("message", fn)` — listen for events

### Stream
- `parse_sse_line(line)` — parse one SSE line
- `stream_events(url)` — async generator of ACPEvents
- `connect_sse(url, on_event)` — connect to SSE endpoint

## License

MIT — [github.com/maia-sdk/maia](https://github.com/maia-sdk/maia)