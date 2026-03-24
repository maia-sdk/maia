# Framework Adapters

Already using LangChain, CrewAI, or AutoGen? Wrap your existing agents with a 3-line adapter to get ACP events and Theatre visualization.

## LangChain

```python
from langchain.agents import create_react_agent
from maia_sdk.adapters.langchain import ACPLangChainAdapter

# Your existing LangChain agent
agent = create_react_agent(llm, tools, prompt)

# Wrap it
acp_agent = ACPLangChainAdapter(
    agent=agent,
    agent_id="agent://researcher",
    name="Researcher",
    role="research",
)

# Run and get ACP events
for event in acp_agent.run("Find Q4 revenue data"):
    print(event.model_dump_json())
```

What you get:
- Capabilities event (agent joining)
- Activity events (thinking, tool calls)
- Intermediate step tracking
- Final result as an ACP message

## CrewAI

```python
from crewai import Agent, Task, Crew
from maia_sdk.adapters.crewai import ACPCrewAIAdapter

# Your existing CrewAI crew
researcher = Agent(role="Researcher", goal="Find data", ...)
analyst = Agent(role="Analyst", goal="Verify data", ...)
crew = Crew(agents=[researcher, analyst], tasks=[...])

# Wrap it
acp_crew = ACPCrewAIAdapter(crew=crew, run_id="run_123")

# Run and get ACP events
for event in acp_crew.run():
    print(event.model_dump_json())
```

What you get:
- Capabilities for each agent
- Handoff events between tasks
- Activity events during execution
- Final summary message

## AutoGen

```python
from autogen import AssistantAgent, GroupChat
from maia_sdk.adapters.autogen import ACPAutoGenAdapter

# Your existing AutoGen group chat
researcher = AssistantAgent(name="researcher", ...)
analyst = AssistantAgent(name="analyst", ...)
group_chat = GroupChat(agents=[researcher, analyst], ...)

# Wrap it
acp_chat = ACPAutoGenAdapter(group_chat=group_chat)

# Run and get ACP events
for event in acp_chat.run("Analyze the market"):
    print(event.model_dump_json())
```

What you get:
- Capabilities for each agent
- Message events for each conversation turn
- Final summary

## Visualize any framework

Once you have ACP events, point Theatre at them:

```python
# Serve events as SSE
from fastapi import FastAPI
from fastapi.responses import StreamingResponse

app = FastAPI()

@app.get("/acp/events")
async def stream():
    def generate():
        for event in acp_agent.run("Find data"):
            yield f"data: {event.model_dump_json()}\n\n"
    return StreamingResponse(generate(), media_type="text/event-stream")
```

```tsx
<Theatre streamUrl="http://localhost:8000/acp/events" />
```

Or watch in the terminal:

```bash
maia stream http://localhost:8000/acp/events
```