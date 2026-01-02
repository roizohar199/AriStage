const levels = ["debug", "info", "warn", "error"] as const;

type LogLevel = (typeof levels)[number];

export type Logger = Record<
  LogLevel,
  (message: string, meta?: unknown) => void
>;

function format(level: LogLevel, message: string, meta?: unknown) {
  const ts = new Date().toISOString();
  return `[${ts}] [${level.toUpperCase()}] ${message}${
    meta ? ` | ${JSON.stringify(meta)}` : ""
  }`;
}

export const logger: Logger = levels.reduce((acc, level) => {
  acc[level] = (message: string, meta?: unknown) => {
    const line = format(level, message, meta);
    if (level === "error") {
      console.error(line);
    } else if (level === "warn") {
      console.warn(line);
    } else {
      console.log(line);
    }
  };
  return acc;
}, {} as Logger);
