/**
 * AgentAvatar — consistent agent identity across Theatre.
 */
import React from "react";

export interface AgentAvatarProps {
  agentId: string;
  name?: string;
  emoji?: string;
  color?: string;
  size?: "sm" | "md" | "lg";
  mood?: string;
  activity?: string;
}

const SIZE_MAP = { sm: 28, md: 36, lg: 48 };

const DEFAULT_COLORS = [
  "#8B5CF6", "#3B82F6", "#10B981", "#F59E0B",
  "#EF4444", "#EC4899", "#6366F1", "#14B8A6",
  "#F97316", "#84CC16", "#06B6D4", "#A855F7",
];

function hashColor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  return DEFAULT_COLORS[Math.abs(hash) % DEFAULT_COLORS.length];
}

function initials(name: string): string {
  return name
    .replace("agent://", "")
    .split(/[_\-\s]+/)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .slice(0, 2)
    .join("");
}

const ACTIVITY_RING: Record<string, string> = {
  thinking: "animate-pulse border-yellow-400",
  searching: "animate-spin border-blue-400",
  writing: "border-green-400",
  reviewing: "border-purple-400",
  browsing: "border-cyan-400",
  error: "border-red-500",
  idle: "border-gray-300",
};

export function AgentAvatar({
  agentId,
  name,
  emoji,
  color,
  size = "md",
  mood,
  activity,
}: AgentAvatarProps) {
  const px = SIZE_MAP[size];
  const bg = color ?? hashColor(agentId);
  const label = name ?? agentId.replace("agent://", "");
  const ringClass = activity ? ACTIVITY_RING[activity] ?? "" : "";

  return (
    <div
      className={`relative inline-flex items-center justify-center rounded-full border-2 ${ringClass || "border-transparent"}`}
      style={{ width: px, height: px, backgroundColor: bg }}
      title={`${label}${mood ? ` (${mood})` : ""}${activity ? ` — ${activity}` : ""}`}
    >
      <span
        className="select-none font-semibold text-white"
        style={{ fontSize: px * 0.38 }}
      >
        {emoji ?? initials(label)}
      </span>

      {/* Activity dot */}
      {activity && activity !== "idle" && (
        <span
          className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border border-white ${
            activity === "error" ? "bg-red-500" : "bg-green-400"
          }`}
        />
      )}
    </div>
  );
}
