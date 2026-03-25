/**
 * EditorSurface — VS Code-like code/text editor in Theatre.
 * Line numbers, syntax coloring, blinking cursor, file tabs.
 */
import React from "react";
import type { SurfaceState } from "./types";

const EXT_LANGS: Record<string, string> = {
  ts: "TypeScript", tsx: "TypeScript", js: "JavaScript", jsx: "JavaScript",
  py: "Python", go: "Go", rs: "Rust", java: "Java", rb: "Ruby",
  c: "C", cpp: "C++", sh: "Shell", md: "Markdown", json: "JSON",
  html: "HTML", css: "CSS", sql: "SQL", yaml: "YAML", yml: "YAML",
};

function detectLang(title: string, language?: string): string {
  if (language) return language;
  const ext = (title || "").split(".").pop()?.toLowerCase() || "";
  return EXT_LANGS[ext] || "Plaintext";
}

function colorize(line: string): string {
  return line
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/\/\/.*/g, '<span class="text-gray-500 italic">$&</span>')
    .replace(/#.*/g, '<span class="text-gray-500 italic">$&</span>')
    .replace(/\b(import|from|export|const|let|var|function|return|if|else|async|await|new|class|interface|type|def|for|while|in|of|try|catch|throw)\b/g, '<span class="text-purple-400">$&</span>')
    .replace(/'[^']*'|"[^"]*"|`[^`]*`/g, '<span class="text-green-400">$&</span>')
    .replace(/\b(\d+\.?\d*)\b/g, '<span class="text-orange-400">$&</span>');
}

export function EditorSurface({ surface }: { surface: SurfaceState }) {
  const text = surface.text || surface.content || "";
  const lines = text.split("\n");
  const lang = detectLang(surface.title || "", surface.language);
  const isCode = lang !== "Plaintext" && lang !== "Markdown";

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
      {/* Tab bar */}
      <div className="flex items-center border-b border-[#313244] bg-[#181825]">
        <div className="flex items-center gap-1.5 border-t-2 border-purple-500 bg-[#1e1e2e] px-3 py-1.5 text-[12px] font-medium text-gray-300">
          {surface.title || "untitled"}
        </div>
      </div>

      {/* Code body */}
      <div className={`flex-1 overflow-auto ${isCode ? "bg-[#1e1e2e]" : "bg-white dark:bg-[#1e1e2e]"}`}>
        {lines.length > 0 && text ? (
          <table className="w-full border-collapse">
            <tbody>
              {lines.map((line, i) => (
                <tr key={i} className="hover:bg-white/[0.03]">
                  <td className="select-none border-r border-[#313244] px-3 py-0 text-right align-top font-mono text-[12px] text-[#585b70]" style={{ width: 48, minWidth: 48 }}>
                    {i + 1}
                  </td>
                  <td className="px-4 py-0 font-mono text-[12px] leading-[1.7] text-[#cdd6f4] whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: colorize(line) || "&nbsp;" }} />
                </tr>
              ))}
              <tr>
                <td className="border-r border-[#313244] px-3 text-right font-mono text-[12px] text-[#585b70]">&nbsp;</td>
                <td className="px-4"><span className="inline-block h-[14px] w-[2px] animate-pulse bg-purple-400" /></td>
              </tr>
            </tbody>
          </table>
        ) : (
          <div className="flex h-full items-center justify-center">
            <span className="inline-block h-[14px] w-[2px] animate-pulse bg-purple-400" />
          </div>
        )}
      </div>

      {/* Status bar */}
      <div className="flex items-center justify-between border-t border-[#313244] bg-[#181825] px-3 py-1">
        <span className="text-[10px] text-[#585b70]">Ln {lines.length}, Col 1</span>
        <span className="text-[10px] text-[#585b70]">UTF-8</span>
        <span className="text-[10px] text-[#585b70]">{lang}</span>
        <span className="text-[10px] text-[#585b70]">{surface.agentName} editing</span>
      </div>
    </div>
  );
}