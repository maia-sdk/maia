/**
 * TerminalSurface — terminal/CLI output in Theatre.
 * macOS dots, colored commands, error detection, blinking prompt.
 */
import React, { useEffect, useRef } from "react";
import type { SurfaceState } from "./types";

function classifyLine(line: string): "cmd" | "err" | "out" {
  if (line.trimStart().startsWith("$")) return "cmd";
  if (/error|fail|exception|panic|ENOENT|ERR!/i.test(line)) return "err";
  return "out";
}

export function TerminalSurface({ surface }: { surface: SurfaceState }) {
  const lines = surface.terminalLines || (surface.text || surface.content || "").split("\n");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [lines.length]);

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-lg border border-gray-700 bg-[#0d0d0d]">
      <div className="flex items-center gap-2 border-b border-gray-800 bg-[#1a1a1a] px-3 py-2">
        <div className="flex gap-1.5">
          <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
          <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
          <span className="h-3 w-3 rounded-full bg-[#28c840]" />
        </div>
        <span className="ml-2 text-[11px] text-gray-500">{surface.title || "terminal"} — {surface.agentName}</span>
      </div>
      <div className="flex-1 overflow-y-auto p-3 font-mono text-[12px] leading-[1.6]">
        {lines.map((line, i) => {
          const type = classifyLine(line);
          if (type === "cmd") {
            return (<div key={i} className="mb-0.5"><span className="text-purple-400">$ </span><span className="text-cyan-400">{line.trimStart().slice(1).trimStart()}</span></div>);
          }
          if (type === "err") return <div key={i} className="mb-0.5 text-red-400">{line}</div>;
          return <div key={i} className="mb-0.5 text-gray-400">{line}</div>;
        })}
        <div className="mt-1"><span className="text-purple-400">$ </span><span className="inline-block h-[14px] w-[2px] animate-pulse bg-green-400" /></div>
        <div ref={endRef} />
      </div>
    </div>
  );
}