import mysql from "mysql2/promise";
import { env } from "../config/env";

// אם אין סיסמה, לא שולחים את השדה password בכלל
const poolConfig: any = {
  host: env.database.host,
  port: env.database.port,
  user: env.database.user,
  database: env.database.name,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: "utf8mb4",
  // הגדרת charset לכל החיבורים
  typeCast: function (field, next) {
    // טיפול נכון בכל סוגי השדות הטקסטואליים
    if (
      field.type === "VAR_STRING" ||
      field.type === "STRING" ||
      field.type === "TEXT" ||
      field.type === "TINY_BLOB" ||
      field.type === "MEDIUM_BLOB" ||
      field.type === "LONG_BLOB" ||
      field.type === "BLOB"
    ) {
      const value = field.string();
      // אם הערך הוא null או undefined, החזר אותו כפי שהוא
      if (value === null || value === undefined) {
        return value;
      }
      // החזר את המחרוזת עם encoding נכון
      return value;
    }
    return next();
  },
};

// מוסיף password רק אם יש ערך
if (env.database.password && env.database.password.trim() !== "") {
  poolConfig.password = env.database.password;
}

// NOTE: This project uses raw SQL extensively; exporting an `any`-typed pool
// keeps TypeScript from failing builds due to mysql2's very strict result unions.
const pool: any = mysql.createPool(poolConfig as any) as any;

// פונקציה להגדרת charset לכל חיבור חדש
async function configureConnection(connection: any) {
  try {
    await connection.query("SET NAMES utf8mb4 COLLATE utf8mb4_general_ci");
    await connection.query("SET CHARACTER SET utf8mb4");
    await connection.query("SET character_set_connection=utf8mb4");
    await connection.query("SET character_set_client=utf8mb4");
    await connection.query("SET character_set_results=utf8mb4");

    // Dev relaxed mode: disable FK enforcement (session-level).
    // Set DB_ENFORCE_FK=1 to keep FK checks enabled.
    if (env.nodeEnv === "development" && process.env.DB_ENFORCE_FK !== "1") {
      await connection.query("SET FOREIGN_KEY_CHECKS = 0");
    }
  } catch (err: any) {
    // אם יש שגיאה, רק לוג - לא לשבור את החיבור
    console.warn(
      "⚠️ Warning: Could not set charset for connection:",
      err.message,
    );
  }
}

async function ensureDynamicPlanKeysSchema() {
  try {
    const [rows] = await pool.query(
      "SELECT TABLE_NAME, COLUMN_NAME, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND ((TABLE_NAME = 'users' AND COLUMN_NAME = 'subscription_type') OR (TABLE_NAME = 'payments' AND COLUMN_NAME = 'plan'))",
    );

    const list = Array.isArray(rows) ? (rows as any[]) : [];

    const usersType = list.find(
      (r) =>
        r?.TABLE_NAME === "users" && r?.COLUMN_NAME === "subscription_type",
    )?.DATA_TYPE;
    const paymentsType = list.find(
      (r) => r?.TABLE_NAME === "payments" && r?.COLUMN_NAME === "plan",
    )?.DATA_TYPE;

    if (String(usersType).toLowerCase() === "enum") {
      await pool.query(
        "ALTER TABLE `users` MODIFY COLUMN `subscription_type` VARCHAR(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'trial'",
      );
      console.log("✅ DB migrated: users.subscription_type -> VARCHAR(64)");
    }

    if (String(paymentsType).toLowerCase() === "enum") {
      await pool.query(
        "ALTER TABLE `payments` MODIFY COLUMN `plan` VARCHAR(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL",
      );
      console.log("✅ DB migrated: payments.plan -> VARCHAR(64)");
    }
  } catch (err: any) {
    // Do not crash the server if schema migration fails; log for debugging.
    console.warn(
      "⚠️ Warning: could not ensure dynamic plan keys schema:",
      err?.message ?? err,
    );
  }
}

// Wrapper ל-getConnection כדי להגדיר charset אוטומטית
const originalGetConnection = pool.getConnection.bind(pool);
pool.getConnection = async function () {
  const connection = await originalGetConnection();
  await configureConnection(connection);
  return connection;
};

export { pool };

async function verifyConnection() {
  try {
    const connection = await pool.getConnection();
    // הגדרת charset לחיבור
    await configureConnection(connection);
    console.log("✅ MySQL connected successfully with utf8mb4 encoding!");
    await ensureDynamicPlanKeysSchema();
    connection.release();
  } catch (err: any) {
    console.error("❌ Database connection failed:");
    console.error(err.message);
    process.exit(1);
  }
}

verifyConnection();

process.on("SIGINT", async () => {
  try {
    await pool.end();
    console.log("🧱 MySQL pool closed gracefully.");
    process.exit(0);
  } catch (err: any) {
    console.error("❌ Error closing MySQL pool:", err);
    process.exit(1);
  }
});
