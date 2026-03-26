# Python Live Workbench

End-to-end Python Maia SDK example.

What it demonstrates:
- ACP event emission
- collaboration helpers
- Theatre server
- TeamChat server
- Maia computer runtime client

## Run

```bash
cd examples/python-live-workbench
pip install -r requirements.txt
python main.py
```

## Optional environment

```bash
OPENAI_API_KEY=...                 # enables real collaboration helper calls
MAIA_API_BASE=http://localhost:8000
MAIA_START_URL=https://example.com
MAIA_COMPUTER_TASK="Inspect the pricing page and summarize the plans."
MAIA_COMPUTER_MODEL=openai/gpt-oss-20b
MAIA_COMPUTER_MAX_ITERATIONS=6
OPEN_BROWSER=0                     # keep browsers closed
```

## Output

- Theatre: `http://localhost:8765`
- TeamChat: `http://localhost:8766`
- Saved events: `events.jsonl`

Without `OPENAI_API_KEY`, the script falls back to deterministic handoff/review events.
Without `MAIA_API_BASE`, it skips the live computer runtime and emits an explicit idle event instead.
