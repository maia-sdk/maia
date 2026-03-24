# Evaluation Framework

Measure agent quality with datasets. Track regression over time.

## Basic evaluation

```ts
import { Brain } from '@maia/brain';
import { evaluate, fuzzyMatch, containsKeywords } from '@maia/brain';

const brain = new Brain({ agents: [], llm: { apiKey: "sk-..." } });

const results = await evaluate(
  async (input) => {
    const r = await brain.run(input);
    return { output: r.output, totalCostUsd: r.totalCostUsd, totalTokens: r.totalTokens };
  },
  {
    name: "pricing-analysis",
    examples: [
      { input: "Analyze SaaS pricing trends", expected: "PLG grew 34%" },
      { input: "Compare AWS vs GCP pricing", expected: "AWS" },
      { input: "What is usage-based pricing?", expected: "pay for what you use" },
    ],
  },
  [fuzzyMatch(0.4), containsKeywords("pricing")],
);

console.log(results.passRate);      // 0.67
console.log(results.avgScore);      // 0.72
console.log(results.totalCostUsd);  // $0.0891
console.log(results.byScorer);      // { fuzzy_match: { avg: 0.65, passRate: 0.67 } }
```

## Built-in scorers

| Scorer | What it checks |
|--------|---------------|
| `exactMatch()` | Output exactly matches expected |
| `fuzzyMatch(threshold)` | Token overlap ratio >= threshold |
| `containsKeywords(...words)` | Output contains all specified words |
| `lengthRange(min, max)` | Output length within range |
| `noHallucination(...forbidden)` | Output doesn't contain forbidden phrases |

## Custom scorers

```ts
const myScorer: Scorer = (input, output, expected) => {
  const hasNumbers = /\d+/.test(output);
  return {
    scorerId: "has_numbers",
    score: hasNumbers ? 1 : 0,
    passed: hasNumbers,
    reason: hasNumbers ? undefined : "No numbers in output",
  };
};
```

## Live progress

```ts
const results = await evaluate(runFn, dataset, scorers, {
  onResult: (result, index) => {
    console.log(`[${index + 1}/${dataset.examples.length}] ${result.passed ? "PASS" : "FAIL"}`);
  },
});
```

## Reading results

```ts
// Overall
results.passRate       // 0.85
results.avgScore       // 0.78
results.totalCostUsd   // $0.234
results.totalTokens    // 12450
results.totalDurationMs // 34000

// Per example
results.results[0].input    // "Analyze SaaS..."
results.results[0].output   // "PLG companies grew..."
results.results[0].passed   // true
results.results[0].scores   // [{ scorerId: "fuzzy_match", score: 0.82, passed: true }]

// Per scorer
results.byScorer.fuzzy_match.avg       // 0.78
results.byScorer.fuzzy_match.passRate  // 0.85
```