export type PreviewTab = "browser" | "document" | "email" | "system";

export type ActivityEventLike = {
  event_id: string;
  event_index?: number;
  run_id: string;
  event_family?: string;
  snapshot_ref?: string | null;
  seq?: number;
  stage?: string;
  ts?: string;
  status?: string;
  event_type: string;
  type?: string;
  title: string;
  detail: string;
  timestamp: string;
  data?: Record<string, unknown>;
  metadata: Record<string, unknown>;
};
