# @maia/cli

Maia CLI for Node.js — stream, replay, and validate ACP agent events from the terminal.

## Install

```bash
npm install -g @maia/cli
```

## Commands

```bash
# Watch agents live
maia stream http://localhost:8765/acp/events

# Replay recorded events at 4x speed
maia replay events.jsonl --speed 4

# Validate event format
maia validate events.jsonl

# Show version and environment
maia info
```

## License

MIT — [github.com/maia-sdk/maia](https://github.com/maia-sdk/maia)