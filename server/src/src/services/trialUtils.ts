// Utility to fetch trial_days from settings
import { getSubscriptionSettings } from "../modules/subscriptions/subscriptions.repository";

export async function getTrialDays(): Promise<number> {
  const settings = await getSubscriptionSettings();
  return Number(settings.trial_days) || 14; // fallback to 14 if not set
}
