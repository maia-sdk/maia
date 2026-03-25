/**
 * ACP Client — connects to the SSE server and prints events.
 *
 * Usage:
 *   # Start the server first:
 *   npx tsx server.ts
 *
 *   # Then run this client:
 *   npx tsx client.ts
 */

const url = process.argv[2] || "http://localhost:8765/acp/events";

console.log(`\n  Connecting to ${url}\n`);

const response = await fetch(url, {
  headers: { Accept: "text/event-stream" },
});

if (!response.ok || !response.body) {
  console.error(`  Failed: ${response.status}`);
  process.exit(1);
}

const reader = response.body.getReader();
const decoder = new TextDecoder();
let buffer = "";
let count = 0;

while (true) {
  const { done, value } = await reader.read();
  if (done) break;

  buffer += decoder.decode(value, { stream: true });
  const lines = buffer.split("\n");
  buffer = lines.pop() || "";

  for (const line of lines) {
    const t = line.trim();
    if (!t || !t.startsWith("data: ")) continue;
    const data = t.slice(6);
    if (data === "[DONE]") {
      console.log(`\n  Done — ${count} events received.\n`);
      process.exit(0);
    }

    try {
      const event = JSON.parse(data);
      count++;
      const type = event.event_type;
      const agent = event.agent_id.split("://")[1];
      const payload = event.payload;

      switch (type) {
        case "capabilities":
          console.log(`  [+] ${payload.name} joined (${payload.skills?.length || 0} skills)`);
          break;
        case "message":
          console.log(`  [${agent}] ${payload.content?.slice(0, 120)}`);
          break;
        case "handoff":
          console.log(`  [→] ${payload.from?.split("://")[1]} → ${payload.to?.split("://")[1]}`);
          break;
        case "event":
          console.log(`  [${payload.activity}] ${payload.detail?.slice(0, 100)}`);
          break;
        case "review":
          console.log(`  [review] ${payload.verdict} (${payload.score}) — ${payload.feedback?.slice(0, 80)}`);
          break;
        case "artifact":
          console.log(`  [artifact] ${payload.title}`);
          break;
        default:
          console.log(`  [${type}] ${JSON.stringify(payload).slice(0, 100)}`);
      }
    } catch {
      /* skip malformed */
    }
  }
}