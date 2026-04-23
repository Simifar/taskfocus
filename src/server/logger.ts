type LogLevel = "info" | "warn" | "error";
type LogPayload = Record<string, unknown>;

function log(level: LogLevel, label: string, payload: LogPayload = {}): void {
  const entry = JSON.stringify({
    level,
    label,
    ts: new Date().toISOString(),
    ...payload,
  });

  if (level === "error") {
    console.error(entry);
  } else if (level === "warn") {
    console.warn(entry);
  } else {
    console.log(entry);
  }
}

export const logger = {
  info: (label: string, payload?: LogPayload) => log("info", label, payload),
  warn: (label: string, payload?: LogPayload) => log("warn", label, payload),
  error: (label: string, payload?: LogPayload) => log("error", label, payload),
};
