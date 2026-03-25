"""Connector catalog — 49 pre-built SaaS connectors."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any


@dataclass
class ConnectorTool:
    id: str
    name: str
    description: str
    parameters: dict[str, Any] = field(default_factory=dict)


@dataclass
class ConnectorDefinition:
    id: str
    name: str
    description: str
    category: str
    icon_emoji: str
    auth_kind: str  # "oauth2" | "api_key" | "basic" | "custom"
    base_url: str
    tools: list[ConnectorTool] = field(default_factory=list)


# ── Catalog ────────────────────────────────────────────────────────────────

_CONNECTORS: list[ConnectorDefinition] = [
    # Communication
    ConnectorDefinition("gmail", "Gmail", "Send and read emails", "communication", "\U0001F4E7", "oauth2", "https://gmail.googleapis.com",
        tools=[ConnectorTool("send_email", "Send Email", "Send an email"), ConnectorTool("search_email", "Search Email", "Search emails"), ConnectorTool("read_email", "Read Email", "Read an email"), ConnectorTool("list_labels", "List Labels", "List email labels")]),
    ConnectorDefinition("slack", "Slack", "Send messages and manage channels", "communication", "\U0001F4AC", "oauth2", "https://slack.com/api",
        tools=[ConnectorTool("send_message", "Send Message", "Send a channel message"), ConnectorTool("list_channels", "List Channels", "List channels"), ConnectorTool("search_messages", "Search", "Search messages")]),
    ConnectorDefinition("teams", "Microsoft Teams", "Team messaging and calls", "communication", "\U0001F4AC", "oauth2", "https://graph.microsoft.com/v1.0",
        tools=[ConnectorTool("send_message", "Send Message", "Send a message"), ConnectorTool("list_channels", "List Channels", "List channels")]),
    ConnectorDefinition("discord", "Discord", "Community messaging", "communication", "\U0001F3AE", "api_key", "https://discord.com/api/v10",
        tools=[ConnectorTool("send_message", "Send Message", "Send a message"), ConnectorTool("list_channels", "List Channels", "List channels")]),
    ConnectorDefinition("twilio", "Twilio", "SMS and voice", "communication", "\U0001F4F1", "api_key", "https://api.twilio.com/2010-04-01",
        tools=[ConnectorTool("send_sms", "Send SMS", "Send an SMS"), ConnectorTool("make_call", "Make Call", "Make a phone call")]),

    # Project Management
    ConnectorDefinition("jira", "Jira", "Issue tracking", "project_mgmt", "\U0001F537", "oauth2", "https://api.atlassian.com",
        tools=[ConnectorTool("create_issue", "Create Issue", "Create a Jira issue"), ConnectorTool("search_issues", "Search Issues", "Search issues"), ConnectorTool("update_issue", "Update Issue", "Update an issue")]),
    ConnectorDefinition("linear", "Linear", "Modern issue tracking", "project_mgmt", "\U0001F52E", "api_key", "https://api.linear.app",
        tools=[ConnectorTool("create_issue", "Create Issue", "Create an issue"), ConnectorTool("list_issues", "List Issues", "List issues")]),
    ConnectorDefinition("asana", "Asana", "Work management", "project_mgmt", "\U0001F4CB", "oauth2", "https://app.asana.com/api/1.0",
        tools=[ConnectorTool("create_task", "Create Task", "Create a task"), ConnectorTool("list_tasks", "List Tasks", "List tasks")]),
    ConnectorDefinition("trello", "Trello", "Kanban boards", "project_mgmt", "\U0001F4CB", "api_key", "https://api.trello.com/1",
        tools=[ConnectorTool("create_card", "Create Card", "Create a card"), ConnectorTool("list_cards", "List Cards", "List cards")]),
    ConnectorDefinition("monday", "Monday.com", "Work OS", "project_mgmt", "\U0001F4CB", "api_key", "https://api.monday.com/v2",
        tools=[ConnectorTool("create_item", "Create Item", "Create an item"), ConnectorTool("list_items", "List Items", "List items")]),

    # Developer
    ConnectorDefinition("github", "GitHub", "Code hosting and collaboration", "developer", "\U0001F419", "oauth2", "https://api.github.com",
        tools=[ConnectorTool("create_issue", "Create Issue", "Create a GitHub issue"), ConnectorTool("create_pr", "Create PR", "Create a pull request"), ConnectorTool("search_repos", "Search Repos", "Search repositories"), ConnectorTool("list_commits", "List Commits", "List commits")]),
    ConnectorDefinition("confluence", "Confluence", "Documentation wiki", "developer", "\U0001F4D6", "oauth2", "https://api.atlassian.com",
        tools=[ConnectorTool("create_page", "Create Page", "Create a page"), ConnectorTool("search_content", "Search", "Search content")]),

    # CRM
    ConnectorDefinition("salesforce", "Salesforce", "CRM platform", "crm", "\u2601\uFE0F", "oauth2", "https://login.salesforce.com",
        tools=[ConnectorTool("create_lead", "Create Lead", "Create a lead"), ConnectorTool("search_contacts", "Search", "Search contacts"), ConnectorTool("update_opportunity", "Update Deal", "Update an opportunity")]),
    ConnectorDefinition("hubspot", "HubSpot", "Inbound CRM", "crm", "\U0001F7E0", "api_key", "https://api.hubapi.com",
        tools=[ConnectorTool("create_contact", "Create Contact", "Create a contact"), ConnectorTool("search_contacts", "Search", "Search contacts"), ConnectorTool("create_deal", "Create Deal", "Create a deal")]),

    # Database
    ConnectorDefinition("postgresql", "PostgreSQL", "Relational database", "database", "\U0001F418", "custom", "",
        tools=[ConnectorTool("query", "Query", "Run a SQL query"), ConnectorTool("insert", "Insert", "Insert data")]),
    ConnectorDefinition("supabase", "Supabase", "Postgres + Auth + Realtime", "database", "\u26A1", "api_key", "https://api.supabase.com",
        tools=[ConnectorTool("query", "Query", "Run a query"), ConnectorTool("insert", "Insert", "Insert data")]),
    ConnectorDefinition("bigquery", "BigQuery", "Data warehouse", "database", "\U0001F4CA", "oauth2", "https://bigquery.googleapis.com",
        tools=[ConnectorTool("query", "Query", "Run a SQL query")]),

    # Productivity
    ConnectorDefinition("notion", "Notion", "All-in-one workspace", "productivity", "\U0001F4DD", "oauth2", "https://api.notion.com/v1",
        tools=[ConnectorTool("create_page", "Create Page", "Create a page"), ConnectorTool("search", "Search", "Search pages"), ConnectorTool("update_page", "Update Page", "Update a page")]),
    ConnectorDefinition("airtable", "Airtable", "Spreadsheet database", "productivity", "\U0001F4CA", "api_key", "https://api.airtable.com/v0",
        tools=[ConnectorTool("list_records", "List Records", "List records"), ConnectorTool("create_record", "Create Record", "Create a record")]),
    ConnectorDefinition("google_calendar", "Google Calendar", "Calendar scheduling", "productivity", "\U0001F4C5", "oauth2", "https://www.googleapis.com/calendar/v3",
        tools=[ConnectorTool("create_event", "Create Event", "Create an event"), ConnectorTool("list_events", "List Events", "List events")]),
    ConnectorDefinition("calendly", "Calendly", "Scheduling automation", "productivity", "\U0001F4C5", "api_key", "https://api.calendly.com",
        tools=[ConnectorTool("list_events", "List Events", "List scheduled events")]),

    # Storage
    ConnectorDefinition("google_drive", "Google Drive", "Cloud storage", "storage", "\U0001F4C1", "oauth2", "https://www.googleapis.com/drive/v3",
        tools=[ConnectorTool("upload_file", "Upload", "Upload a file"), ConnectorTool("search_files", "Search", "Search files"), ConnectorTool("download_file", "Download", "Download a file")]),
    ConnectorDefinition("dropbox", "Dropbox", "File hosting", "storage", "\U0001F4E6", "oauth2", "https://api.dropboxapi.com/2",
        tools=[ConnectorTool("upload_file", "Upload", "Upload a file"), ConnectorTool("list_files", "List Files", "List files")]),
    ConnectorDefinition("box", "Box", "Enterprise content", "storage", "\U0001F4E6", "oauth2", "https://api.box.com/2.0",
        tools=[ConnectorTool("upload_file", "Upload", "Upload a file"), ConnectorTool("search_files", "Search", "Search files")]),

    # Commerce
    ConnectorDefinition("stripe", "Stripe", "Payment processing", "commerce", "\U0001F4B3", "api_key", "https://api.stripe.com/v1",
        tools=[ConnectorTool("create_charge", "Charge", "Create a charge"), ConnectorTool("list_customers", "List Customers", "List customers"), ConnectorTool("create_invoice", "Invoice", "Create an invoice")]),
    ConnectorDefinition("shopify", "Shopify", "E-commerce platform", "commerce", "\U0001F6CD\uFE0F", "api_key", "https://admin.shopify.com/api/2024-01",
        tools=[ConnectorTool("list_products", "List Products", "List products"), ConnectorTool("create_order", "Create Order", "Create an order")]),
    ConnectorDefinition("quickbooks", "QuickBooks", "Accounting", "commerce", "\U0001F4B0", "oauth2", "https://quickbooks.api.intuit.com/v3",
        tools=[ConnectorTool("create_invoice", "Invoice", "Create an invoice"), ConnectorTool("list_customers", "Customers", "List customers")]),
    ConnectorDefinition("xero", "Xero", "Cloud accounting", "commerce", "\U0001F4B0", "oauth2", "https://api.xero.com/api.xro/2.0",
        tools=[ConnectorTool("create_invoice", "Invoice", "Create an invoice")]),

    # Social
    ConnectorDefinition("twitter", "Twitter/X", "Social platform", "social", "\U0001F426", "oauth2", "https://api.twitter.com/2",
        tools=[ConnectorTool("post_tweet", "Tweet", "Post a tweet"), ConnectorTool("search_tweets", "Search", "Search tweets")]),
    ConnectorDefinition("linkedin", "LinkedIn", "Professional network", "social", "\U0001F4BC", "oauth2", "https://api.linkedin.com/v2",
        tools=[ConnectorTool("create_post", "Post", "Create a post"), ConnectorTool("search_people", "Search", "Search people")]),
    ConnectorDefinition("youtube", "YouTube", "Video platform", "social", "\U0001F3AC", "oauth2", "https://www.googleapis.com/youtube/v3",
        tools=[ConnectorTool("search_videos", "Search", "Search videos"), ConnectorTool("get_video", "Get Video", "Get video details")]),
    ConnectorDefinition("spotify", "Spotify", "Music streaming", "social", "\U0001F3B5", "oauth2", "https://api.spotify.com/v1",
        tools=[ConnectorTool("search", "Search", "Search music")]),

    # Cloud
    ConnectorDefinition("aws", "AWS", "Cloud infrastructure", "cloud", "\u2601\uFE0F", "custom", "",
        tools=[ConnectorTool("s3_upload", "S3 Upload", "Upload to S3"), ConnectorTool("s3_list", "S3 List", "List S3 objects"), ConnectorTool("lambda_invoke", "Lambda Invoke", "Invoke a Lambda")]),
    ConnectorDefinition("vercel", "Vercel", "Frontend deployment", "cloud", "\u25B2", "api_key", "https://api.vercel.com",
        tools=[ConnectorTool("list_deployments", "Deployments", "List deployments"), ConnectorTool("create_deployment", "Deploy", "Create deployment")]),
    ConnectorDefinition("cloudflare", "Cloudflare", "Edge platform", "cloud", "\U0001F310", "api_key", "https://api.cloudflare.com/client/v4",
        tools=[ConnectorTool("list_zones", "Zones", "List DNS zones"), ConnectorTool("purge_cache", "Purge Cache", "Purge cache")]),

    # Support
    ConnectorDefinition("zendesk", "Zendesk", "Customer support", "support", "\U0001F3AB", "api_key", "https://api.zendesk.com/api/v2",
        tools=[ConnectorTool("create_ticket", "Create Ticket", "Create a ticket"), ConnectorTool("search_tickets", "Search", "Search tickets")]),
    ConnectorDefinition("intercom", "Intercom", "Customer messaging", "support", "\U0001F4AC", "api_key", "https://api.intercom.io",
        tools=[ConnectorTool("create_conversation", "Create Conversation", "Start a conversation"), ConnectorTool("search_contacts", "Search", "Search contacts")]),

    # Marketing
    ConnectorDefinition("mailchimp", "Mailchimp", "Email marketing", "marketing", "\U0001F4E8", "api_key", "https://api.mailchimp.com/3.0",
        tools=[ConnectorTool("create_campaign", "Campaign", "Create a campaign"), ConnectorTool("list_subscribers", "Subscribers", "List subscribers")]),
    ConnectorDefinition("webflow", "Webflow", "Visual web builder", "marketing", "\U0001F310", "api_key", "https://api.webflow.com/v2",
        tools=[ConnectorTool("list_sites", "Sites", "List sites"), ConnectorTool("publish_site", "Publish", "Publish a site")]),

    # Design
    ConnectorDefinition("figma", "Figma", "Design collaboration", "design", "\U0001F3A8", "api_key", "https://api.figma.com/v1",
        tools=[ConnectorTool("get_file", "Get File", "Get a Figma file"), ConnectorTool("list_projects", "Projects", "List projects")]),

    # AI & Search
    ConnectorDefinition("openai", "OpenAI", "AI models", "ai", "\U0001F916", "api_key", "https://api.openai.com/v1",
        tools=[ConnectorTool("chat", "Chat", "Chat completion"), ConnectorTool("embeddings", "Embeddings", "Generate embeddings")]),
    ConnectorDefinition("brave_search", "Brave Search", "Web search API", "ai", "\U0001F50D", "api_key", "https://api.search.brave.com/res/v1",
        tools=[ConnectorTool("web_search", "Web Search", "Search the web"), ConnectorTool("news_search", "News Search", "Search news")]),
    ConnectorDefinition("pinecone", "Pinecone", "Vector database", "ai", "\U0001F333", "api_key", "https://api.pinecone.io",
        tools=[ConnectorTool("upsert", "Upsert", "Upsert vectors"), ConnectorTool("query", "Query", "Query vectors")]),

    # Automation
    ConnectorDefinition("zapier", "Zapier", "Workflow automation", "automation", "\u26A1", "api_key", "https://api.zapier.com",
        tools=[ConnectorTool("trigger_zap", "Trigger", "Trigger a Zap")]),
    ConnectorDefinition("make", "Make", "Visual automation", "automation", "\u26A1", "api_key", "https://api.make.com",
        tools=[ConnectorTool("run_scenario", "Run Scenario", "Run a scenario")]),

    # Enterprise
    ConnectorDefinition("sap", "SAP", "Enterprise ERP", "enterprise", "\U0001F3E2", "oauth2", "",
        tools=[ConnectorTool("read_entity", "Read", "Read an entity"), ConnectorTool("create_entity", "Create", "Create an entity")]),
    ConnectorDefinition("docusign", "DocuSign", "E-signatures", "enterprise", "\u270D\uFE0F", "oauth2", "https://api.docusign.com",
        tools=[ConnectorTool("send_envelope", "Send", "Send for signature"), ConnectorTool("get_envelope", "Get", "Get envelope status")]),

    # Analytics
    ConnectorDefinition("google_analytics", "Google Analytics", "Web analytics", "analytics", "\U0001F4CA", "oauth2", "https://analyticsdata.googleapis.com",
        tools=[ConnectorTool("run_report", "Report", "Run an analytics report")]),
    ConnectorDefinition("google_ads", "Google Ads", "Ad platform", "analytics", "\U0001F4B5", "oauth2", "https://googleads.googleapis.com",
        tools=[ConnectorTool("list_campaigns", "Campaigns", "List campaigns")]),
]

_INDEX: dict[str, ConnectorDefinition] = {c.id: c for c in _CONNECTORS}


def get_connector(connector_id: str) -> ConnectorDefinition | None:
    """Get a connector by ID."""
    return _INDEX.get(connector_id)


def get_all_connectors() -> list[ConnectorDefinition]:
    """Get all 49 connectors."""
    return list(_CONNECTORS)


def get_connector_ids() -> list[str]:
    """Get all connector IDs."""
    return list(_INDEX.keys())