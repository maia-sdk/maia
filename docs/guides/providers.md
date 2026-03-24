# Multi-Provider LLM Routing

Use multiple LLM providers with automatic failover. If OpenAI is down, try Anthropic. If Anthropic is rate-limited, try Qwen.

## Setup

```ts
import { openai, anthropic, qwen, custom, callWithProviderChain } from '@maia/brain';

const chain = {
  providers: [
    openai("sk-openai-key", "gpt-4o"),
    anthropic("sk-ant-key", "claude-sonnet-4-20250514"),
    qwen("sk-qwen-key", "qwen3.5-35b-a3b"),
  ],
};

const result = await callWithProviderChain(chain, systemPrompt, userPrompt);
// Tries OpenAI first → if fails, tries Anthropic → if fails, tries Qwen
```

## Per-role model overrides

Different agents can use different models:

```ts
const chain = {
  providers: [openai("sk-..."), anthropic("sk-ant-...")],
  roleModelOverrides: {
    analyst: "gpt-4o",                         // Analyst uses GPT-4o (best at data)
    writer: "claude-sonnet-4-20250514",        // Writer uses Claude (best at prose)
    coder: "gpt-4o",                           // Coder uses GPT-4o (best at code)
  },
};
```

## Custom providers

Any OpenAI-compatible API:

```ts
const local = custom("ollama", "http://localhost:11434/v1", "not-needed", "llama3");
const together = custom("together", "https://api.together.xyz/v1", "tog-key", "meta-llama/Llama-3-70b");
```

## How failover works

1. Try provider A (up to `maxRetries` attempts with exponential backoff)
2. If all retries fail (429, 500+, timeout, empty response) → try provider B
3. Continue until a provider succeeds or all fail
4. Each provider has independent retry + timeout settings

```ts
openai("sk-...", "gpt-4o")  // defaults: maxRetries=1, timeoutMs=30000
```

## Cost tracking

Each response includes the provider that handled it:

```ts
const result = await callWithProviderChain(chain, system, user);
console.log(result.provider); // "openai" or "anthropic" or "qwen"
console.log(result.costUsd);  // provider-specific cost estimate
```