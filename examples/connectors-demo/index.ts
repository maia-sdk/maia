/**
 * Connectors Demo — use any of 49 SaaS connectors.
 *
 * Usage:
 *   SLACK_BOT_TOKEN=xoxb-... npx tsx index.ts
 */

import { getConnector, getAllConnectors, BaseConnector } from "@maia/connectors";

// List all available connectors
const all = getAllConnectors();
console.log(`${all.length} connectors available:`);
for (const c of all) {
  console.log(`  ${c.iconEmoji} ${c.name} (${c.tools.length} tools)`);
}

// Use a specific connector
const slack = getConnector("slack");
if (!slack) throw new Error("Slack connector not found");

console.log("\nSlack tools:");
for (const tool of slack.tools) {
  console.log(`  - ${tool.id}: ${tool.description}`);
}

// Execute a tool (requires real credentials)
const config = {
  id: "slack",
  name: "Slack",
  description: "Send messages",
  authKind: "oauth2" as const,
  credentials: { bot_token: process.env.SLACK_BOT_TOKEN || "" },
};

if (config.credentials.bot_token) {
  const sendTool = slack.tools.find((t) => t.id === "send_message");
  if (sendTool) {
    const result = await sendTool.execute(
      { channel: "#general", text: "Hello from Maia!" },
      config,
    );
    console.log("\nResult:", result);
  }
} else {
  console.log("\nSkipping execution (no SLACK_BOT_TOKEN set)");
}