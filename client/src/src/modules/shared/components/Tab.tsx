import React from "react";

export type TabItem<TKey extends string = string> = {
  key: TKey;
  label: React.ReactNode;
};

export default function Tab<TKey extends string = string>({
  tabs,
  selectedKey,
  onSelect,
  variant = "admin",
  withMargins = true,
}: {
  tabs: Array<TabItem<TKey>>;
  selectedKey: TKey;
  onSelect: (key: TKey) => void;
  variant?: "admin" | "user";
  withMargins?: boolean;
}) {
  if (variant === "user") {
    return (
      <div
        className={`flex justify-between bg-neutral-800 rounded-2xl overflow-hidden w-fit ${
          withMargins ? "mt-8 mb-6" : ""
        }`}
      >
        {tabs.map((tab) => (
          <button
            key={String(tab.key)}
            className={`px-6 py-2 transition ${
              selectedKey === tab.key
                ? "w-fit border-b-2 border-brand-orange overflow-hidden text-brand-orange font-bold"
                : "font-bold text-white hover:text-brand-orangeLight"
            }`}
            onClick={() => onSelect(tab.key)}
            type="button"
          >
            {tab.label}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div
      className={`bg-neutral-800 rounded-2xl overflow-x-auto overflow-y-hidden max-w-full ${
        withMargins ? "mt-8 mb-6" : ""
      }`}
    >
      <div className="flex flex-nowrap min-w-full w-max justify-start gap-1 outline-none">
        {tabs.map((tab) => (
          <button
            key={String(tab.key)}
            className={`px-3 sm:px-6 py-2 transition whitespace-nowrap ${
              selectedKey === tab.key
                ? "border-b-2 border-brand-orange text-brand-orange font-bold"
                : "font-bold text-white"
            }`}
            onClick={() => onSelect(tab.key)}
            type="button"
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}
