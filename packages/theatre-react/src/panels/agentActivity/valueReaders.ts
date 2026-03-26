function readStringField(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function readNumberField(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value.trim());
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function readBooleanField(value: unknown): boolean | null {
  if (typeof value === "boolean") {
    return value;
  }
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "true" || normalized === "1" || normalized === "yes") return true;
    if (normalized === "false" || normalized === "0" || normalized === "no") return false;
  }
  return null;
}

function readStringListField(value: unknown, limit = 16): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  const cleaned = value
    .map((item) => String(item || "").trim())
    .filter((item) => item.length > 0);
  return Array.from(new Set(cleaned)).slice(0, Math.max(1, limit));
}

function readObjectListField(value: unknown, limit = 16): Array<Record<string, unknown>> {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object")
    .slice(0, Math.max(1, limit));
}

export {
  readBooleanField,
  readNumberField,
  readObjectListField,
  readStringField,
  readStringListField,
};
