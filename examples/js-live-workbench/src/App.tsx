import { useMemo, useState } from "react";
import { Theatre } from "@maia/sdk/theatre";
import { TeamChat } from "@maia/sdk/teamchat";

const serverUrl = "http://localhost:8780";

export default function App() {
  const [running, setRunning] = useState(false);
  const [status, setStatus] = useState("Idle");
  const streamUrl = useMemo(() => `${serverUrl}/acp/events`, []);

  async function runDemo() {
    setRunning(true);
    setStatus("Starting run...");
    try {
      const response = await fetch(`${serverUrl}/api/run`, { method: "POST" });
      if (!response.ok) {
        throw new Error(`Run failed: ${response.status}`);
      }
      const data = (await response.json()) as { ok: boolean; mode: string };
      setStatus(`Run started (${data.mode})`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Run failed");
    } finally {
      setRunning(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #0b1418 0%, #15262c 50%, #ece6dc 50%, #f4efe6 100%)",
        color: "#102027",
        padding: 20,
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          maxWidth: 1400,
          margin: "0 auto",
          display: "grid",
          gap: 16,
        }}
      >
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "16px 20px",
            background: "rgba(255,255,255,0.82)",
            border: "1px solid rgba(16,32,39,0.12)",
            borderRadius: 20,
            backdropFilter: "blur(8px)",
          }}
        >
          <div>
            <div style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: 1.2, opacity: 0.6 }}>
              Maia SDK
            </div>
            <h1 style={{ margin: "4px 0 0", fontSize: 28 }}>JS Live Workbench</h1>
          </div>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <span style={{ fontSize: 14, opacity: 0.75 }}>{status}</span>
            <button
              onClick={runDemo}
              disabled={running}
              style={{
                border: 0,
                borderRadius: 999,
                padding: "12px 18px",
                background: running ? "#8aa4ab" : "#0f766e",
                color: "white",
                fontWeight: 700,
                cursor: running ? "default" : "pointer",
              }}
            >
              {running ? "Running..." : "Run Demo"}
            </button>
          </div>
        </header>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1.4fr) minmax(360px, 0.9fr)",
            gap: 16,
          }}
        >
          <section
            style={{
              minHeight: "78vh",
              background: "rgba(255,255,255,0.8)",
              border: "1px solid rgba(16,32,39,0.12)",
              borderRadius: 24,
              overflow: "hidden",
            }}
          >
            <Theatre streamUrl={streamUrl} showThinking budgetUsd={10} />
          </section>

          <section
            style={{
              minHeight: "78vh",
              background: "rgba(255,255,255,0.8)",
              border: "1px solid rgba(16,32,39,0.12)",
              borderRadius: 24,
              overflow: "hidden",
            }}
          >
            <TeamChat streamUrl={streamUrl} showThinking />
          </section>
        </div>
      </div>
    </div>
  );
}
