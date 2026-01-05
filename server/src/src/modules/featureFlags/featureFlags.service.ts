import {
  listFeatureFlags,
  upsertFeatureFlag,
} from "./featureFlags.repository.js";

export async function getFeatureFlags() {
  return listFeatureFlags();
}

export async function setFeatureFlag(key: string, enabled: boolean) {
  await upsertFeatureFlag({ key, enabled });
}
