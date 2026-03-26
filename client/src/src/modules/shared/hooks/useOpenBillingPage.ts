import { useCallback } from "react";
import { useNavigate } from "react-router-dom";

type BillingPeriod = "monthly" | "yearly";

export function useOpenBillingPage() {
  const navigate = useNavigate();

  return useCallback(
    (billingPeriod?: BillingPeriod) => {
      const searchParams = new URLSearchParams();

      if (billingPeriod) {
        searchParams.set("billingPeriod", billingPeriod);
      }

      const suffix = searchParams.toString();
      navigate(`/billing${suffix ? `?${suffix}` : ""}`);
    },
    [navigate],
  );
}
