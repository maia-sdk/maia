#!/usr/bin/env node
/**
 * Maia CLI (Node.js) - stream, replay, validate, emit, init, and serve ACP events.
 */

import * as fs from "fs";
import * as http from "http";
import * as path from "path";
import { envelope, message } from "@maia/acp";
import { renderEvent, LOGO, RESET, RED, GREEN, YELLOW, CYAN, DIM, BOLD } from "./render";

const VALID_EVENT_TYPES = new Set([
  "message",
  "handoff",
  "review",
  "artifact",
  "event",
  "capabilities",
  "provenance",
  "challenge",
  "challenge_resolution",
  "decision",
  "branch_plan",
  "branch_run",
]);

function usage() {
  console.log(LOGO);
  console.log("  Usage: maia <command> [options]\n");
  console.log("    stream <url>       Live ACP stream");
  console.log("    replay <file>      Replay JSONL");
  console.log("    validate <file>    Validate events");
  console.log("    emit <url>         Send a test ACP event");
  console.log("    init [name]        Scaffold a new ACP project");
  console.log("    serve <file>       Serve JSONL as local SSE");
  console.log("    info               Version info");
  console.log("\n    --raw    Raw JSON   --speed <n>  Playback speed   --save <f>  Save stream   --port <n>  Serve port");
}

function getArg(args: string[], flag: string, fallback?: string): string | undefined {
  const index = args.indexOf(flag);
  if (index < 0) return fallback;
  return args[index + 1] ?? fallback;
}

function loadJsonl(filePath: string): Record<string, any>[] {
  return fs.readFileSync(filePath, "utf-8")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .flatMap((line) => {
      try {
        return [JSON.parse(line)];
      } catch {
        return [];
      }
    });
}

async function cmdStream(url: string, raw: boolean, savePath?: string) {
  console.log(LOGO);
  console.log(`  Connecting to ${CYAN}${url}${RESET}`);
  console.log(`  ${DIM}Press Ctrl+C to stop${RESET}\n`);

  let saveStream: fs.WriteStream | null = null;
  if (savePath) {
    saveStream = fs.createWriteStream(savePath, { flags: "a" });
    console.log(`  Saving to ${GREEN}${savePath}${RESET}\n`);
  }

  let count = 0;
  const response = await fetch(url, { headers: { Accept: "text/event-stream" } });
  if (!response.ok || !response.body) {
    console.error(`${RED}Connection failed: ${response.status}${RESET}`);
    process.exit(1);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || !trimmed.startsWith("data: ")) continue;
      const payload = trimmed.slice(6);
      if (payload === "[DONE]") break;
      try {
        const event = JSON.parse(payload);
        count += 1;
        console.log(raw ? JSON.stringify(event) : renderEvent(event));
        if (!raw) console.log();
        saveStream?.write(JSON.stringify(event) + "\n");
      } catch {
        // Skip malformed lines.
      }
    }
  }

  saveStream?.end();
  console.log(`\n  ${DIM}${count} events received.${RESET}`);
}

function cmdReplay(filePath: string, speed: number, raw: boolean) {
  console.log(LOGO);
  console.log(`  Replaying ${CYAN}${filePath}${RESET} at ${speed}x\n`);

  if (!fs.existsSync(filePath)) {
    console.error(`${RED}File not found: ${filePath}${RESET}`);
    process.exit(1);
  }

  const events = loadJsonl(filePath);
  console.log(`  ${DIM}${events.length} events loaded${RESET}\n`);

  let index = 0;
  function next() {
    if (index >= events.length) {
      console.log(`\n  ${DIM}Replay complete.${RESET}`);
      return;
    }
    console.log(raw ? JSON.stringify(events[index]) : renderEvent(events[index]));
    if (!raw) console.log();
    index += 1;
    let delay = 300;
    if (index < events.length) {
      const previousTime = Date.parse(events[index - 1].timestamp || "");
      const currentTime = Date.parse(events[index].timestamp || "");
      if (Number.isFinite(previousTime) && Number.isFinite(currentTime)) {
        delay = Math.max(50, Math.min(3000, currentTime - previousTime));
      }
    }
    setTimeout(next, delay / speed);
  }
  next();
}

