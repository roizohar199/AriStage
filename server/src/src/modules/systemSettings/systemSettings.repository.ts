import { pool } from "../../database/pool.js";

/**
 * System Settings Repository
 * Handles database operations for system-wide configuration
 */

export interface SystemSetting {
  key: string;
  value: string | null;
  description?: string | null;
  category?: string;
  updated_at?: Date;
}

/**
 * Get a single setting by key
 */
export async function getSetting(key: string): Promise<SystemSetting | null> {
  const [rows] = (await pool.query(
    `SELECT \`key\`, \`value\`, \`description\`, \`category\`, \`updated_at\`
     FROM system_settings
     WHERE \`key\` = ?`,
    [key],
  )) as any[];

  const list = Array.isArray(rows) ? (rows as any[]) : [];
  return (list[0] as SystemSetting) ?? null;
}

/**
 * Get multiple settings by keys
 */
export async function getSettings(
  keys: string[],
): Promise<Record<string, string | null>> {
  if (keys.length === 0) {
    return {};
  }

  const placeholders = keys.map(() => "?").join(",");
  const [rows] = (await pool.query(
    `SELECT \`key\`, \`value\`
     FROM system_settings
     WHERE \`key\` IN (${placeholders})`,
    keys,
  )) as any[];

  const result: Record<string, string | null> = {};
  const list = Array.isArray(rows) ? (rows as any[]) : [];
  for (const row of list) {
    result[String(row.key)] = (row.value ?? null) as string | null;
  }

  return result;
}

/**
 * List all settings (optionally filtered by category)
 */
export async function listSettings(
  category?: string,
): Promise<SystemSetting[]> {
  let query = `SELECT \`key\`, \`value\`, \`description\`, \`category\`, \`updated_at\`
               FROM system_settings`;
  const params: any[] = [];

  if (category) {
    query += ` WHERE \`category\` = ?`;
    params.push(category);
  }

  query += ` ORDER BY \`category\`, \`key\``;

  const [rows] = (await pool.query(query, params)) as any[];
  const list = Array.isArray(rows) ? (rows as any[]) : [];
  return list as SystemSetting[];
}

/**
 * Set (upsert) a setting value
 */
export async function setSetting(
  key: string,
  value: string | null,
  description?: string,
  category?: string,
): Promise<void> {
  await pool.query(
    `INSERT INTO system_settings (\`key\`, \`value\`, \`description\`, \`category\`)
     VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       \`value\` = VALUES(\`value\`),
       \`description\` = COALESCE(VALUES(\`description\`), \`description\`),
       \`category\` = COALESCE(VALUES(\`category\`), \`category\`)`,
    [key, value, description ?? null, category ?? null],
  );
}

/**
 * Delete a setting
 */
export async function deleteSetting(key: string): Promise<boolean> {
  const [result] = (await pool.query(
    `DELETE FROM system_settings WHERE \`key\` = ?`,
    [key],
  )) as any[];

  return (result as any)?.affectedRows > 0;
}
