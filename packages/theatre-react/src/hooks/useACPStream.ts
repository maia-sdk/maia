/**
 * useACPStream — React hook that connects to an SSE endpoint and yields
 * typed ACP events. Works with both ACP-native and non-ACP streams.
 *
 * Usage:
 *   const { events, messages, agents, cost, connected } = useACPStream({
 *     url: "/acp/events",
 *   });
 */
import { useCallback, useEffect, useRef, useState } from "react";
import type { ACPEvent, ACPMessage, ACPCapabilities, CostInfo } from "@maia/acp";
import { parseSSELine } from "@maia/acp";

export interface UseACPStreamOptions {
  /** SSE endpoint URL. */
  url: string | null;
  /** Custom headers for the EventSource (not supported natively — falls back to fetch). */
  headers?: Record<string, string>;
  /** Max events to keep in buffer (default 5000). */
  maxBuffer?: number;
  /** Auto-connect on mount (default true). */
  autoConnect?: boolean;
  /** Callback for each event. */
  onEvent?: (event: ACPEvent) => void;
  /** Callback on connection error. */
  onError?: (error: Error) => void;
}

export interface ACPStreamState {
  /** All events received, ordered by sequence. */
  events: ACPEvent[];
  /** Just the message events, for rendering the team chat. */
  messages: ACPEvent[];
  /** Known agent capabilities, keyed by agent_id. */
  agents: Map<string, ACPCapabilities>;
  /** Running cost totals. */
  cost: { tokens: number; usd: number };
  /** Whether the stream is connected. */
  connected: boolean;
  /** Current run ID. */
  runId: string;
  /** Manually connect. */
  connect: () => void;
  /** Manually disconnect. */
  disconnect: () => void;
  /** Clear the event buffer. */
  clear: () => void;
}

export function useACPStream(options: UseACPStreamOptions): ACPStreamState {
  const { url, maxBuffer = 5000, autoConnect = true, onEvent, onError } = options;
  const [events, setEvents] = useState<ACPEvent[]>([]);
  const [connected, setConnected] = useState(false);
  const [runId, setRunId] = useState("");
  const agentsRef = useRef<Map<string, ACPCapabilities>>(new Map());
  const costRef = useRef({ tokens: 0, usd: 0 });
  const sourceRef = useRef<EventSource | null>(null);

  const handleEvent = useCallback(
    (event: ACPEvent) => {
      // Track run ID
      if (event.run_id) setRunId(event.run_id);

      // Track agent capabilities
      if (event.event_type === "capabilities" && event.payload) {
        const caps = event.payload as unknown as ACPCapabilities;
        agentsRef.current.set(caps.agent_id, caps);
      }

      // Track cost
      if (event.event_type === "event" && event.payload) {
        const act = event.payload as Record<string, unknown>;
        const cost = act.cost as CostInfo | undefined;
        if (cost) {
          costRef.current.tokens += cost.tokens_used ?? 0;
          costRef.current.usd += cost.cost_usd ?? 0;
        }
      }

      // Buffer event
      setEvents((prev) => {
        const next = [...prev, event];
        return next.length > maxBuffer ? next.slice(-maxBuffer) : next;
      });

      onEvent?.(event);
    },
    [maxBuffer, onEvent],
  );

  const connectFn = useCallback(() => {
    if (!url || sourceRef.current) return;

    const es = new EventSource(url);
    sourceRef.current = es;

    es.onopen = () => setConnected(true);

    es.onmessage = (evt) => {
      try {
        const parsed = JSON.parse(evt.data);
        if (parsed.acp_version) {
          handleEvent(parsed as ACPEvent);
        } else {
          // Wrap non-ACP event
          const line = `data: ${evt.data}`;
          const wrapped = parseSSELine(line);
          if (wrapped) handleEvent(wrapped);
        }
      } catch {
        // Ignore unparseable events
      }
    };

    es.onerror = () => {
      setConnected(false);
      onError?.(new Error("ACP stream disconnected"));
    };
  }, [url, handleEvent, onError]);

  const disconnectFn = useCallback(() => {
    sourceRef.current?.close();
    sourceRef.current = null;
    setConnected(false);
  }, []);

  const clearFn = useCallback(() => {
    setEvents([]);
    agentsRef.current.clear();
    costRef.current = { tokens: 0, usd: 0 };
  }, []);

  // Auto-connect
  useEffect(() => {
    if (autoConnect && url) {
      connectFn();
    }
    return () => disconnectFn();
  }, [autoConnect, url, connectFn, disconnectFn]);

  return {
    events,
    messages: events.filter((e) => e.event_type === "message"),
    agents: agentsRef.current,
    cost: costRef.current,
    connected,
    runId,
    connect: connectFn,
    disconnect: disconnectFn,
    clear: clearFn,
  };
}
