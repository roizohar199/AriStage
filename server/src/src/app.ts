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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function createApp(): Application {
  const app = express();

  app.use(
    helmet({
      crossOriginResourcePolicy: false,
    })
  );

  app.use(cors(createCorsOptions()));

  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));

  if (env.nodeEnv !== "production") {
    app.use(morgan("dev"));
  }

  // ⭐ מגיש את תיקיית uploads הנכונה (root של השרת)
  app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

  // טעינת המודולים
  registerModules(app);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
