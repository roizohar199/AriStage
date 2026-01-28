import React from "react";
import Bord from "@/modules/shared/components/bord";

export type DashboardCard = {
  icon: React.ReactNode;
  value: React.ReactNode;
  label: string;
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
          key={`${c.label}-${idx}`}
          icon={c.icon}
          value={c.value}
          label={c.label}
        />
      ))}
    </div>
  );
}
