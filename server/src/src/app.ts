import express, { Application } from "express";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import path from "path";
import { fileURLToPath } from "url";
import { registerModules } from "./modules/index.js";
import { createCorsOptions } from "./config/cors.js";
import { env } from "./config/env.js";
import { notFoundHandler } from "./middleware/not-found.js";
import { errorHandler } from "./middleware/error-handler.js";
import { getUploadsRoot } from "./utils/uploadsRoot.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function createApp(): Application {
  const app = express();

  app.use(
    helmet({
      crossOriginResourcePolicy: false,
      contentSecurityPolicy: {
        directives: {
          ...helmet.contentSecurityPolicy.getDefaultDirectives(),
          // Dev-only: extend CSP to support local + network development
          "frame-ancestors": [
            "'self'",
            "http://localhost:5173",
            ...(env.nodeEnv === "development" ? ["http://10.0.0.99:5173"] : []),
          ],
          ...(env.nodeEnv === "development"
            ? {
                // Dev-only: allow API and WS connections from local + network
                "connect-src": [
                  ...(helmet.contentSecurityPolicy.getDefaultDirectives()[
                    "connect-src"
                  ] || ["'self'"]),
                  "http://localhost:5000",
                  "http://10.0.0.99:5000",
                  "ws://localhost:5000",
                  "ws://10.0.0.99:5000",
                ],
              }
            : {}),
        },
      },
    }),
  );

  app.use(cors(createCorsOptions()));

  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));

  if (env.nodeEnv !== "production") {
    app.use(morgan("dev"));
  }

  // ⭐ מגיש את תיקיית uploads בצורה יציבה (לא תלוי CWD)
  app.use("/uploads", express.static(getUploadsRoot()));

  // טעינת המודולים
  registerModules(app);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
