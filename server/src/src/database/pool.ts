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

async function ensureTrialSettingsSchema() {
  try {
    if (!(await columnExists("subscriptions_settings", "trial_enabled"))) {
      await pool.query(
        "ALTER TABLE `subscriptions_settings` ADD COLUMN `trial_enabled` TINYINT(1) NOT NULL DEFAULT 1 AFTER `trial_days`",
      );
      console.log("✅ DB migrated: subscriptions_settings.trial_enabled added");
    }

    await pool.query(
      "UPDATE subscriptions_settings SET trial_enabled = 1 WHERE id = 1 AND trial_enabled IS NULL",
    );
  } catch (err: any) {
    console.warn(
      "⚠️ Warning: could not ensure trial settings schema:",
      err?.message ?? err,
    );
  }
}

async function columnExists(tableName: string, columnName: string) {
  const [rows] = await pool.query(
    "SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ? LIMIT 1",
    [tableName, columnName],
  );

  return Array.isArray(rows) && rows.length > 0;
}

async function indexExists(tableName: string, indexName: string) {
  const [rows] = await pool.query(
    "SELECT 1 FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND INDEX_NAME = ? LIMIT 1",
    [tableName, indexName],
  );

  return Array.isArray(rows) && rows.length > 0;
}

async function ensurePayPalBillingSchema() {
  try {
    const userColumnStatements: Array<[string, string]> = [
      [
        "subscription_provider",
        "ALTER TABLE `users` ADD COLUMN `subscription_provider` VARCHAR(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL AFTER `subscription_status`",
      ],
      [
        "provider_customer_id",
        "ALTER TABLE `users` ADD COLUMN `provider_customer_id` VARCHAR(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL AFTER `subscription_provider`",
      ],
      [
        "provider_subscription_id",
        "ALTER TABLE `users` ADD COLUMN `provider_subscription_id` VARCHAR(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL AFTER `provider_customer_id`",
      ],
      [
        "subscription_renews_at",
        "ALTER TABLE `users` ADD COLUMN `subscription_renews_at` DATETIME NULL DEFAULT NULL AFTER `subscription_expires_at`",
      ],
      [
        "subscription_cancel_at_period_end",
        "ALTER TABLE `users` ADD COLUMN `subscription_cancel_at_period_end` TINYINT(1) NOT NULL DEFAULT 0 AFTER `subscription_renews_at`",
      ],
      [
        "subscription_cancelled_at",
        "ALTER TABLE `users` ADD COLUMN `subscription_cancelled_at` DATETIME NULL DEFAULT NULL AFTER `subscription_cancel_at_period_end`",
      ],
    ];

    for (const [columnName, statement] of userColumnStatements) {
      if (!(await columnExists("users", columnName))) {
        await pool.query(statement);
        console.log(`✅ DB migrated: users.${columnName} added`);
      }
    }

    if (!(await indexExists("users", "idx_users_provider_subscription_id"))) {
      await pool.query(
        "ALTER TABLE `users` ADD INDEX `idx_users_provider_subscription_id` (`provider_subscription_id`)",
      );
    }

    const paymentColumnStatements: Array<[string, string]> = [
      [
        "provider_subscription_id",
        "ALTER TABLE `payments` ADD COLUMN `provider_subscription_id` VARCHAR(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL AFTER `transaction_id`",
      ],
      [
        "provider_order_id",
        "ALTER TABLE `payments` ADD COLUMN `provider_order_id` VARCHAR(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL AFTER `provider_subscription_id`",
      ],
      [
        "provider_capture_id",
        "ALTER TABLE `payments` ADD COLUMN `provider_capture_id` VARCHAR(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL AFTER `provider_order_id`",
      ],
      [
        "provider_event_id",
        "ALTER TABLE `payments` ADD COLUMN `provider_event_id` VARCHAR(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL AFTER `provider_capture_id`",
      ],
      [
        "provider_payload_json",
        "ALTER TABLE `payments` ADD COLUMN `provider_payload_json` LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL AFTER `provider_event_id`",
      ],
      [
        "failure_reason",
        "ALTER TABLE `payments` ADD COLUMN `failure_reason` VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL AFTER `provider_payload_json`",
      ],
    ];

    for (const [columnName, statement] of paymentColumnStatements) {
      if (!(await columnExists("payments", columnName))) {
        await pool.query(statement);
        console.log(`✅ DB migrated: payments.${columnName} added`);
      }
    }

    if (
      !(await indexExists("payments", "idx_payments_provider_subscription_id"))
    ) {
      await pool.query(
        "ALTER TABLE `payments` ADD INDEX `idx_payments_provider_subscription_id` (`provider_subscription_id`)",
      );
    }

    if (!(await indexExists("payments", "idx_payments_provider_capture_id"))) {
      await pool.query(
        "ALTER TABLE `payments` ADD INDEX `idx_payments_provider_capture_id` (`provider_capture_id`)",
      );
    }

    if (!(await indexExists("payments", "idx_payments_provider_order_id"))) {
      await pool.query(
        "ALTER TABLE `payments` ADD INDEX `idx_payments_provider_order_id` (`provider_order_id`)",
      );
    }

    await pool.query(
      `CREATE TABLE IF NOT EXISTS payment_webhook_events (
        id INT NOT NULL AUTO_INCREMENT,
        provider VARCHAR(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
        event_id VARCHAR(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
        event_type VARCHAR(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
        resource_id VARCHAR(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
        processing_status VARCHAR(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'pending',
        payload_json LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
        processed_at DATETIME DEFAULT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY uk_payment_webhook_events_provider_event (provider, event_id),
        KEY idx_payment_webhook_events_resource (resource_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci`,
    );

    await pool.query(
      `CREATE TABLE IF NOT EXISTS payment_provider_plans (
        id INT NOT NULL AUTO_INCREMENT,
        provider VARCHAR(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
        local_plan_key VARCHAR(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
        billing_period VARCHAR(16) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
        currency VARCHAR(16) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
        amount INT NOT NULL,
        provider_product_id VARCHAR(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
        provider_plan_id VARCHAR(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY uk_payment_provider_plans_provider_plan (provider, provider_plan_id),
        KEY idx_payment_provider_plans_lookup (provider, local_plan_key, billing_period, currency, amount),
        KEY idx_payment_provider_plans_product (provider, local_plan_key, provider_product_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci`,
    );
  } catch (err: any) {
    console.warn(
      "⚠️ Warning: could not ensure PayPal billing schema:",
      err?.message ?? err,
    );
  }
}

async function ensurePlanBillingPeriodSchema() {
  try {
    const planColumnStatements: Array<[string, string]> = [
      [
        "monthly_enabled",
        "ALTER TABLE `plans` ADD COLUMN `monthly_enabled` TINYINT(1) NOT NULL DEFAULT 1 AFTER `enabled`",
      ],
      [
        "yearly_enabled",
        "ALTER TABLE `plans` ADD COLUMN `yearly_enabled` TINYINT(1) NOT NULL DEFAULT 1 AFTER `monthly_enabled`",
      ],
    ];

    for (const [columnName, statement] of planColumnStatements) {
      if (!(await columnExists("plans", columnName))) {
        await pool.query(statement);
        console.log(`✅ DB migrated: plans.${columnName} added`);
      }
    }
  } catch (err: any) {
    console.warn(
      "⚠️ Warning: could not ensure plan billing period schema:",
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
    await ensureTrialSettingsSchema();
    await ensurePayPalBillingSchema();
    await ensurePlanBillingPeriodSchema();
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
