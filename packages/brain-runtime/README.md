# @maia/brain

Multi-agent orchestration runtime — plan, execute, converse, review, revise.

## Install

```bash
npm install @maia/brain
```

## Quick Start

```ts
import { Brain } from '@maia/brain';

const brain = new Brain({
  agents: [],  // picks from 27 built-in roles
  llm: { apiKey: process.env.OPENAI_API_KEY },
});

const result = await brain.run("Analyze SaaS pricing and write a report");

console.log(result.output);        // Final report
console.log(result.totalCostUsd);  // $0.0234
console.log(result.steps);         // researcher → analyst → writer
```

## 27 Built-in Roles

supervisor, project_sponsor, project_manager, tech_lead, coder, data_scientist, designer, devops, it_infrastructure, qa_tester, security_auditor, reviewer, writer, translator, researcher, document_reader, browser, analyst, finance, legal, sales, marketing, customer_support, email_specialist, delivery, product_manager, business_analyst

Each role has a distinct personality — vocabulary, directness, sentence length.

## Caching

```ts
import { createCache, setLLMCache } from '@maia/brain';
setLLMCache(createCache({ ttlMs: 30 * 60_000, maxEntries: 500 }));
```

## Multi-Provider Failover

```ts
import { openai, anthropic, callWithProviderChain } from '@maia/brain';
const result = await callWithProviderChain(
  { providers: [openai("sk-..."), anthropic("sk-ant-...")] },
  systemPrompt, userPrompt,
);
```

## Memory

```ts
import { createMemoryStore, recordMemory, recallMemories } from '@maia/brain';
const memory = createMemoryStore();
// Brain auto-stores decisions during runs
```

## API

- `Brain` — main orchestrator class
- `getRole(id)` / `getAllRoles()` / `inferRole(desc)` — role catalog
- `callLLM()` / `callLLMJson()` — LLM calls with caching + telemetry
- `createGuardrails()` — input/output safety rails
- `evaluate()` — test agent quality with datasets
- `createTelemetry()` — OpenTelemetry auto-instrumentation

## License

MIT — [github.com/maia-sdk/maia](https://github.com/maia-sdk/maia)