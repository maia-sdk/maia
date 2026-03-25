# @maia/connectors

49 pre-built SaaS connectors for AI agents — Gmail, Slack, GitHub, Jira, Stripe, and more.

## Install

```bash
npm install @maia/connectors
```

## Quick Start

```ts
import { getAllConnectors, getConnector } from '@maia/connectors';

// List all connectors
const all = getAllConnectors();
console.log(`${all.length} connectors`);

// Get a specific connector
const gmail = getConnector("gmail");
console.log(gmail.tools); // send_email, search_email, read_email, list_labels

// Execute a tool
const result = await gmail.tools[0].execute(
  { to: "user@test.com", subject: "Hello", body: "Hi!" },
  { id: "gmail", name: "Gmail", description: "", authKind: "oauth2",
    credentials: { access_token: "ya29...." } },
);
```

## Available Connectors

| Category | Connectors |
|----------|-----------|
| Communication | Gmail, Slack, Teams, Discord, Twilio |
| Project Mgmt | Jira, Linear, Asana, Trello, Monday |
| Developer | GitHub, Confluence |
| CRM | Salesforce, HubSpot |
| Database | PostgreSQL, Supabase, BigQuery |
| Productivity | Notion, Airtable, Google Calendar, Calendly |
| Storage | Google Drive, Dropbox, Box |
| Commerce | Stripe, Shopify, QuickBooks, Xero |
| Social | Twitter/X, LinkedIn, YouTube, Spotify |
| Cloud | AWS, Vercel, Cloudflare |
| And more... | Figma, Zendesk, OpenAI, Pinecone, DocuSign, etc. |

## Custom Connectors

```ts
import { BaseConnector } from '@maia/connectors';

class MyConnector extends BaseConnector {
  getTools() { return [/* ... */]; }
  getDefinition() { return { /* ... */ }; }
}
```

## Optional Peer Dependencies

Some connectors need additional packages:
- PostgreSQL: `npm install pg`
- AWS S3/Lambda: `npm install @aws-sdk/client-s3 @aws-sdk/client-lambda`

## License

MIT — [github.com/maia-sdk/maia](https://github.com/maia-sdk/maia)