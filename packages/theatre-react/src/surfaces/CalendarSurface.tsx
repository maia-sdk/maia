/**
 * CalendarSurface — day/week view with events.
 * Shows when agents work with Google Calendar, Calendly.
 */
import React from "react";
import type { SurfaceState } from "./types";

const HOURS = [9, 10, 11, 12, 13, 14, 15, 16, 17];
const DEFAULT_COLORS = ["bg-blue-200", "bg-green-200", "bg-purple-200", "bg-yellow-200", "bg-pink-200"];

export function CalendarSurface({ surface }: { surface: SurfaceState }) {
  const events = surface.calendarEvents ?? [];

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
      <div className="flex items-center gap-2 border-b border-gray-100 bg-gray-50 px-4 py-2 dark:border-gray-700 dark:bg-gray-800">
        <span className="text-[14px]">{"\uD83D\uDCC5"}</span>
        <span className="text-[13px] font-semibold text-gray-700 dark:text-gray-300">{surface.title || "Calendar"}</span>
        <span className="text-[11px] text-gray-400">{events.length} events</span>
      </div>

      <div className="flex-1 overflow-auto">
        {events.length === 0 ? (
          <div className="flex h-full items-center justify-center text-[13px] text-gray-400">Loading calendar...</div>
        ) : (
          <div className="relative">
            {/* Time grid */}
            {HOURS.map((hour) => (
              <div key={hour} className="flex border-b border-gray-50 dark:border-gray-800" style={{ height: 48 }}>
                <div className="w-14 flex-shrink-0 py-1 pr-2 text-right text-[11px] text-gray-400">
                  {hour > 12 ? `${hour - 12} PM` : hour === 12 ? "12 PM" : `${hour} AM`}
                </div>
                <div className="flex-1 border-l border-gray-100 dark:border-gray-800" />
              </div>
            ))}

            {/* Events overlay */}
            <div className="absolute inset-0 pl-14">
              {events.map((ev, i) => {
                const startHour = parseHour(ev.start);
                const endHour = parseHour(ev.end);
                if (startHour < 0) return null;
                const top = (startHour - HOURS[0]) * 48;
                const height = Math.max(24, (endHour - startHour) * 48);
                const color = ev.color ? `bg-[${ev.color}]` : DEFAULT_COLORS[i % DEFAULT_COLORS.length];

                return (
                  <div
                    key={i}
                    className={`absolute left-1 right-1 rounded px-2 py-1 ${color}`}
                    style={{ top: Math.max(0, top), height }}
                  >
                    <div className="truncate text-[11px] font-semibold text-gray-800">{ev.title}</div>
                    <div className="text-[10px] text-gray-600">
                      {formatTime(ev.start)} - {formatTime(ev.end)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div className="border-t border-gray-100 bg-gray-50 px-3 py-1 dark:border-gray-700 dark:bg-gray-800">
        <span className="text-[11px] text-gray-400">{surface.agentName} {surface.status || "is scheduling"}</span>
      </div>
    </div>
  );
}

function parseHour(timeStr: string): number {
  try {
    const d = new Date(timeStr);
    return d.getHours() + d.getMinutes() / 60;
  } catch { return -1; }
}

function formatTime(timeStr: string): string {
  try {
    return new Date(timeStr).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch { return timeStr; }
}