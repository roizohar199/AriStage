import React from "react";

type IconLike = React.ComponentType<{ size?: number; className?: string }>;

export type BordProps = {
  value: React.ReactNode;
  label: React.ReactNode;

  Icon?: IconLike;
  icon?: React.ReactNode;
  iconSize?: number;

  className?: string;
};

export default function Bord({
  value,
  label,
  Icon,
  icon,
  iconSize = 32,
  className = "",
}: BordProps) {
  return (
    <div
      className={`bg-neutral-850 rounded-2xl p-4 flex items-center gap-4 ${className}`.trim()}
    >
      {Icon ? (
        <Icon size={iconSize} className="text-brand-primary shrink-0" />
      ) : icon ? (
        <div className="text-brand-primary shrink-0">{icon}</div>
      ) : null}

      <div className="flex flex-col">
        <span className="text-xl font-bold">{value}</span>
        <span className="text-sm text-neutral-300">{label}</span>
      </div>
    </div>
  );
}
