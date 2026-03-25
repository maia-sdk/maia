# maia-cli

Maia CLI for Python — stream, replay, validate, and serve ACP agent events from the terminal.

## Install

```bash
pip install maia-cli
```

## Commands

```bash
# Watch agents live
maia stream http://localhost:8765/acp/events

# Replay recorded events at 4x speed
maia replay events.jsonl --speed 4

# Validate event format
maia validate events.jsonl

# Send a test event
maia emit http://localhost:8765/acp/events

# Scaffold a new ACP project
maia init my-agent

# Serve a JSONL file as a live SSE endpoint
maia serve events.jsonl

# Show version and environment
maia info
```

## License

MIT — [github.com/maia-sdk/maia](https://github.com/maia-sdk/maia)