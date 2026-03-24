# CLI Reference

## Install

```bash
pip install maia-cli
```

## Commands

### maia stream

Connect to a live ACP stream and render events in the terminal.

```bash
maia stream http://localhost:8000/acp/events
maia stream http://localhost:8000/acp/events --raw
maia stream http://localhost:8000/acp/events --save events.jsonl
```

| Flag | Description |
|------|-------------|
| `--raw` | Output raw JSON instead of formatted |
| `--save FILE` | Save events to a JSONL file while streaming |

### maia replay

Replay a recorded JSONL run with real timing.

```bash
maia replay events.jsonl
maia replay events.jsonl --speed 4
maia replay events.jsonl --raw
```

| Flag | Description |
|------|-------------|
| `--speed N` | Playback speed multiplier (default: 1.0) |
| `--raw` | Output raw JSON |

### maia validate

Validate ACP events against the schema.

```bash
maia validate events.jsonl
```

Checks:
- Valid JSON on each line
- Required fields: `acp_version`, `run_id`, `agent_id`, `event_type`, `timestamp`, `payload`
- Valid event types: `message`, `handoff`, `review`, `artifact`, `event`, `capabilities`
- Agent ID format: `agent://...`

Exit code 1 if any events are invalid.

### maia emit

Send a test ACP event to an endpoint.

```bash
maia emit http://localhost:8000/acp/events
maia emit http://localhost:8000/acp/events --from agent://tester --content "Testing!"
```

| Flag | Description |
|------|-------------|
| `--from ID` | Sender agent ID (default: `agent://cli-test`) |
| `--to ID` | Recipient (default: `agent://broadcast`) |
| `--intent` | Message intent (default: `propose`) |
| `--content` | Message text (default: `Hello from Maia CLI!`) |

### maia init

Scaffold a new ACP project.

```bash
maia init my-agent
```

Creates:
```
my-agent/
  agent.py      # Your agent code
  server.py     # SSE server
  events/       # Recorded runs
  README.md
```

### maia serve

Serve a JSONL file as a local SSE endpoint for Theatre.

```bash
maia serve events.jsonl
maia serve events.jsonl --port 9000 --speed 2
```

| Flag | Description |
|------|-------------|
| `--port N` | Port number (default: 8765) |
| `--speed N` | Playback speed (default: 1.0) |

Then point Theatre at `http://localhost:8765/acp/events`.

### maia info

Show version and environment info.

```bash
maia info
```

Shows: CLI version, SDK version, Python version, installed frameworks.