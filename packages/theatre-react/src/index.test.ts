import { describe, it, expect } from "vitest";
import {
  Theatre,
  SurfaceRenderer,
  ConnectorSkin,
  getConnectorSkin,
  hasConnectorSkin,
  getSkinnedConnectorIds,
} from "./index";

describe("theatre-react exports", () => {
  it("exports Theatre component", () => {
    expect(Theatre).toBeDefined();
    expect(typeof Theatre).toBe("function");
  });

  it("exports SurfaceRenderer component", () => {
    expect(SurfaceRenderer).toBeDefined();
    expect(typeof SurfaceRenderer).toBe("function");
  });

  it("exports ConnectorSkin component", () => {
    expect(ConnectorSkin).toBeDefined();
    expect(typeof ConnectorSkin).toBe("function");
  });
});

describe("connector skins", () => {
  it("getConnectorSkin returns palette for known connector", () => {
    const skin = getConnectorSkin("gmail");
    expect(skin.palette).toBeDefined();
    expect(skin.palette.shellGradient).toBeTruthy();
    expect(skin.descriptor.brand).toBe("Gmail");
    expect(skin.descriptor.theatreLabel).toBe("Mail");
  });

  it("getConnectorSkin returns default for unknown connector", () => {
    const skin = getConnectorSkin("nonexistent_xyz");
    expect(skin.palette).toBeDefined();
    expect(skin.descriptor.brand).toBe("nonexistent_xyz");
  });

  it("hasConnectorSkin returns true for known connectors", () => {
    expect(hasConnectorSkin("slack")).toBe(true);
    expect(hasConnectorSkin("github")).toBe(true);
    expect(hasConnectorSkin("stripe")).toBe(true);
  });

  it("hasConnectorSkin returns false for unknown", () => {
    expect(hasConnectorSkin("nonexistent_xyz")).toBe(false);
  });

  it("getSkinnedConnectorIds returns 40+ connectors", () => {
    const ids = getSkinnedConnectorIds();
    expect(ids.length).toBeGreaterThanOrEqual(40);
    expect(ids).toContain("gmail");
    expect(ids).toContain("github");
    expect(ids).toContain("notion");
  });
});