/**
 * AgentBubble — a single agent message in the team conversation.
 */
import React from "react";
import type {
  ACPChallenge,
  ACPChallengeResolution,
  ACPEvent,
  ACPMessage,
  ACPCapabilities,
} from "@maia/acp";

export interface AgentBubbleProps {
  event: ACPEvent;
  agents?: Map<string, ACPCapabilities>;
  showThinking?: boolean;
  isReply?: boolean;
}

const INTENT_STYLE: Record<string, { label: string; bg: string; text: string; border: string }> = {
  propose:   { label: "Proposes",   bg: "bg-blue-50",    text: "text-blue-700",    border: "border-blue-200" },
  challenge: { label: "Challenges", bg: "bg-red-50",     text: "text-red-700",     border: "border-red-200" },
  clarify:   { label: "Asks",       bg: "bg-amber-50",   text: "text-amber-700",   border: "border-amber-200" },
  review:    { label: "Reviews",    bg: "bg-purple-50",  text: "text-purple-700",  border: "border-purple-200" },
  handoff:   { label: "Hands off",  bg: "bg-green-50",   text: "text-green-700",   border: "border-green-200" },
  summarize: { label: "Summarizes", bg: "bg-gray-50",    text: "text-gray-600",    border: "border-gray-200" },
  agree:     { label: "Agrees",     bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
  escalate:  { label: "Escalates",  bg: "bg-orange-50",  text: "text-orange-700",  border: "border-orange-200" },
  defended:  { label: "Defends",    bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
  retracted: { label: "Retracts",   bg: "bg-rose-50",    text: "text-rose-700",    border: "border-rose-200" },
  reframed:  { label: "Reframes",   bg: "bg-sky-50",     text: "text-sky-700",     border: "border-sky-200" },
  resolved:  { label: "Resolves",   bg: "bg-slate-50",   text: "text-slate-700",   border: "border-slate-200" },
  escalated: { label: "Escalates",  bg: "bg-orange-50",  text: "text-orange-700",  border: "border-orange-200" },
};

const COLORS = ["#8B5CF6", "#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#EC4899", "#6366F1", "#14B8A6"];

function hashColor(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = id.charCodeAt(i) + ((h << 5) - h);
  return COLORS[Math.abs(h) % COLORS.length];
}

function initials(name: string): string {
  return name.replace("agent://", "").split(/[_\-\s]+/).map((w) => w[0]?.toUpperCase() ?? "").slice(0, 2).join("");
}

function formatTime(ts: string): string {
  try { return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }); }
  catch { return ""; }
}

export function AgentBubble({ event, agents, showThinking, isReply }: AgentBubbleProps) {
  const msg = event.payload as unknown as ACPMessage;
  const challenge = event.payload as unknown as ACPChallenge;
  const resolution = event.payload as unknown as ACPChallengeResolution;
  const agentId =
    event.event_type === "challenge"
      ? challenge.challenger
      : event.event_type === "challenge_resolution"
        ? resolution.resolver_agent_id
        : msg.from ?? event.agent_id;
  const name = agentId.replace("agent://", "");
  const caps = agents?.get(agentId);
  const p = caps?.personality;
  const color = p?.avatar_color ?? hashColor(agentId);
  const styleKey =
    event.event_type === "challenge"
      ? "challenge"
      : event.event_type === "challenge_resolution"
        ? resolution.outcome
        : msg.intent;
  const style = INTENT_STYLE[styleKey] ?? INTENT_STYLE.propose;
  const content =
    event.event_type === "challenge"
      ? challenge.reason
      : event.event_type === "challenge_resolution"
        ? resolution.summary
        : msg.content;
  const metaChip =
    event.event_type === "challenge"
      ? challenge.claim_excerpt
      : event.event_type === "challenge_resolution" && resolution.claim_id
        ? `claim ${resolution.claim_id}`
        : "";

  return (
    <div className={`flex gap-3 ${isReply ? "ml-10" : ""} py-2`}>
      <div
        className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-[13px] font-semibold text-white"
        style={{ backgroundColor: color }}
      >
        {p?.avatar_emoji ?? initials(caps?.name ?? name)}
      </div>

      <div className={`min-w-0 flex-1 rounded-xl border px-4 py-2.5 ${style.bg} ${style.border}`}>
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-semibold text-gray-900 dark:text-gray-100">
            {caps?.name ?? name}
          </span>
          {caps?.role && <span className="text-[11px] text-gray-400">{caps.role}</span>}
          <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${style.text} ${style.bg}`}>
            {style.label}
          </span>
          <span className="ml-auto text-[10px] text-gray-300">{formatTime(event.timestamp)}</span>
        </div>

          {event.event_type === "message" && showThinking && msg.thinking && (
            <div className="mt-1.5 rounded-lg bg-yellow-50 px-3 py-1.5 text-[12px] italic text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-300">
              {msg.thinking}
            </div>
          )}

          <div className="mt-1 text-[13px] leading-relaxed text-gray-700 dark:text-gray-300">
            {content}
          </div>

          {metaChip && (
            <div className="mt-2 rounded-lg bg-white/60 px-2.5 py-1.5 text-[11px] text-gray-600">
              {metaChip}
            </div>
          )}

          {event.event_type === "message" && msg.artifacts && msg.artifacts.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {(msg.artifacts as any[]).map((art, i) => (
                <span key={i} className="rounded-md bg-white/60 px-2 py-0.5 text-[11px] font-medium text-gray-600">
                {art.title ?? art.kind}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
