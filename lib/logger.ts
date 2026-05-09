import { getAppEnv } from "@/lib/env";

type LogLevel = "info" | "warn" | "error";

type LogContext = Record<string, unknown> & {
  error?: unknown;
};

function serializeError(error: unknown) {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }

  return error;
}

function writeLog(level: LogLevel, event: string, context?: LogContext) {
  const env = getAppEnv();
  const entry = {
    level,
    event,
    service: "gestion-stagiaires",
    environment: env.NODE_ENV,
    timestamp: new Date().toISOString(),
    ...context,
    ...(context?.error ? { error: serializeError(context.error) } : {}),
  };
  const payload = JSON.stringify(entry);

  if (level === "error") {
    console.error(payload);
    return;
  }

  if (level === "warn") {
    console.warn(payload);
    return;
  }

  console.info(payload);
}

export const logger = {
  info(event: string, context?: LogContext) {
    writeLog("info", event, context);
  },
  warn(event: string, context?: LogContext) {
    writeLog("warn", event, context);
  },
  error(event: string, context?: LogContext) {
    writeLog("error", event, context);
  },
};
