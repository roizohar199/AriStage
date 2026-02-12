import { listFeatureFlags, upsertFeatureFlag } from "./featureFlags.repository";

export async function getFeatureFlags() {
  return listFeatureFlags();
}

export async function setFeatureFlag(
  key: string,
  enabled: boolean,
  description?: string | null,
) {
  await upsertFeatureFlag({ key, enabled, description });
}
