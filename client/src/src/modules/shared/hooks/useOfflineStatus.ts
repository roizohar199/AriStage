import { useEffect, useState } from "react";
import {
  getOfflineSnapshot,
  subscribeOffline,
  setForcedOffline,
  toggleForcedOffline,
} from "@/modules/shared/lib/offlineMode";

export function useOfflineStatus() {
  const [snapshot, setSnapshot] = useState(getOfflineSnapshot());

  useEffect(() => {
    return subscribeOffline(setSnapshot);
  }, []);

  return {
    ...snapshot,
    setForcedOffline,
    toggleForcedOffline,
  };
}
