# Quickstart

Build your first multi-agent team in 5 minutes.

## 1. Install

```bash
pip install maia-sdk
```

## 2. Set your LLM key

```bash
export OPENAI_API_KEY=sk-your-key-here
```

Works with OpenAI, Anthropic, Qwen, or any OpenAI-compatible API:

```bash
# Anthropic
export OPENAI_API_BASE=https://api.anthropic.com/v1
export OPENAI_API_KEY=sk-ant-...

# Local Qwen
export OPENAI_API_BASE=https://dashscope.aliyuncs.com/compatible-mode/v1
export OPENAI_API_KEY=sk-...
export OPENAI_CHAT_MODEL=qwen3.5-35b-a3b
```

## 3. Define your agents

```python
from maia_sdk import Agent, Brain

researcher = Agent(
    id="agent://researcher",
    name="Researcher",
    role="research",
    instructions="Find data from reliable sources. Always cite your sources.",
    tools=["web_search"],
)

analyst = Agent(
    id="agent://analyst",
    name="Analyst",
    role="analysis",
    instructions="Verify numbers and challenge weak claims. Be skeptical.",
    tools=["data_analysis"],
)

writer = Agent(
    id="agent://writer",
    name="Writer",
    role="content",
    instructions="Write clear, concise reports. Lead with key findings.",
    tools=["document_write"],
)
```

## 4. Run with Brain

```python
brain = Brain(
    agents=[researcher, analyst, writer],
    llm={"api_key": "sk-...", "model": "gpt-4o"},
)

result = brain.run("Analyze SaaS pricing trends and write a client report")

print(result.output)
print(f"Cost: ${result.total_cost_usd:.4f}")
print(f"Steps: {len(result.steps)}")
```

## 5. Watch live in the terminal

```bash
maia stream http://localhost:8765/acp/events
```

## 6. Watch live in React

```tsx
import { Theatre } from '@maia/sdk/theatre';

function App() {
  return (
    <Theatre
      streamUrl="http://localhost:8765/acp/events"
      showThinking
      budgetUsd={5.00}
    />
  );
}
```

## What happens under the hood

1. **Brain decomposes** your goal into steps and assigns agents
2. **Agents execute** their tasks using LLM calls
3. **Brain reviews** each output — approve, revise, or reject
4. **Agents collaborate** — they can challenge and build on each other's work
5. **Brain synthesizes** a final response from all outputs
6. **Theatre shows** everything live — messages, thinking, tool calls, cost

## Next steps

- [Add Computer Use](../guides/computer-use.md) — give agents browser control
- [Add Connectors](../guides/connectors.md) — connect Gmail, Slack, Jira
- [Framework Adapters](../guides/adapters.md) — wrap LangChain, CrewAI, AutoGen
- [CLI Reference](../api-reference/cli.md) — stream, replay, validate