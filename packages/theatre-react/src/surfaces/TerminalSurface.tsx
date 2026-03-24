/**
 * TerminalSurface — shows command execution in Theatre.
 */
import React, { useEffect, useRef } from "react";
import type { SurfaceState } from "./types";

export function TerminalSurface({ surface }: { surface: SurfaceState }) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const lines = surface.terminalLines ?? [];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [lines.length]);

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-lg border border-gray-700 bg-gray-950">
      {/* Title bar */}
      <div className="flex items-center gap-2 border-b border-gray-800 bg-gray-900 px-3 py-1.5">
        <div className="flex gap-1">
          <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
          <span className="h-2.5 w-2.5 rounded-full bg-yellow-500" />
          <span className="h-2.5 w-2.5 rounded-full bg-green-500" />
        </div>
        <span className="text-[12px] text-gray-400">
          {surface.title || "terminal"}
        </span>
      </div>

      {/* Terminal output */}
      <div className="flex-1 overflow-auto p-3 font-mono text-[12px] text-green-400">
        {lines.map((line, i) => (
          <div key={i} className="leading-5">
            {line.startsWith("$") ? (
              <span className="text-cyan-400">{line}</span>
            ) : line.startsWith("error") || line.startsWith("Error") ? (
              <span className="text-red-400">{line}</span>
            ) : (
              <span className="text-gray-300">{line}</span>
            )}
          </div>
        ))}
        <div className="flex items-center text-green-400">
          <span>$ </span>
          <span className="inline-block h-3.5 w-1.5 animate-pulse bg-green-400" />
        </div>
        <div ref={bottomRef} />
      </div>
    </div>
  );
}