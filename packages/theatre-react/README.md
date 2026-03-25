# @maia/theatre

Live agent visualization — watch AI agents work in real-time with 15 visual surfaces and 49 branded connector skins.

## Install

```bash
npm install @maia/theatre
```

## Quick Start

```tsx
import { Theatre, SurfaceRenderer, ConnectorSkin } from '@maia/theatre';

// Full theatre — auto-renders surfaces based on agent activity
<Theatre streamUrl="/acp/events" />

// Or use individual surfaces with connector branding
<ConnectorSkin connectorId="gmail" title="Composing report" status="in_progress">
  <EmailSurface surface={surface} />
</ConnectorSkin>
```

## 15 Visual Surfaces

| Surface | What you see |
|---------|-------------|
| Browser | URL bar + page screenshot |
| Document | Document with highlights |
| Editor | Live text with cursor |
| Search | Results appearing |
| Email | To/Subject/Body |
| Terminal | Colored output |
| Chat | Message bubbles |
| Dashboard | KPI cards + charts |
| Kanban | Board with cards |
| Database | SQL + table results |
| CRM | Contact/deal cards |
| Diff | Red/green lines |
| API | Request/response JSON |
| Calendar | Time grid + events |

## 49 Connector Skins

```ts
import { getConnectorSkin, hasConnectorSkin } from '@maia/theatre';

const skin = getConnectorSkin("slack");   // purple palette
const skin = getConnectorSkin("github");  // dark mode + green
const skin = getConnectorSkin("stripe");  // purple gradient
```

## Hooks

```ts
import { useACPStream, useReplay } from '@maia/theatre';

const stream = useACPStream({ url: "/acp/events" });
const replay = useReplay({ events, speed: 4 });
```

## API

- `Theatre` — main visualization component
- `SurfaceRenderer` — picks the right surface from SurfaceState
- `ConnectorSkin` — branded wrapper for any surface
- `useACPStream` — connect to live ACP event stream
- `useReplay` — replay recorded events at configurable speed
- `getConnectorSkin(id)` — get palette + descriptor for a connector
- Components: TeamThread, ActivityTimeline, AgentAvatar, CostBar, ReplayControls

## License

MIT — [github.com/maia-sdk/maia](https://github.com/maia-sdk/maia)