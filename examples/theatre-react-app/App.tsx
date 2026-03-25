/**
 * Theatre React App — watch agents work live.
 *
 * Usage:
 *   npm install && npm run dev
 */

import { Theatre, TeamChat, useACPStream } from "@maia/sdk/theatre";

export default function App() {
  const stream = useACPStream({ url: "http://localhost:8765/acp/events" });

  return (
    <div style={{ display: "flex", gap: 16, height: "100vh", padding: 16 }}>
      {/* Left: see agent actions (browsing, coding, searching) */}
      <div style={{ flex: 2 }}>
        <h2>Agent Actions</h2>
        <Theatre
          streamUrl="http://localhost:8765/acp/events"
          style={{ height: "80vh" }}
        />
      </div>

      {/* Right: see agent conversations */}
      <div style={{ flex: 1 }}>
        <h2>Agent Chat</h2>
        <TeamChat
          streamUrl="http://localhost:8765/acp/events"
          showThinking
          style={{ height: "80vh" }}
        />
      </div>
    </div>
  );
}