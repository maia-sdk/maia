export type PreviewTab = "browser" | "document" | "email" | "system";

export type ActivityEventLike = {
  event_id: string;
  run_id: string;
  seq?: number;
  ts?: string;
  status?: string;
  event_type: string;
  title: string;
  detail: string;
  timestamp: string;
  data?: Record<string, unknown>;
  metadata: Record<string, unknown>;
};
