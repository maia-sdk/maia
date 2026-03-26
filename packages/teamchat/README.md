# @maia/teamchat

Primary JS package for Maia multi-agent chat, handoffs, reviews, and conversation modeling.

## Install

```bash
npm install @maia/teamchat
```

## Quick Start

```tsx
import { ConversationPanel } from '@maia/teamchat';

<ConversationPanel rows={rows} loading={false} />
```

## What it includes

- conversation panel UI
- conversation thread UI
- roster and grouping helpers
- ACP conversion helpers
- legacy `TeamChat` exports for backward compatibility

## Legacy API

If you already use the older stream-first chat component, it still exists:

```tsx
import { TeamChat } from '@maia/teamchat';

<TeamChat streamUrl="/acp/events" showThinking />
```

## License

MIT - [github.com/maia-sdk/maia](https://github.com/maia-sdk/maia)
