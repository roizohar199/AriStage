import mysql from "mysql2/promise";
import { env } from "../config/env.js";

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

const pool = mysql.createPool(poolConfig);

// פונקציה להגדרת charset לכל חיבור חדש
async function configureConnection(connection) {
  try {
    await connection.query("SET NAMES utf8mb4 COLLATE utf8mb4_general_ci");
    await connection.query("SET CHARACTER SET utf8mb4");
    await connection.query("SET character_set_connection=utf8mb4");
    await connection.query("SET character_set_client=utf8mb4");
    await connection.query("SET character_set_results=utf8mb4");
  } catch (err) {
    // אם יש שגיאה, רק לוג - לא לשבור את החיבור
    console.warn("⚠️ Warning: Could not set charset for connection:", err.message);
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
    connection.release();
  } catch (err) {
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
  } catch (err) {
    console.error("❌ Error closing MySQL pool:", err);
    process.exit(1);
  }
});

