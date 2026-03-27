# JS Live Workbench

End-to-end JavaScript Maia SDK example.

What it demonstrates:
- ACP event emission
- collaboration helpers
- Theatre UI
- TeamChat UI
- Maia computer runtime client

## Run

Terminal 1:

```bash
cd examples/js-live-workbench
npm install
npm run server
```

Terminal 2:

```bash
cd examples/js-live-workbench
npm run client
```

Open:
- Client: `http://localhost:5174`
- SSE server: `http://localhost:8780/acp/events`

## Optional environment

```bash
OPENAI_API_KEY=...
OPENAI_MODEL=gpt-4o-mini
MAIA_API_BASE=http://localhost:8000
MAIA_START_URL=https://example.com
MAIA_COMPUTER_TASK="Inspect the pricing page and summarize the plans."
MAIA_COMPUTER_MODEL=openai/gpt-oss-20b
MAIA_COMPUTER_MAX_ITERATIONS=6
MAIA_USER_ID=js-live-workbench
```

Without `OPENAI_API_KEY`, the server falls back to deterministic handoff/review events.
Without `MAIA_API_BASE`, it skips the live computer runtime and emits an explicit idle event instead.
