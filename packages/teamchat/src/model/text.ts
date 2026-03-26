function sanitizeConversationText(value: unknown): string {
  let text = String(value || "").trim();
  if (!text) {
    return "";
  }
  text = text.replace(/\s+/g, " ").trim();
  return text;
}

export { sanitizeConversationText };
