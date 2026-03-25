/**
 * CalendarSurface — day view with time grid and events in Theatre.
 * 9 AM–5 PM grid, colored event blocks, title + time range.
 */
import type { SurfaceState } from "./types";

const COLORS = ["bg-blue-500", "bg-green-500", "bg-purple-500", "bg-yellow-500", "bg-pink-500", "bg-teal-500"];
const HOURS = [9, 10, 11, 12, 13, 14, 15, 16, 17];

function hourLabel(h: number): string {
  if (h === 12) return "12 PM";
  return h < 12 ? `${h} AM` : `${h - 12} PM`;
}

function parseHour(timeStr: string): number {
  const d = new Date(timeStr);
  return isNaN(d.getTime()) ? 9 : d.getHours() + d.getMinutes() / 60;
}

export function CalendarSurface({ surface }: { surface: SurfaceState }) {
  const events = surface.calendarEvents || [];

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
      <div className="flex items-center gap-2 border-b border-gray-100 bg-white px-3 py-2 dark:border-gray-700 dark:bg-gray-800">
        <svg className="h-4 w-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
        <span className="text-[13px] font-semibold text-gray-700 dark:text-gray-300">{surface.title || "Calendar"}</span>
        <span className="ml-auto text-[10px] text-gray-400">{events.length} events</span>
      </div>

      <div className="relative flex-1 overflow-y-auto">
        {/* Time grid */}
        {HOURS.map((h) => (
          <div key={h} className="flex border-b border-gray-50 dark:border-gray-800" style={{ height: 60 }}>
            <div className="w-16 shrink-0 py-1 pr-2 text-right text-[10px] text-gray-400">{hourLabel(h)}</div>
            <div className="relative flex-1 border-l border-gray-100 dark:border-gray-800" />
          </div>
        ))}

        {/* Events overlay */}
        {events.map((evt, i) => {
          const startH = parseHour(evt.start);
          const endH = parseHour(evt.end);
          const top = Math.max(0, (startH - 9) * 60);
          const height = Math.max(20, (endH - startH) * 60);
          const color = evt.color ? `bg-${evt.color}-500` : COLORS[i % COLORS.length];
          const startD = new Date(evt.start);
          const endD = new Date(evt.end);
          const timeStr = !isNaN(startD.getTime()) && !isNaN(endD.getTime())
            ? `${startD.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} – ${endD.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
            : "";

          return (
            <div
              key={i}
              className={`absolute left-16 right-2 rounded-md px-2 py-1 text-white ${color}`}
              style={{ top, height, opacity: 0.85 }}
            >
              <p className="truncate text-[11px] font-semibold">{evt.title}</p>
              {timeStr && <p className="truncate text-[9px] text-white/80">{timeStr}</p>}
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-2 border-t border-gray-100 bg-gray-50 px-3 py-1 dark:border-gray-700 dark:bg-gray-800">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-purple-400" />
        <span className="text-[11px] text-gray-400">{surface.agentName}</span>
      </div>
    </div>
  );
}