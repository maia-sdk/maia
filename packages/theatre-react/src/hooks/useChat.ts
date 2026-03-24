/**
 * useChat — one-line React hook for streaming AI chat.
 *
 * Usage:
 *   const { messages, input, setInput, send, isLoading } = useChat({
 *     url: "/api/chat",
 *   });
 *
 * Drop-in embeddable chat for any React app.
 */
import { useCallback, useRef, useState } from "react";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export interface UseChatOptions {
  /** API endpoint that accepts POST { message } and returns SSE stream. */
  url: string;
  /** Custom headers (e.g., auth tokens). */
  headers?: Record<string, string>;
  /** Initial messages. */
  initialMessages?: ChatMessage[];
  /** Callback when a complete response arrives. */
  onResponse?: (message: ChatMessage) => void;
  /** Callback on error. */
  onError?: (error: Error) => void;
}

export interface UseChatReturn {
  messages: ChatMessage[];
  input: string;
  setInput: (value: string) => void;
  send: (message?: string) => Promise<void>;
  isLoading: boolean;
  error: Error | null;
  clear: () => void;
}

export function useChat(options: UseChatOptions): UseChatReturn {
  const { url, headers, initialMessages, onResponse, onError } = options;
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages ?? []);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const send = useCallback(async (text?: string) => {
    const msg = (text ?? input).trim();
    if (!msg) return;

    const userMessage: ChatMessage = { role: "user", content: msg, timestamp: new Date().toISOString() };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    setError(null);

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...headers },
        body: JSON.stringify({ message: msg }),
        signal: controller.signal,
      });

      if (!response.ok) throw new Error(`Chat API returned ${response.status}`);

      // Handle SSE streaming
      if (response.headers.get("content-type")?.includes("text/event-stream") && response.body) {
        let content = "";
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith("data: ")) continue;
            const data = trimmed.slice(6);
            if (data === "[DONE]") break;
            try {
              const parsed = JSON.parse(data);
              const chunk = parsed?.choices?.[0]?.delta?.content ?? parsed?.content ?? parsed?.text ?? "";
              if (chunk) content += chunk;
            } catch {
              if (data && !data.startsWith("{")) content += data;
            }
          }

          // Update message in real-time
          setMessages((prev) => {
            const updated = [...prev];
            const last = updated[updated.length - 1];
            if (last?.role === "assistant") {
              updated[updated.length - 1] = { ...last, content };
            } else {
              updated.push({ role: "assistant", content, timestamp: new Date().toISOString() });
            }
            return updated;
          });
        }

        const assistantMsg: ChatMessage = { role: "assistant", content, timestamp: new Date().toISOString() };
        onResponse?.(assistantMsg);
      } else {
        // Handle JSON response
        const data = await response.json();
        const content = data?.content ?? data?.message ?? data?.text ?? data?.answer ?? JSON.stringify(data);
        const assistantMsg: ChatMessage = { role: "assistant", content, timestamp: new Date().toISOString() };
        setMessages((prev) => [...prev, assistantMsg]);
        onResponse?.(assistantMsg);
      }
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
      const e = err instanceof Error ? err : new Error(String(err));
      setError(e);
      onError?.(e);
    } finally {
      setIsLoading(false);
    }
  }, [url, headers, input, onResponse, onError]);

  const clear = useCallback(() => {
    setMessages(initialMessages ?? []);
    setInput("");
    setError(null);
  }, [initialMessages]);

  return { messages, input, setInput, send, isLoading, error, clear };
}