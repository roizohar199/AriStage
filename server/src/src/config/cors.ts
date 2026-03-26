import { corsMethods, env } from "./env";

function normalizeOrigin(origin: string = ""): string {
  return origin.replace(/\/$/, "");
}

function isAllowedDynamicOrigin(origin: string): boolean {
  try {
    const url = new URL(origin);
    const hostname = url.hostname.toLowerCase();

    if (hostname === "localhost" || hostname === "127.0.0.1") {
      return true;
    }

    if (hostname.endsWith(".trycloudflare.com")) {
      return true;
    }

    return false;
  } catch {
    return false;
  }
}

const normalizedOrigins = env.allowedOrigins.map(normalizeOrigin);

export function createCorsOptions(): any {
  return {
    origin(
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ) {
      if (!origin) {
        return callback(null, true);
      }

      const normalized = normalizeOrigin(origin);

      if (
        normalizedOrigins.includes(normalized) ||
        isAllowedDynamicOrigin(normalized)
      ) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: corsMethods,
  };
}

export const socketCorsOptions = {
  origin(
    origin: string | undefined,
    callback: (err: Error | null, allow?: boolean) => void,
  ) {
    if (!origin) {
      return callback(null, true);
    }

    const normalized = normalizeOrigin(origin);

    if (
      normalizedOrigins.includes(normalized) ||
      isAllowedDynamicOrigin(normalized)
    ) {
      return callback(null, true);
    }

    return callback(new Error("Not allowed by Socket.IO CORS"));
  },
  methods: corsMethods.filter((method: string) => method !== "OPTIONS"),
  credentials: true,
};
