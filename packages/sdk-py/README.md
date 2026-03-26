# maia-sdk

> The collaboration and observability layer for AI agents. One install, everything you need.

## Install

```bash
pip install maia-sdk
```

With framework adapters:

```bash
pip install maia-sdk[langchain]   # LangChain support
pip install maia-sdk[crewai]      # CrewAI support
pip install maia-sdk[autogen]     # AutoGen support
pip install maia-sdk[all]         # Everything
```

`maia-sdk` includes Python `TeamChat`, so `from maia_sdk import TeamChat` works from the default install.

## Quick Start

### 1. Emit ACP events from your agent

```python
from maia_sdk import ACPClient, message, activity, envelope

client = ACPClient(agent_id="agent://researcher")

msg = message(
    from_agent="agent://researcher",
    to="agent://analyst",
    intent="challenge",
    content="The 34% growth figure needs verification.",
    mood="concerned",
)

event = client.emit_message(msg)
print(event.model_dump_json())
```

### 2. Listen to a live stream

```python
from maia_sdk import ACPClient

client = ACPClient(agent_id="agent://observer")
client.connect("http://localhost:8000/acp/events")

@client.on("message")
def on_message(event):
    msg = event.as_message()
    print(f"{msg.from_agent}: {msg.content}")

@client.on("review")
def on_review(event):
    rev = event.as_review()
    print(f"Review: {rev.verdict} - {rev.feedback}")
```

### 3. Wrap existing frameworks

```python
from maia_sdk.adapters.langchain import ACPLangChainAdapter
from maia_sdk.adapters.crewai import ACPCrewAIAdapter
from maia_sdk.adapters.autogen import ACPAutoGenAdapter
```

### 4. Serve events as SSE (for Theatre)

```python
from fastapi import FastAPI
from fastapi.responses import StreamingResponse
from maia_sdk import envelope, message

app = FastAPI()

@app.get("/acp/events")
async def stream_events():
    def generate():
        ev = envelope(
            "agent://researcher", "run_1", "message",
            message(
                from_agent="agent://researcher",
                to="agent://analyst",
                intent="propose",
                content="Found 3 key trends in the data.",
            ),
        )
        yield f"data: {ev.model_dump_json()}\n\n"

    return StreamingResponse(generate(), media_type="text/event-stream")
```

### 5. Serve TeamChat from Python

```python
from maia_sdk import TeamChat

chat = TeamChat(port=8766)
chat.start()
chat.push(event)
```

## What's Inside

| Module | What it does |
|--------|-------------|
| `maia_sdk` | ACP protocol, TeamChat export, client, builders, SSE stream |
| `maia_sdk.adapters.langchain` | Wrap LangChain agents |
| `maia_sdk.adapters.crewai` | Wrap CrewAI crews |
| `maia_sdk.adapters.autogen` | Wrap AutoGen group chats |

## Architecture

```text
Your Agent  -->  maia-sdk  -->  ACP Events (SSE)  -->  Maia UI
```

## License

MIT - Free and open source.
