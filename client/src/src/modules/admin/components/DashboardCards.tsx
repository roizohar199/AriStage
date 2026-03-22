import type { ReactNode } from "react";
import Bord from "@/modules/shared/components/bord";

export type DashboardCard = {
  id?: string;
  icon: ReactNode;
  value: ReactNode;
  label: string;
  title?: string;
  description?: string;
  variant?: "neutral" | "brand" | "success" | "danger";
};

export default function DashboardCards({
  cards,
  className = "",
}: {
  cards: DashboardCard[];
  className?: string;
}) {
  return (
    <div
      className={`grid grid-cols-1 sm:grid-cols-3 gap-4 ${className}`.trim()}
    >
      {cards.map((c, idx) => (
        <Bord
          key={c.id ?? `${c.label}-${idx}`}
          icon={c.icon}
          value={c.value}
          label={c.title ?? c.label}
        />
      ))}
    </div>
  );
}
