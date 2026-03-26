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

export { readNumberField, readStringField };
