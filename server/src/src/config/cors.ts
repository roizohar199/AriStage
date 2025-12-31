import { corsMethods, env } from "./env.ts";

function normalizeOrigin(origin: string = ""): string {
  return origin.replace(/\/$/, "");
}

const normalizedOrigins = env.allowedOrigins.map(normalizeOrigin);
const socketAllowedOrigins = Array.from(
  new Set([
    env.clientUrl ? normalizeOrigin(env.clientUrl) : undefined,
    ...normalizedOrigins,
  ])
).filter(Boolean) as string[];

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
  origin: socketAllowedOrigins,
  methods: corsMethods.filter((method: string) => method !== "OPTIONS"),
  credentials: true,
};
