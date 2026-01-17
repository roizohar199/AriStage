import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// טוען את קובץ .env מהשורש של הפרויקט (תיקיית server)
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

const fallbackOrigins = ["http://localhost:5173"];
// Dev-only: allow local-network client access alongside localhost
const devNetworkOrigins =
  process.env.NODE_ENV === "development" ? ["http://10.0.0.99:5173"] : [];
const extraOrigins = (process.env.CORS_EXTRA_ORIGINS || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const allowedOrigins = [
  ...fallbackOrigins,
  process.env.CLIENT_URL,
  ...extraOrigins,
  ...devNetworkOrigins, // Dev-only extension for local + network development
]
  .filter((origin): origin is string => Boolean(origin))
  .map((origin) => origin.replace(/\/$/, ""));

interface EnvConfig {
  nodeEnv: string;
  host: string;
  port: number;
  clientUrl: string;
  jwtSecret: string;
  allowedOrigins: string[];
  baseUrl: string; // ⭐ נוסף!
  database: {
    host: string;
    port: number;
    user: string;
    password: string;
    name: string;
  };
  mail: {
    user: string;
    pass: string;
  };
}

const host = process.env.HOST || "0.0.0.0";
const port = Number(process.env.PORT || 5000);

// ⭐ יצירת baseUrl נכון לשימוש בתמונות
// אם מוגדר SERVER_URL בקובץ .env — משתמשים בו
let baseUrl = process.env.SERVER_URL;

if (!baseUrl) {
  // אם השרת מאזין לכל הכתובות (0.0.0.0) → השתמש ב-localhost
  if (host === "0.0.0.0") {
    baseUrl = `http://localhost:${port}`;
  } else {
    baseUrl = `http://${host}:${port}`;
  }
}

export const env: EnvConfig = {
  nodeEnv: process.env.NODE_ENV || "development",
  host,
  port,
  clientUrl: (process.env.CLIENT_URL || "").replace(/\/$/, ""),
  jwtSecret: process.env.JWT_SECRET || "dev",
  allowedOrigins: Array.from(new Set(allowedOrigins)),
  baseUrl, // ⭐ התוספת החשובה ביותר
  database: {
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    name: process.env.DB_NAME || "ari_stage",
  },
  mail: {
    user: process.env.MAIL_USER || "",
    pass: process.env.MAIL_PASS || "",
  },
};

export const corsMethods = ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"];
