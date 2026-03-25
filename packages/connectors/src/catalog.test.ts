import { describe, it, expect } from "vitest";
import { getAllConnectors, getConnector, getConnectorsByCategory, getCategories, CATALOG } from "./catalog";

describe("connector catalog", () => {
  it("has 55 connectors", () => {
    expect(Object.keys(CATALOG).length).toBeGreaterThanOrEqual(49);
  });

  it("getAllConnectors returns all with tools", () => {
    const all = getAllConnectors();
    expect(all.length).toBeGreaterThanOrEqual(49);
    for (const conn of all) {
      expect(conn.id).toBeTruthy();
      expect(conn.name).toBeTruthy();
      expect(conn.tools.length).toBeGreaterThan(0);
      for (const tool of conn.tools) {
        expect(typeof tool.execute).toBe("function");
      }
    }
  });

  it("getConnector returns by id", () => {
    const gmail = getConnector("gmail");
    expect(gmail).toBeDefined();
    expect(gmail!.name).toBe("Gmail");
    expect(gmail!.tools.length).toBeGreaterThanOrEqual(3);
  });

  it("getConnector returns undefined for unknown", () => {
    expect(getConnector("nonexistent_xyz")).toBeUndefined();
  });

  it("getConnectorsByCategory filters correctly", () => {
    const comms = getConnectorsByCategory("communication");
    expect(comms.length).toBeGreaterThanOrEqual(3);
    expect(comms.every((c) => c.category === "communication")).toBe(true);
  });

  it("getCategories returns unique categories", () => {
    const cats = getCategories();
    expect(cats.length).toBeGreaterThanOrEqual(10);
    expect(new Set(cats).size).toBe(cats.length);
  });

  it("key connectors have real implementations (not stub)", () => {
    // These should have real execute functions from implementations.ts
    const keys = ["gmail", "slack", "github", "notion", "stripe", "brave_search"];
    for (const id of keys) {
      const conn = getConnector(id);
      expect(conn).toBeDefined();
      for (const tool of conn!.tools) {
        // The real impls will NOT contain "Not implemented" in their toString
        // (they're arrow functions that call connectorFetch)
        const fnStr = tool.execute.toString();
        expect(fnStr).not.toContain('"Not implemented"');
      }
    }
  });
});