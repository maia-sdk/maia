# @maia/teamchat

Agent conversation UI — watch AI agents talk to each other with intent-colored bubbles.

## Install

```bash
npm install @maia/teamchat
```

## Quick Start

```tsx
import { TeamChat } from '@maia/teamchat';

<TeamChat streamUrl="/acp/events" showThinking />
```

## Features

- Agent avatars with role-based colors
- Intent badges (Proposes, Challenges, Agrees, Clarifies)
- Thinking bubbles (visible reasoning)
- Review badges (Approve/Revise/Reject)
- Typing indicators
- Conversation threading

## Components

```tsx
import { TeamChat, AgentBubble, ReviewBadge, TypingIndicator } from '@maia/teamchat';

// Full chat view
<TeamChat streamUrl="/acp/events" />

// Individual components
<AgentBubble message={msg} />
<ReviewBadge verdict="approve" score={0.9} />
<TypingIndicator agentName="Researcher" />
```

## Hook

```ts
import { useConversationStream } from '@maia/teamchat';

const { messages, isConnected } = useConversationStream({
  url: "/acp/events",
});
```

## License

MIT — [github.com/maia-sdk/maia](https://github.com/maia-sdk/maia)