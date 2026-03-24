// ─── ACP Client ─────────────────────────────────────────────────────────────
// Connects to an ACP event stream (SSE) and provides typed message handling.
// Works in browsers and Node.js (with EventSource polyfill).

import type {
  ACPEvent,
  ACPEventMap,
  ACPMessage,
  ACPHandoff,
  ACPReview,
  ACPActivity,
  ACPClientOptions,
  ACPCapabilities,
  EventType,
} from "./types";
import { envelope } from "./builders";

type EventCallback<T = ACPEvent> = (event: T) => void;

export class ACPClient {
  readonly agentId: string;
  readonly name: string;
  readonly role: string;

  private _runId: string = "";
  private _listeners: Map<string, Set<EventCallback<any>>> = new Map();
  private _eventSource: EventSource | null = null;
  private _buffer: ACPEvent[] = [];
  private _connected = false;
  private _onError: ((error: Error) => void) | undefined;

  constructor(options: ACPClientOptions) {
    this.agentId = options.agentId;
    this.name = options.name ?? options.agentId.replace("agent://", "");
    this.role = options.role ?? "agent";
    this._onError = options.onError;

    if (options.streamUrl) {
      this.connect(options.streamUrl);
    }
  }

  // ── Connection ───────────────────────────────────────────────────────────

  connect(streamUrl: string): void {
    if (this._eventSource) {
      this._eventSource.close();
    }

    this._eventSource = new EventSource(streamUrl);

    this._eventSource.onmessage = (evt) => {
      try {
        const data = JSON.parse(evt.data);
        if (data.acp_version) {
          this._handleEvent(data as ACPEvent);
        }
      } catch {
        // Ignore non-ACP events — Theatre can still render raw SSE
      }
    };

    this._eventSource.onerror = () => {
      this._connected = false;
      this._onError?.(new Error("ACP stream disconnected"));
    };

    this._eventSource.onopen = () => {
      this._connected = true;
    };
  }

  disconnect(): void {
    this._eventSource?.close();
    this._eventSource = null;
    this._connected = false;
  }

  get connected(): boolean {
    return this._connected;
  }

  // ── Event Handling ───────────────────────────────────────────────────────

  on<K extends keyof ACPEventMap>(
    eventType: K,
    callback: EventCallback<ACPEventMap[K]>,
  ): () => void {
    if (!this._listeners.has(eventType)) {
      this._listeners.set(eventType, new Set());
    }
    this._listeners.get(eventType)!.add(callback);

    // Return unsubscribe function
    return () => {
      this._listeners.get(eventType)?.delete(callback);
    };
  }

  off<K extends keyof ACPEventMap>(
    eventType: K,
    callback: EventCallback<ACPEventMap[K]>,
  ): void {
    this._listeners.get(eventType)?.delete(callback);
  }

  private _handleEvent(event: ACPEvent): void {
    this._buffer.push(event);
    this._runId = event.run_id;

    // Fire specific listeners
    const specific = this._listeners.get(event.event_type);
    if (specific) {
      for (const cb of specific) {
        try {
          cb(event);
        } catch (err) {
          this._onError?.(err instanceof Error ? err : new Error(String(err)));
        }
      }
    }

    // Fire wildcard listeners
    const wildcard = this._listeners.get("*");
    if (wildcard) {
      for (const cb of wildcard) {
        try {
          cb(event);
        } catch (err) {
          this._onError?.(err instanceof Error ? err : new Error(String(err)));
        }
      }
    }
  }

  // ── Emit Events ──────────────────────────────────────────────────────────
  // These create ACP events and return them. The caller is responsible
  // for sending them to the stream (POST to server, WebSocket, etc.)

  emitMessage(msg: ACPMessage): ACPEvent<ACPMessage> {
    return envelope(this.agentId, this._runId, "message", msg);
  }

  emitHandoff(ho: ACPHandoff): ACPEvent<ACPHandoff> {
    return envelope(this.agentId, this._runId, "handoff", ho);
  }

  emitReview(rev: ACPReview): ACPEvent<ACPReview> {
    return envelope(this.agentId, this._runId, "review", rev);
  }

  emitActivity(act: ACPActivity): ACPEvent<ACPActivity> {
    return envelope(this.agentId, this._runId, "event", act);
  }

  emitCapabilities(caps: ACPCapabilities): ACPEvent<ACPCapabilities> {
    return envelope(this.agentId, this._runId, "capabilities", caps);
  }

  // ── Buffer / Replay ──────────────────────────────────────────────────────

  get events(): readonly ACPEvent[] {
    return this._buffer;
  }

  get runId(): string {
    return this._runId;
  }

  clearBuffer(): void {
    this._buffer = [];
  }

  /**
   * Get all messages in the current run, ordered by sequence.
   */
  messages(): ACPEvent<ACPMessage>[] {
    return this._buffer
      .filter((e): e is ACPEvent<ACPMessage> => e.event_type === "message")
      .sort((a, b) => (a.sequence ?? 0) - (b.sequence ?? 0));
  }

  /**
   * Get the conversation thread — messages grouped by thread_id.
   */
  threads(): Map<string, ACPEvent<ACPMessage>[]> {
    const threads = new Map<string, ACPEvent<ACPMessage>[]>();
    for (const msg of this.messages()) {
      const threadId = (msg.payload as ACPMessage).context?.thread_id ?? "default";
      if (!threads.has(threadId)) {
        threads.set(threadId, []);
      }
      threads.get(threadId)!.push(msg);
    }
    return threads;
  }

  /**
   * Get total cost across all events in this run.
   */
  totalCost(): { tokens: number; usd: number } {
    let tokens = 0;
    let usd = 0;
    for (const event of this._buffer) {
      if (event.event_type === "event") {
        const act = event.payload as ACPActivity;
        if (act.cost) {
          tokens += act.cost.tokens_used ?? 0;
          usd += act.cost.cost_usd ?? 0;
        }
      }
    }
    return { tokens, usd };
  }
}
