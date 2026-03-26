import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { ConversationThread } from "./ConversationThread";
import {
  toConversationRoster,
  toConversationGroups,
  toTimestamp,
  type ConversationRow,
} from "../model";

type ConversationPanelProps = {
  rows: ConversationRow[];
  loading?: boolean;
  loadError?: string;
  onRefresh?: (() => void | Promise<void>) | null;
  title?: string;
  emptyLabel?: string;
  refreshingLabel?: string;
  autoRefreshEnabled?: boolean;
  refreshLabel?: string;
};

export function ConversationPanel({
  rows,
  loading = false,
  loadError = "",
  onRefresh = null,
  title = "Team conversation",
  emptyLabel = "No agent-to-agent messages were recorded for this run yet.",
  refreshingLabel = "Loading collaboration logs...",
  autoRefreshEnabled = false,
  refreshLabel = "Refresh",
}: ConversationPanelProps) {
  const [autoFollow, setAutoFollow] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const listEndRef = useRef<HTMLDivElement>(null);

  const groups = useMemo(() => toConversationGroups(rows), [rows]);
  const roster = useMemo(() => toConversationRoster(rows), [rows]);
  const latestRowKey = useMemo(() => {
    const lastRow = rows[rows.length - 1];
    if (!lastRow) {
      return "";
    }
    return [
      lastRow.timestamp,
      String(lastRow.from_agent || "").trim().toLowerCase(),
      String(lastRow.to_agent || "").trim().toLowerCase(),
      String(lastRow.message || "").trim().toLowerCase(),
      lastRow.entry_type,
    ].join("|");
  }, [rows]);

  useEffect(() => {
    if (!latestRowKey) {
      return;
    }
    requestAnimationFrame(() => {
      if (!autoFollow) {
        return;
      }
      listEndRef.current?.scrollIntoView({ block: "end", behavior: "smooth" });
    });
  }, [autoFollow, latestRowKey]);

  const hasRows = rows.length > 0;
  const isLive = useMemo(() => {
    const lastRow = rows[rows.length - 1];
    return Boolean(lastRow) && Date.now() - toTimestamp(lastRow.timestamp) < 45_000;
  }, [rows]);
  const handleThreadScroll = useCallback(() => {
    const node = containerRef.current;
    if (!node) {
      return;
    }
    const distanceFromBottom = node.scrollHeight - node.scrollTop - node.clientHeight;
    setAutoFollow(distanceFromBottom < 80);
  }, []);

  return (
    <section className="mt-0 flex min-h-0 flex-col rounded-[24px] border border-[#e5e7eb] bg-[linear-gradient(180deg,#ffffff_0%,#fbfdff_100%)] p-4 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-[#111827]">
          <span className="text-[12px]">Team</span>
          <p className="text-[13px] font-semibold">{title}</p>
          {hasRows ? (
            <span className="rounded-full border border-[#e4e7ec] bg-[#f8fafc] px-2 py-0.5 text-[10px] font-semibold text-[#475467]">
              {rows.length}
            </span>
          ) : null}
          {isLive ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-[#bbf7d0] bg-[#ecfdf3] px-2 py-0.5 text-[10px] font-semibold text-[#027a48]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#12b76a]" />
              Live
            </span>
          ) : null}
        </div>
        {onRefresh ? (
          <button
            type="button"
            onClick={() => {
              void onRefresh();
            }}
            className="inline-flex items-center gap-1 rounded-full border border-[#d0d5dd] bg-white px-2.5 py-1 text-[11px] font-semibold text-[#344054] hover:bg-[#f9fafb]"
          >
            <span className={loading ? "animate-spin" : ""}>↻</span>
            {refreshLabel}
          </button>
        ) : null}
      </div>

      {loading && !hasRows ? (
        <div className="flex items-center gap-2 rounded-xl border border-[#eaecf0] bg-[#f8fafc] px-3 py-2 text-[12px] text-[#475467]">
          <span className="animate-spin">↻</span>
          {refreshingLabel}
        </div>
      ) : null}

      {loadError ? (
        <p className="mb-2 rounded-xl border border-[#fecaca] bg-[#fff1f2] px-3 py-2 text-[12px] text-[#b42318]">
          {loadError}
        </p>
      ) : null}

      {roster.length > 0 ? (
        <div className="mb-3 overflow-x-auto rounded-[20px] border border-[#eaecf0] bg-white/90 px-2 py-2">
          <div className="flex min-w-max gap-2">
            {roster.map((member) => {
              const statusStyles =
                member.status === "active"
                  ? "border-[#bbf7d0] bg-[#ecfdf3] text-[#027a48]"
                  : member.status === "engaged"
                    ? "border-[#fed7aa] bg-[#fff7ed] text-[#c4320a]"
                    : member.status === "watching"
                      ? "border-[#d9d6fe] bg-[#f5f3ff] text-[#6941c6]"
                      : "border-[#e4e7ec] bg-[#f8fafc] text-[#475467]";

              return (
                <div
                  key={member.id}
                  className="min-w-[168px] rounded-[18px] border border-[#e4e7ec] bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] px-3 py-2 shadow-[0_1px_2px_rgba(16,24,40,0.04)]"
                >
                  <div className="flex items-start gap-2">
                    <span
                      className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/80 text-[10px] font-semibold text-[#1f2937] shadow-[0_1px_2px_rgba(16,24,40,0.08)]"
                      style={{ backgroundColor: member.avatarColor }}
                    >
                      {member.avatarLabel}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <p className="truncate text-[12px] font-semibold text-[#111827]">{member.name}</p>
                        <span className={`rounded-full border px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.04em] ${statusStyles}`}>
                          {member.status}
                        </span>
                      </div>
                      {member.role ? (
                        <p className="truncate text-[10px] text-[#667085]">{member.role}</p>
                      ) : null}
                    </div>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    <span className="rounded-full bg-[#f8fafc] px-2 py-0.5 text-[10px] font-medium text-[#475467]">
                      {member.threadCount} {member.threadCount === 1 ? "thread" : "threads"}
                    </span>
                    {member.pendingAckCount > 0 ? (
                      <span className="rounded-full border border-[#fcd34d] bg-[#fffbeb] px-2 py-0.5 text-[10px] font-semibold text-[#b54708]">
                        {member.pendingAckCount} waiting
                      </span>
                    ) : null}
                    {member.mentionCount > 0 ? (
                      <span className="rounded-full border border-[#dbeafe] bg-[#eff6ff] px-2 py-0.5 text-[10px] font-medium text-[#1d4ed8]">
                        {member.mentionCount} mentions
                      </span>
                    ) : null}
                  </div>
                  {member.focusLabel ? (
                    <p className="mt-2 text-[10px] leading-[1.45] text-[#667085]">
                      Focus: {member.focusLabel}
                    </p>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      {!loading && !hasRows ? (
        <p className="rounded-xl border border-[#eaecf0] bg-[#f8fafc] px-3 py-2 text-[12px] text-[#667085]">
          {emptyLabel}
        </p>
      ) : null}

      {hasRows ? (
        <ConversationThread
          groups={groups}
          isLive={isLive}
          containerRef={containerRef}
          listEndRef={listEndRef}
          onScroll={handleThreadScroll}
        />
      ) : null}

      {hasRows ? (
        <div className="mt-3 flex items-center justify-between rounded-2xl border border-[#eaecf0] bg-white px-3 py-2 text-[11px] text-[#667085]">
          <span className="truncate">
            {isLive || autoRefreshEnabled ? "Following latest teammate messages." : "Conversation synced from the latest run."}
          </span>
          <span className="shrink-0 font-medium text-[#98a2b3]">
            {autoFollow ? "Auto-scroll on" : "Auto-scroll paused"}
          </span>
        </div>
      ) : null}
    </section>
  );
}

export type { ConversationPanelProps };
