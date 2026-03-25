import { describe, it, expect } from "vitest";
import { getRole, getAllRoles, inferRole, ROLE_CATALOG } from "./roles/index";
import { createMemoryStore, recordMemory, recallMemories } from "./memory";
import { createBrainState } from "./state";

describe("roles", () => {
  it("ROLE_CATALOG has 27 roles", () => {
    expect(Object.keys(ROLE_CATALOG).length).toBe(27);
  });

  it("getRole returns a known role (nested role.id)", () => {
    const entry = getRole("researcher");
    expect(entry).toBeDefined();
    expect(entry.role.id).toBe("researcher");
    expect(entry.role.name).toBeTruthy();
    expect(entry.personality).toBeDefined();
  });

  it("getRole falls back to researcher for unknown role", () => {
    const entry = getRole("nonexistent_role_xyz");
    expect(entry.role.id).toBe("researcher");
  });

  it("getAllRoles returns all 27", () => {
    const all = getAllRoles();
    expect(all).toHaveLength(27);
    const ids = all.map((r) => r.role.id);
    expect(ids).toContain("supervisor");
    expect(ids).toContain("coder");
    expect(ids).toContain("writer");
    expect(ids).toContain("analyst");
  });

  it("each role has required fields", () => {
    for (const entry of getAllRoles()) {
      expect(entry.role.id).toBeTruthy();
      expect(entry.role.name).toBeTruthy();
      expect(entry.role.description).toBeTruthy();
      expect(entry.personality).toBeDefined();
      expect(entry.personality.maxWords).toBeGreaterThan(0);
      expect(entry.personality.directness).toBeGreaterThanOrEqual(0);
    }
  });

  it("inferRole returns a role ID string", () => {
    const roleId = inferRole("Write a technical blog post about React hooks");
    expect(typeof roleId).toBe("string");
    expect(roleId.length).toBeGreaterThan(0);
  });

  it("inferRole returns a valid role ID from the catalog", () => {
    const tasks = [
      "Write a blog post",
      "Debug the payment code",
      "Analyze SaaS pricing data",
      "Deploy to production",
    ];
    const validIds = new Set(Object.keys(ROLE_CATALOG));
    for (const task of tasks) {
      const roleId = inferRole(task);
      expect(validIds.has(roleId)).toBe(true);
    }
  });
});

const mem = (content: string, tags: string[] = []) => ({
  agentId: "agent://test",
  runId: "run_1",
  type: "decision" as const,
  content,
  tags,
});

describe("memory", () => {
  it("creates empty store", () => {
    const store = createMemoryStore();
    expect(store).toBeDefined();
    expect(store.entries).toEqual([]);
  });

  it("records memories", () => {
    const store = createMemoryStore();
    recordMemory(store, mem("Split ACV by segment", ["pricing"]));
    recordMemory(store, mem("Report is too long", ["review"]));
    expect(store.entries).toHaveLength(2);
  });

  it("recall returns recent entries for empty query", () => {
    const store = createMemoryStore();
    recordMemory(store, mem("Do X"));
    const recalled = recallMemories(store, "");
    expect(recalled.length).toBeGreaterThanOrEqual(1);
  });

  it("recall scores by tag overlap", () => {
    const store = createMemoryStore();
    recordMemory(store, mem("Use segment pricing", ["pricing", "segment"]));
    recordMemory(store, mem("Ship to prod", ["deployment"]));
    const recalled = recallMemories(store, "pricing segment analysis");
    expect(recalled[0].content).toContain("pricing");
  });

  it("evicts oldest when over limit", () => {
    const store = createMemoryStore(3);
    recordMemory(store, mem("1"));
    recordMemory(store, mem("2"));
    recordMemory(store, mem("3"));
    recordMemory(store, mem("4"));
    expect(store.entries).toHaveLength(3);
    expect(store.entries[0].content).toBe("2");
  });
});

describe("state", () => {
  it("creates brain state with goal", () => {
    const state = createBrainState("Analyze pricing trends");
    expect(state).toBeDefined();
    expect(state.contract.goal).toBe("Analyze pricing trends");
  });

  it("initializes empty coverage", () => {
    const state = createBrainState("Test goal");
    expect(state.coverage).toBeDefined();
  });
});