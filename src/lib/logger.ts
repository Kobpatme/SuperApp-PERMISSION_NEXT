const sensitiveKey = /authorization|cookie|password|secret|token|api[-_]?key/i;

export function redactForLog(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(redactForLog);
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([key, nested]) => [key, sensitiveKey.test(key) ? "[REDACTED]" : redactForLog(nested)]));
  return value;
}

export function logEvent(level: "info" | "warn" | "error", event: string, context: Record<string, unknown> = {}) {
  const sanitized = redactForLog(context) as Record<string, unknown>;
  const record = JSON.stringify({ timestamp: new Date().toISOString(), level, event, ...sanitized });
  if (level === "error") console.error(record);
  else if (level === "warn") console.warn(record);
  else console.info(record);
}
