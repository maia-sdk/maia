# maia-adapters

Framework adapters — wrap existing LangChain, CrewAI, or AutoGen agents with ACP event emission.

## Install

```bash
pip install maia-adapters
```

With framework extras:
```bash
pip install maia-adapters[langchain]
pip install maia-adapters[crewai]
pip install maia-adapters[autogen]
pip install maia-adapters[all]
```

## LangChain

```python
from maia_adapters.langchain import ACPLangChainAdapter

adapter = ACPLangChainAdapter(agent_id="agent://langchain-agent")
# Wraps any LangChain agent to emit ACP events
```

## CrewAI

```python
from maia_adapters.crewai import ACPCrewAIAdapter

adapter = ACPCrewAIAdapter(agent_id="agent://crew-agent")
# Wraps CrewAI agents for ACP observability
```

## AutoGen

```python
from maia_adapters.autogen import ACPAutoGenAdapter

adapter = ACPAutoGenAdapter(agent_id="agent://autogen-agent")
# Wraps AutoGen agents for ACP event streaming
```

## License

MIT — [github.com/maia-sdk/maia](https://github.com/maia-sdk/maia)