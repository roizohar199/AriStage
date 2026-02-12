import { pool } from "../../database/pool";

export type FeatureFlagRow = {
  key: string;
  description: string | null;
  enabled: number | boolean | null;
};

export async function listFeatureFlags(): Promise<FeatureFlagRow[]> {
  const [rows] = await pool.query(
    `SELECT \`key\`, description, enabled FROM feature_flags ORDER BY \`key\` ASC`,
  );

  return Array.isArray(rows) ? (rows as any) : [];
}

export async function upsertFeatureFlag(input: {
  key: string;
  enabled: boolean;
  description?: string | null;
}) {
  const key = String(input.key || "").trim();
  if (!key) return;

  const description =
    input.description === undefined
      ? null
      : input.description === null
        ? null
        : String(input.description).trim() || null;

  await pool.query(
    `INSERT INTO feature_flags (\`key\`, enabled, description, updated_at)
     VALUES (?, ?, ?, NOW())
     ON DUPLICATE KEY UPDATE
       enabled = VALUES(enabled),
       description = COALESCE(VALUES(description), description),
       updated_at = NOW()`,
    [key, input.enabled ? 1 : 0, description],
  );
}
