import { corsMethods, env } from "./env.ts";

function normalizeOrigin(origin: string = ""): string {
  return origin.replace(/\/$/, "");
}

const normalizedOrigins = env.allowedOrigins.map(normalizeOrigin);

export function createCorsOptions(): any {
  return {
    origin(origin, callback) {
      if (!origin) {
        return callback(null, true);
      }

      const normalized = normalizeOrigin(origin);

      if (normalizedOrigins.includes(normalized)) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: corsMethods,
  };
}

export const socketCorsOptions = {
  origin(origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void): void {
    if (!origin) {
      return callback(null, true);
    }
    const normalized = normalizeOrigin(origin);
    if (normalizedOrigins.includes(normalized)) {
      return callback(null, true);
    }
    return callback(new Error("Not allowed by CORS (socket.io)"));
  },
  methods: corsMethods.filter((method: string) => method !== "OPTIONS"),
  credentials: true,
};

