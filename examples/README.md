# Examples

Runnable demos showing how to use the Maia SDK.

## Zero-Dependency (No LLM key needed)

| Example | Language | What it does |
|---------|----------|-------------|
| [**multi-agent-chat**](multi-agent-chat/) | Python | 4 agents collaborating with all 6 ACP primitives |
| [**acp-server-client**](acp-server-client/) | TypeScript | SSE server + client — connect Theatre or CLI to it |
| [**basic-theatre-demo**](basic-theatre-demo/) | HTML | Open `index.html` in browser — no install needed |

## With LLM (needs API key)

| Example | Language | What it does |
|---------|----------|-------------|
| [**brain-quickstart**](brain-quickstart/) | TypeScript | Run a multi-agent task with Brain orchestration |
| [**js-live-workbench**](js-live-workbench/) | TypeScript | End-to-end SDK sample: ACP + collaboration helpers + Theatre + TeamChat + computer runtime |
| [**langchain-acp-demo**](langchain-acp-demo/) | Python | Wrap a LangChain agent with ACP event emission |
| [**crewai-acp-demo**](crewai-acp-demo/) | Python | Wrap a CrewAI Crew with ACP observability |
| [**autogen-acp-demo**](autogen-acp-demo/) | Python | Wrap an AutoGen group chat with ACP events |
| [**python-live-workbench**](python-live-workbench/) | Python | End-to-end SDK sample: ACP + collaboration helpers + Theatre + TeamChat + computer runtime |

## React

| Example | Language | What it does |
|---------|----------|-------------|
| [**theatre-react-app**](theatre-react-app/) | TypeScript | Theatre + TeamChat side by side |

## How to Run

**Python examples:**
```bash
cd examples/multi-agent-chat
pip install -r requirements.txt
python main.py
```

**TypeScript examples:**
```bash
cd examples/acp-server-client
npm install
npx tsx server.ts
# In another terminal:
npx tsx client.ts
```

**HTML examples:**
```bash
cd examples/basic-theatre-demo
open index.html   # or just double-click it
```

## All examples save to `events.jsonl`

Replay them:
```bash
maia replay events.jsonl --speed 4
```

Or serve them as a live SSE stream:
```bash
maia serve events.jsonl
# Then connect Theatre to http://localhost:8765/acp/events
```
