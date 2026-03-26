# Maia SDK - Packages

> The collaboration and observability layer for AI agents.

## Packages

| Package | Description | Language |
|---------|-------------|----------|
| [`acp-spec`](./acp-spec/) | ACP v1 JSON Schema definitions | JSON Schema |
| [`acp-js`](./acp-js/) | `@maia/acp` - TypeScript/JS client | TypeScript |
| [`acp-py`](./acp-py/) | `maia-acp` - Python client | Python |
| [`theatre-react`](./theatre-react/) | `@maia/theatre` - React execution and desktop SDK | React/TypeScript |
| [`teamchat`](./teamchat/) | `@maia/teamchat` - React multi-agent chat UI and conversation modeling | React/TypeScript |
| [`connector-adapters`](./connector-adapters/) | Framework adapters (LangChain, CrewAI, AutoGen) | Python |

## Quick Start

### Watch agent execution (React)

```tsx
import { Theatre } from '@maia/theatre';

<Theatre streamUrl="/acp/events" />
<Theatre recordedEvents={events} />
```

### Render agent conversation (React)

```tsx
import { ConversationPanel } from '@maia/teamchat';

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

## Architecture

```text
MCP   --> Tools        (Anthropic - how agents use tools)
ACP   --> Agents       (Maia - how agents talk to each other)
AG-UI --> UI           (CopilotKit - how agents stream to frontends)
```

Theatre renders execution.
TeamChat renders agent-to-agent chat, handoffs, and review loops.

## License

MIT
