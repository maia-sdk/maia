# LLM Caching

Cache LLM responses to save money and reduce latency. Identical prompts return cached results instantly.

## Enable caching

```ts
import { createCache, setLLMCache } from '@maia/brain';

// In-memory cache (default)
setLLMCache(createCache());

// Custom TTL and size
setLLMCache(createCache({
  ttlMs: 60 * 60 * 1000,  // 1 hour
  maxEntries: 1000,
}));
```

Once set, every `callLLM()` and every Brain run automatically checks the cache first.

## Cache stats

```ts
const cache = createCache();
setLLMCache(cache);

// After some runs...
const stats = cache.stats();
console.log(stats.hits);     // 42
console.log(stats.misses);   // 18
console.log(stats.hitRate);  // 0.70
console.log(stats.savedUsd); // $0.0156
console.log(stats.entries);  // 18
```

## Custom backend (Redis, SQLite, etc.)

```ts
import Redis from "ioredis";
const redis = new Redis();

setLLMCache(createCache({
  get: async (key) => {
    const raw = await redis.get(`maia:${key}`);
    return raw ? JSON.parse(raw) : null;
  },
  set: async (key, entry) => {
    await redis.set(`maia:${key}`, JSON.stringify(entry), "EX", 3600);
  },
}));
```

## How it works

1. Cache key = hash of (model + system prompt + user prompt)
2. On cache hit: return cached text instantly, $0 cost
3. On cache miss: call LLM, store result, return
4. LRU eviction when max entries reached
5. TTL expiry — old entries auto-removed

## Disable caching

```ts
setLLMCache(null);
```