function cmdValidate(filePath: string) {
  console.log(LOGO);
  console.log(`  Validating ${CYAN}${filePath}${RESET}\n`);

  if (!fs.existsSync(filePath)) {
    console.error(`${RED}File not found: ${filePath}${RESET}`);
    process.exit(1);
  }

  const required = new Set(["acp_version", "run_id", "agent_id", "event_type", "timestamp", "payload"]);
  let valid = 0;
  let invalid = 0;
  let warnings = 0;

  for (const [i, line] of fs.readFileSync(filePath, "utf-8").split("\n").entries()) {
    if (!line.trim()) continue;
    let event: Record<string, any>;
    try {
      event = JSON.parse(line);
    } catch {
      console.log(`  ${RED}Line ${i + 1}: Invalid JSON${RESET}`);
      invalid += 1;
      continue;
    }

    const missing = [...required].filter((key) => !(key in event));
    if (missing.length) {
      console.log(`  ${RED}Line ${i + 1}: Missing: ${missing.join(", ")}${RESET}`);
      invalid += 1;
      continue;
    }

    if (event.acp_version !== "1.0") {
      console.log(`  ${YELLOW}Line ${i + 1}: Version: ${event.acp_version}${RESET}`);
      warnings += 1;
    }
    if (!VALID_EVENT_TYPES.has(event.event_type)) {
      console.log(`  ${YELLOW}Line ${i + 1}: Type: ${event.event_type}${RESET}`);
      warnings += 1;
    }
    if (!String(event.agent_id || "").startsWith("agent://")) {
      console.log(`  ${YELLOW}Line ${i + 1}: agent_id format${RESET}`);
      warnings += 1;
    }
    valid += 1;
  }

  console.log(`\n  ${GREEN}${valid}${RESET} valid, ${invalid ? `${RED}${invalid}${RESET}` : `${DIM}0${RESET}`} invalid, ${warnings ? `${YELLOW}${warnings}${RESET}` : `${DIM}0${RESET}`} warnings`);
  if (invalid > 0) process.exit(1);
}

async function cmdEmit(url: string, options: { fromAgent: string; to: string; intent: string; content: string }) {
  console.log(LOGO);
  const event = envelope(
    options.fromAgent,
    `run_cli_${Date.now()}`,
    "message",
    message({
      from: options.fromAgent,
      to: options.to,
      intent: options.intent as any,
      content: options.content,
    }),
  );

  console.log(`  Sending to ${CYAN}${url}${RESET}:\n`);
  console.log(`  ${JSON.stringify(event, null, 2)}\n`);

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(event),
  });

  if (response.ok) {
    console.log(`  ${GREEN}Sent (${response.status})${RESET}`);
    return;
  }

  console.error(`  ${RED}Server returned ${response.status}${RESET}`);
  process.exit(1);
}

function cmdInit(name: string) {
  console.log(LOGO);
  console.log(`  Creating project: ${CYAN}${name}${RESET}\n`);

  const dir = path.resolve(name);
  if (fs.existsSync(dir)) {
    console.log(`  ${YELLOW}Directory '${name}' already exists.${RESET}`);
    return;
  }

  fs.mkdirSync(path.join(dir, "events"), { recursive: true });
  fs.writeFileSync(
    path.join(dir, "agent.ts"),
    [
      'import { envelope, message } from "@maia/sdk";',
      "",
      "export function run(query: string) {",
      '  const runId = `run_${Date.now()}`;',
      "  return [",
      '    envelope("agent://demo", runId, "message", message({',
      '      from: "agent://demo",',
      '      to: "agent://user",',
      '      intent: "propose",',
      "      content: `Result for: ${query}`,",
      "    })),",
      "  ];",
      "}",
      "",
      'console.log(JSON.stringify(run("Hello world")[0], null, 2));',
      "",
    ].join("\n"),
    "utf-8",
  );
  fs.writeFileSync(
    path.join(dir, "server.ts"),
    [
      'import * as http from "http";',
      'import { run } from "./agent";',
      "",
      "http.createServer((req, res) => {",
      '  if (req.url !== "/acp/events") {',
      '    res.writeHead(404);',
      '    res.end("Not found");',
      "    return;",
      "  }",
      '  res.writeHead(200, {',
      '    "Content-Type": "text/event-stream",',
      '    "Cache-Control": "no-cache",',
      '    "Access-Control-Allow-Origin": "*",',
      "  });",
      '  for (const event of run("Sample query")) {',
      '    res.write(`data: ${JSON.stringify(event)}\\n\\n`);',
      "  }",
      '  res.write("data: [DONE]\\n\\n");',
      "  res.end();",
      '}).listen(8765, () => console.log("ACP server: http://localhost:8765/acp/events"));',
      "",
    ].join("\n"),
    "utf-8",
  );

  console.log(`  ${GREEN}Created:${RESET}`);
  console.log(`    ${name}/agent.ts`);
  console.log(`    ${name}/server.ts`);
  console.log(`    ${name}/events/`);
}

