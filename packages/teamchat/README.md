# @maia/teamchat

Legacy compatibility package for Maia conversation UI.

`@maia/conversation` is the primary JS package for new development.

## Install

```bash
npm install @maia/teamchat
```

## Quick Start

```tsx
import { ConversationPanel } from '@maia/conversation';

<ConversationPanel rows={rows} loading={false} />
```

## Migration

Prefer:

```tsx
import { ConversationPanel, ConversationThread } from '@maia/conversation';
```

Keep `@maia/teamchat` only if you need backward compatibility with older integrations.

## License

MIT - [github.com/maia-sdk/maia](https://github.com/maia-sdk/maia)
