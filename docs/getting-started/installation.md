# Installation

## JavaScript / TypeScript

```bash
npm install @maia/sdk
```

This installs everything: ACP protocol, Theatre visualization, and all types.

### Individual packages (if you only need specific parts)

```bash
npm install @maia/acp          # Protocol only
npm install @maia/theatre      # Visualization only
npm install @maia/brain        # Brain orchestrator only
npm install @maia/computer-use # Browser automation only
npm install @maia/connectors   # Connector catalog only
npm install @maia/cli          # CLI tools
```

## Python

```bash
pip install maia-sdk
```

### With framework adapters

```bash
pip install maia-sdk[langchain]   # + LangChain support
pip install maia-sdk[crewai]      # + CrewAI support
pip install maia-sdk[autogen]     # + AutoGen support
pip install maia-sdk[all]         # Everything
```

### CLI

```bash
pip install maia-cli
```

## Requirements

- **Node.js**: 18+
- **Python**: 3.10+
- **LLM API key**: OpenAI, Anthropic, Qwen, or any OpenAI-compatible API
- **Playwright** (optional): only needed for Computer Use

## Verify installation

### JavaScript
```typescript
import { ACPClient, message } from '@maia/sdk';
console.log("Maia SDK installed!");
```

### Python
```python
from maia_sdk import ACPClient, message
print("Maia SDK installed!")
```

### CLI
```bash
maia info
```