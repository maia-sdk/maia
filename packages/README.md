# Maia SDK - Packages

> The collaboration and observability layer for AI agents.

## Packages

| Package | Description | Language |
|---------|-------------|----------|
| [`acp-spec`](./acp-spec/) | ACP v1 JSON Schema definitions | JSON Schema |
| [`acp-js`](./acp-js/) | `@maia/acp` - TypeScript/JS client | TypeScript |
| [`acp-py`](./acp-py/) | `maia-acp` - Python client | Python |
| [`theatre-react`](./theatre-react/) | `@maia/theatre` - React execution and desktop SDK | React/TypeScript |
| [`conversation-react`](./conversation-react/) | `@maia/conversation` - React multi-agent conversation UI | React/TypeScript |
| [`teamchat`](./teamchat/) | `@maia/teamchat` - legacy compatibility wrapper for conversation UI | React/TypeScript |
| [`connector-adapters`](./connector-adapters/) | Framework adapters (LangChain, CrewAI, AutoGen) | Python |

## Quick Start

### Watch agent execution (React)

```tsx
import { Theatre } from '@maia/theatre';

// Live mode - connect to any SSE stream
<Theatre streamUrl="/acp/events" />

// Replay mode - feed recorded events
<Theatre recordedEvents={events} />
```

### Render agent conversation (React)

```tsx
import { ConversationPanel } from '@maia/conversation';

<ConversationPanel rows={rows} loading={false} />
```

### Emit ACP events (Python)

```python
from maia_acp import ACPClient, message

client = ACPClient(agent_id="agent://researcher")

msg = message(
    from_agent="agent://researcher",
    to="agent://analyst",
    intent="challenge",
    content="The 34% growth figure needs verification."
)

event = client.emit_message(msg)
```

### Adapt existing frameworks

```python
from maia_acp.adapters.langchain import ACPLangChainAdapter
acp_agent = ACPLangChainAdapter(agent=my_langchain_agent, agent_id="agent://researcher")

from maia_acp.adapters.crewai import ACPCrewAIAdapter
acp_crew = ACPCrewAIAdapter(crew=my_crew)

from maia_acp.adapters.autogen import ACPAutoGenAdapter
acp_chat = ACPAutoGenAdapter(group_chat=my_group_chat)
```

## Architecture

```text
MCP   --> Tools        (Anthropic - how agents use tools)
ACP   --> Agents       (Maia - how agents talk to each other)
AG-UI --> UI           (CopilotKit - how agents stream to frontends)
```

Theatre renders execution.
Conversation renders agent-to-agent chat, handoffs, and review loops.

## License

MIT
