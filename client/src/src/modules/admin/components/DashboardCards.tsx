import React from "react";

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
        <div
          key={`${c.label}-${idx}`}
          className="bg-neutral-800 rounded-2xl p-4 flex items-center gap-4"
        >
          <div className="text-brand-primary shrink-0">{c.icon}</div>
          <div className="flex flex-col">
            <span className="text-xl font-bold">{c.value}</span>
            <span className="text-sm text-neutral-300">{c.label}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
