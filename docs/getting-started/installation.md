# Installation

## One install (recommended)

```bash
npm install @maia/sdk          # JS/TS — everything
pip install maia-sdk            # Python — everything
```

## Individual packages

Install only what you need:

```bash
# Core
npm install @maia/brain         # Agent orchestration
npm install @maia/acp           # Protocol types + client
npm install @maia/theatre       # Action visualization (14 surfaces)
npm install @maia/teamchat      # Conversation UI

# Tools
npm install @maia/computer-use  # Browser automation (needs playwright)
npm install @maia/connectors    # 40+ SaaS connectors

# CLI
pip install maia-cli            # Terminal tools
```

## Python with framework adapters

```bash
pip install maia-sdk[langchain]   # + LangChain
pip install maia-sdk[crewai]      # + CrewAI
pip install maia-sdk[autogen]     # + AutoGen
pip install maia-sdk[all]         # Everything
```

## Requirements

- **Node.js** 18+ or **Python** 3.10+
- **LLM API key** — OpenAI, Anthropic, Qwen, or any OpenAI-compatible API
- **Playwright** (optional) — only for `@maia/computer-use`
- **React** 18+ (optional) — only for Theatre/TeamChat UI components

## Verify

```ts
import { Brain } from '@maia/brain';
console.log("Maia installed!");
```

```python
from maia_sdk import ACPClient
print("Maia installed!")
```

```bash
maia info
```

## Environment variables

```bash
# Required: your LLM key
OPENAI_API_KEY=sk-...

# Optional: custom LLM endpoint
OPENAI_API_BASE=https://api.openai.com/v1

# Optional: specific model
OPENAI_CHAT_MODEL=gpt-4o
```