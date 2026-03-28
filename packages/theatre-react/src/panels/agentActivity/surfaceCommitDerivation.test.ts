import { describe, expect, it } from "vitest";
import { deriveSurfaceCommit } from "./surfaceCommitDerivation";
import type { ActivityEventLike } from "./types";

function makeEvent(args: {
  eventType: string;
  data?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  snapshotRef?: string | null;
}): ActivityEventLike {
  return {
    event_id: `evt-${args.eventType}`,
    run_id: "run_test",
    event_type: args.eventType,
    title: args.eventType,
    detail: args.eventType,
    timestamp: "2026-03-28T08:00:00Z",
    data: args.data,
    metadata: args.metadata,
    snapshot_ref: args.snapshotRef ?? null,
  };
}

describe("deriveSurfaceCommit", () => {
  it("keeps browser committed when later coordination events use api scene family", () => {
    const commit = deriveSurfaceCommit([
      makeEvent({
        eventType: "browser_open",
        data: {
          scene_surface: "website",
          url: "https://example.org/research",
        },
        snapshotRef: "snapshot://browser-open",
      }),
      makeEvent({
        eventType: "brain_review_started",
        data: {
          scene_family: "api",
          from_agent: "brain",
          to_agent: "researcher",
        },
      }),
    ]);

    expect(commit?.tab).toBe("browser");
    expect(commit?.surface).toBe("website");
  });

  it("does not commit placeholder browser events without renderable browser evidence", () => {
    const commit = deriveSurfaceCommit([
      makeEvent({
        eventType: "browser_navigate",
        data: {
          scene_surface: "website",
          action: "navigate",
        },
      }),
    ]);

    expect(commit).toBeNull();
  });
});
