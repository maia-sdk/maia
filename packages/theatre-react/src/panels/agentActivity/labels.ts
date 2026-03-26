function desktopStatusForEventType(eventType: string, streaming: boolean): string {
  if (eventType === "desktop_starting") return "Starting secure agent desktop";
  if (eventType === "desktop_ready") return "Desktop live. Beginning execution.";
  if (eventType === "response_writing") return "Writing response while tools and evidence remain visible";
  return streaming ? "Desktop session is running live" : "Desktop replay";
}

export { desktopStatusForEventType };
