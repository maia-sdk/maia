# Quickstart

Build your first multi-agent team in 5 minutes.

## 1. Install

```bash
npm install @maia/sdk
```

## 2. Set your LLM key

```bash
export OPENAI_API_KEY=sk-your-key-here
```

Works with any OpenAI-compatible API:

```bash
# Anthropic
export OPENAI_API_BASE=https://api.anthropic.com/v1
export OPENAI_API_KEY=sk-ant-...

# Qwen / DashScope
export OPENAI_API_BASE=https://dashscope.aliyuncs.com/compatible-mode/v1
export OPENAI_API_KEY=sk-...

# Local (Ollama, vLLM, etc.)
export OPENAI_API_BASE=http://localhost:11434/v1
export OPENAI_API_KEY=not-needed
```

## 3. Run your first agent team

```ts
import { Brain, createCache, setLLMCache, createTelemetry, setLLMTelemetry } from '@maia/brain';

// Optional: enable caching to save money
setLLMCache(createCache());

// Optional: enable telemetry for debugging
setLLMTelemetry(createTelemetry());

const brain = new Brain({
  agents: [],  // Brain picks from 27 built-in roles
  llm: { apiKey: process.env.OPENAI_API_KEY! },
});

const result = await brain.run("Research AI agent frameworks and write a comparison report");

console.log(result.output);
console.log(`Cost: $${result.totalCostUsd.toFixed(4)}`);
console.log(`Steps: ${result.steps.length}`);
console.log(`Conversations: ${result.conversations.length}`);
```

## 4. Watch live in the terminal

```bash
pip install maia-cli
maia stream http://localhost:8765/acp/events
```

## 5. Watch live in React

```tsx
import { Theatre, TeamChat } from '@maia/sdk/theatre';

function AgentWorkspace() {
  return (
    <div style={{ display: "flex", height: "600px", gap: "16px" }}>
      {/* Left: see what agents are DOING */}
      <Theatre streamUrl="/acp/events" style={{ flex: 2 }} />

      {/* Right: see what agents are SAYING */}
      <TeamChat streamUrl="/acp/events" showThinking style={{ flex: 1 }} />
    </div>
  );
}
```

## 6. Add safety rails

```ts
import { createGuardrails } from '@maia/brain';

const rails = createGuardrails();

// Check user input before sending to Brain
const check = await rails.checkInput(userMessage);
if (!check.passed) {
  console.log("Blocked:", check.results.map(r => r.reason));
  return;
}

// Check agent output before showing to user
const output = await rails.checkOutput(result.output);
```

## What just happened?

1. **Brain decomposed** your goal into steps and assigned the best agent for each
2. **Agents executed** with distinct personalities (researcher is thorough, analyst is skeptical)
3. **Agents discussed** — challenged each other's claims, agreed on corrections
4. **Brain reviewed** every output — approved, revised, or asked follow-up questions
5. **Coverage checked** — verified all required facts were satisfied
6. **Memory stored** — decisions recorded for future runs
7. **Theatre showed** the actual work (search results, documents, dashboards)
8. **TeamChat showed** the agent conversations (proposals, challenges, agreements)

## Next steps

- [Multi-provider setup](../guides/providers.md) — use OpenAI + Anthropic + Qwen with fallback
- [Theatre surfaces](../guides/theatre.md) — 14 visual surfaces for agent work
- [Evaluation](../guides/evaluation.md) — measure agent quality with datasets
- [Computer Use](../guides/computer-use.md) — give agents browser control
- [Connectors](../guides/connectors.md) — connect Gmail, Slack, Jira, and 40+ tools
- [CLI reference](../api-reference/cli.md) — stream, replay, validate, scaffold