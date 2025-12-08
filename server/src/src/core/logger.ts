const levels = ["debug", "info", "warn", "error"];

function format(level, message, meta) {
  const ts = new Date().toISOString();
  return `[${ts}] [${level.toUpperCase()}] ${message}${
    meta ? ` | ${JSON.stringify(meta)}` : ""
  }`;
}

export const logger = levels.reduce((acc, level) => {
  acc[level] = (message, meta) => {
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
}, {});

