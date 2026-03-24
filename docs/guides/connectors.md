# Connectors

Give your agents access to 50+ SaaS tools. Gmail, Slack, Jira, GitHub, Stripe, and more.

## How it works

1. You provide API credentials (your keys, your accounts)
2. The connector wraps the API into agent-friendly tools
3. Every API call emits ACP events for Theatre visualization

## Browse available connectors

```typescript
import { getAllConnectors, getCategories } from '@maia/connectors';

// List all categories
console.log(getCategories());
// ["communication", "project_management", "developer", "crm", "analytics", ...]

// List all connectors
const connectors = getAllConnectors();
console.log(connectors.length);  // 40+

// Get a specific connector
import { getConnector } from '@maia/connectors';
const gmail = getConnector("gmail");
console.log(gmail.tools.map(t => t.name));
// ["Send Email", "Search Email", "Read Email", "List Labels"]
```

## Connector categories

| Category | Connectors |
|----------|-----------|
| Communication | Gmail, Slack, Teams, Discord, Twilio |
| Project Management | Jira, Linear, Asana, Trello, Monday |
| Developer | GitHub, Confluence |
| CRM & Sales | Salesforce, HubSpot |
| Analytics | Google Analytics, Google Ads, BigQuery |
| Database | PostgreSQL, Supabase |
| Productivity | Notion, Airtable, Google Calendar, Calendly |
| Storage | Google Drive, Dropbox, Box |
| Commerce | Stripe, Shopify, QuickBooks, Xero |
| Marketing | Mailchimp |
| Social | Twitter/X, LinkedIn |
| Search | Brave Search |
| Support | Zendesk, Intercom |
| Design | Figma |
| Automation | Zapier, Make |
| Cloud | AWS, Vercel, Cloudflare |
| AI/ML | OpenAI, Pinecone |
| Enterprise | SAP, DocuSign |
| Media | YouTube, Spotify |
| Website | Webflow |

## Authentication

Each connector declares what credentials it needs:

```typescript
const gmail = getConnector("gmail");
console.log(gmail.authKind);            // "oauth2"
console.log(gmail.requiredCredentials); // ["client_id", "client_secret", "refresh_token"]

const jira = getConnector("jira");
console.log(jira.authKind);             // "api_key"
console.log(jira.requiredCredentials);  // ["domain", "email", "api_token"]
```

**You provide the credentials. Maia never stores or ships API keys.**

## Building a custom connector

```typescript
import { BaseConnector } from '@maia/connectors';
import type { ConnectorDefinition, ConnectorTool, ToolResult } from '@maia/connectors';

class MyConnector extends BaseConnector {
  getDefinition(): ConnectorDefinition {
    return {
      id: "my_app",
      name: "My App",
      description: "Connect to My App API",
      authKind: "api_key",
      category: "custom",
      iconEmoji: "\u2B50",
      requiredCredentials: ["api_key"],
      tools: this.getTools(),
    };
  }

  getTools(): ConnectorTool[] {
    return [{
      id: "get_data",
      name: "Get Data",
      description: "Fetch data from My App",
      inputSchema: { type: "object", properties: { query: { type: "string" } } },
      execute: async (params, config) => {
        const response = await fetch(`https://api.myapp.com/data?q=${params.query}`, {
          headers: { Authorization: `Bearer ${config.credentials.api_key}` },
        });
        const data = await response.json();
        return { success: true, data, summary: `Found ${data.length} results` };
      },
    }];
  }
}
```