function cmdServe(filePath: string, port: number, speed: number) {
  if (!fs.existsSync(filePath)) {
    console.error(`${RED}File not found: ${filePath}${RESET}`);
    process.exit(1);
  }

  const events = loadJsonl(filePath);
  const server = http.createServer(async (req, res) => {
    if (req.url !== "/acp/events") {
      res.writeHead(404);
      res.end("Not found");
      return;
    }

    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Access-Control-Allow-Origin": "*",
    });

    let prevTs: number | null = null;
    for (const event of events) {
      const currentTs = Date.parse(event.timestamp || "");
      if (prevTs && Number.isFinite(currentTs)) {
        const delay = Math.max(50, Math.min(3000, currentTs - prevTs)) / speed;
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
      prevTs = Number.isFinite(currentTs) ? currentTs : prevTs;
      res.write(`data: ${JSON.stringify(event)}\n\n`);
    }
    res.write("data: [DONE]\n\n");
    res.end();
  });

  console.log(LOGO);
  console.log(`  Serving ${CYAN}${filePath}${RESET} (${events.length} events) at ${speed}x`);
  console.log(`  ${GREEN}http://localhost:${port}/acp/events${RESET}\n`);
  console.log(`  ${DIM}Press Ctrl+C to stop${RESET}`);
  server.listen(port);
}

function cmdInfo() {
  console.log(LOGO);
  console.log(`  ${BOLD}Versions${RESET}`);
  console.log(`    CLI:  0.1.0`);
  console.log(`    Node: ${process.version}`);
  console.log(`\n  ${BOLD}Links${RESET}`);
  console.log(`    Docs:   https://docs.maia.ai`);
  console.log(`    GitHub: https://github.com/maia-sdk/maia`);
}

const args = process.argv.slice(2);
const cmd = args[0];

if (!cmd || cmd === "-h" || cmd === "--help") {
  usage();
} else if (cmd === "stream") {
  const url = args[1];
  if (!url) {
    console.error(`${RED}Usage: maia stream <url>${RESET}`);
    process.exit(1);
  }
  cmdStream(url, args.includes("--raw"), getArg(args, "--save")).catch((error) => {
    console.error(`${RED}${error}${RESET}`);
    process.exit(1);
  });
} else if (cmd === "replay") {
  if (!args[1]) {
    console.error(`${RED}Usage: maia replay <file>${RESET}`);
    process.exit(1);
  }
  cmdReplay(args[1], parseFloat(getArg(args, "--speed", "1") || "1") || 1, args.includes("--raw"));
} else if (cmd === "validate") {
  if (!args[1]) {
    console.error(`${RED}Usage: maia validate <file>${RESET}`);
    process.exit(1);
  }
  cmdValidate(args[1]);
} else if (cmd === "emit") {
  const url = args[1];
  if (!url) {
    console.error(`${RED}Usage: maia emit <url>${RESET}`);
    process.exit(1);
  }
  cmdEmit(url, {
    fromAgent: getArg(args, "--from", "agent://cli-test") || "agent://cli-test",
    to: getArg(args, "--to", "agent://broadcast") || "agent://broadcast",
    intent: getArg(args, "--intent", "propose") || "propose",
    content: getArg(args, "--content", "Hello from Maia CLI!") || "Hello from Maia CLI!",
  }).catch((error) => {
    console.error(`${RED}${error}${RESET}`);
    process.exit(1);
  });
} else if (cmd === "init") {
  cmdInit(args[1] || "my-acp-agent");
} else if (cmd === "serve") {
  if (!args[1]) {
    console.error(`${RED}Usage: maia serve <file>${RESET}`);
    process.exit(1);
  }
  cmdServe(
    args[1],
    parseInt(getArg(args, "--port", "8765") || "8765", 10) || 8765,
    parseFloat(getArg(args, "--speed", "1") || "1") || 1,
  );
} else if (cmd === "info") {
  cmdInfo();
} else {
  console.error(`${RED}Unknown command: ${cmd}${RESET}`);
  process.exit(1);
}
