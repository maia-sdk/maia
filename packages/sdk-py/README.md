# maia-sdk

> The collaboration and observability layer for AI agents. One install, everything you need.

## Install

```bash
pip install maia-sdk
```

With framework adapters:

```bash
pip install maia-sdk[langchain]
pip install maia-sdk[crewai]
pip install maia-sdk[autogen]
pip install maia-sdk[all]
```

Default imports now include:

```python
from maia_sdk import Brain, Theatre, TeamChat, create_computer_use_client, get_connector
```

## Quick Start

### ACP

```python
from maia_sdk import ACPClient, message

client = ACPClient(agent_id="agent://researcher")
msg = message(
    from_agent="agent://researcher",
    to="agent://analyst",
    intent="challenge",
    content="The 34% growth figure needs verification.",
)
```

### Brain

```python
from maia_sdk import Brain, BrainConfig, LLMConfig

brain = Brain(
    BrainConfig(
        llm=LLMConfig(api_key="sk-...", model="gpt-4o-mini"),
    )
)
```

### Theatre

```python
from maia_sdk import Theatre

theatre = Theatre(port=8765)
```

### TeamChat

```python
from maia_sdk import TeamChat

chat = TeamChat(port=8766)
```

### Maia computer runtime

```python
from maia_sdk import create_computer_use_client

client = create_computer_use_client()
session = client.start_session({"url": "https://example.com"})
print(session.session_id)
```

### Connectors

```python
from maia_sdk import get_connector

gmail = get_connector("gmail")
```

## JS vs Python capability parity

| Capability | JavaScript SDK | Python SDK |
|---|---|---|
| ACP protocol, builders, stream parsing | Yes | Yes |
| Theatre UI surface | Yes, React components | Yes, HTTP server export via `Theatre` |
| Team chat UI surface | Yes, React components | Yes, HTTP server export via `TeamChat` |
| Brain orchestration | Yes | Yes, different API shape |
| Maia computer runtime client | Yes | Yes |
| Theme and component composition | Yes | No |

## License

MIT - Free and open source.
