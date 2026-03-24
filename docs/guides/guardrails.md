# Guardrails

Block harmful input and filter unsafe output before users see it.

## Quick setup

```ts
import { createGuardrails } from '@maia/brain';

const rails = createGuardrails();
// Defaults: injectionGuard on input, piiGuard + toxicityGuard + lengthGuard on output
```

## Check input

```ts
const check = await rails.checkInput(userMessage);

if (!check.passed) {
  // Input was blocked
  console.log(check.results.map(r => r.reason));
  // ["Possible prompt injection detected"]
  return;
}
```

## Check output

```ts
const check = await rails.checkOutput(agentResponse);

if (!check.passed) {
  if (check.text) {
    // Output was modified (e.g., truncated)
    return check.text;
  }
  // Output was blocked entirely
  return "I cannot provide that information.";
}
```

## Built-in guards

| Guard | What it catches |
|-------|----------------|
| `injectionGuard()` | "Ignore previous instructions", "You are now DAN", jailbreak attempts |
| `piiGuard()` | Email addresses, phone numbers, SSNs, credit card numbers |
| `toxicityGuard()` | Instructions for harm, hacking tutorials, self-harm content |
| `lengthGuard(maxChars)` | Output exceeding character limit (truncates, doesn't block) |

## Custom guards

```ts
import { customGuard } from '@maia/brain';

// Block competitor mentions
const noCompetitors = customGuard("no-competitors", (text) => {
  return !text.toLowerCase().includes("competitor name");
});

// Require citations
const requireCitations = customGuard("require-citations", (text) => {
  return /\[\d+\]/.test(text) ? true : "Output must include citations [1], [2], etc.";
});

const rails = createGuardrails({
  inputGuards: [injectionGuard()],
  outputGuards: [piiGuard(), noCompetitors, requireCitations],
});
```

## Warn mode

Instead of blocking, just flag issues:

```ts
const rails = createGuardrails({ mode: "warn" });
// check.passed will be false but check.text will still contain the content
```