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

`maia-sdk` includes Python `Theatre` and `TeamChat`, so these imports work from the default install:

```python
from maia_sdk import Theatre, TeamChat
```

## Quick Start

### 1. Emit ACP events from your agent

```python
from maia_sdk import ACPClient, message

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

### 2. Serve Theatre from Python

```python
from maia_sdk import Theatre

async def replay(events):
    theatre = Theatre(port=8765)
    await theatre.serve(events)
```

### 3. Serve TeamChat from Python

```python
from maia_sdk import TeamChat

chat = TeamChat(port=8766)
chat.start()
chat.push(event)
```

### 4. Wrap existing frameworks

```python
from maia_sdk.adapters.langchain import ACPLangChainAdapter
from maia_sdk.adapters.crewai import ACPCrewAIAdapter
from maia_sdk.adapters.autogen import ACPAutoGenAdapter
```

## What's Inside

| Module | What it does |
|--------|-------------|
| `maia_sdk` | ACP protocol, Theatre export, TeamChat export, client, builders, SSE stream |
| `maia_sdk.adapters.langchain` | Wrap LangChain agents |
| `maia_sdk.adapters.crewai` | Wrap CrewAI crews |
| `maia_sdk.adapters.autogen` | Wrap AutoGen group chats |

## JS vs Python capability parity

| Capability | JavaScript SDK | Python SDK |
|---|---|---|
| ACP protocol, builders, stream parsing | Yes | Yes |
| Theatre UI surface | Yes, React components | Yes, HTTP server export via `Theatre` |
| Team chat UI surface | Yes, React components | Yes, HTTP server export via `TeamChat` |
| Brain orchestration helpers | Yes | Yes, but different API shape |
| Computer-use Maia runtime client | Yes | Not yet parity |
| Theme/custom component composition | Yes | No |

Python and JS now share the same high-level Theatre and TeamChat concepts, but they are not full API-parity SDKs yet.

## Architecture

```text
Your Agent  -->  maia-sdk  -->  ACP Events (SSE)  -->  Maia UI
```

## License

MIT - Free and open source.
