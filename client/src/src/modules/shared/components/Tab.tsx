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
  const tabsCount = Math.max(1, tabs.length);
  const activeIndex = Math.max(
    0,
    tabs.findIndex((t) => t.key === selectedKey),
  );
  const widthPct = 100 / tabsCount;
  const startPct = activeIndex * widthPct;

  if (variant === "user") {
    return (
      <div
        className={`relative flex justify-between bg-neutral-850 rounded-2xl overflow-hidden w-fit transition ${
          withMargins ? "mt-8 mb-6" : ""
        }`}
      >
        {tabs.map((tab) => (
          <button
            key={String(tab.key)}
            className={`px-6 py-2 transition ${
              selectedKey === tab.key
                ? "text-brand-primary font-semibold"
                : "text-neutral-100 hover:text-brand-primaryLight"
            }`}
            onClick={() => onSelect(tab.key)}
            type="button"
          >
            {tab.label}
          </button>
        ))}

        {/* Sliding indicator (RTL/LTR safe) */}
        <span
          className="absolute bottom-0 h-0.5 bg-brand-primary transition-[inset-inline-start] duration-300 ease-in-out"
          style={{
            width: `${widthPct}%`,
            insetInlineStart: `${startPct}%`,
          }}
          aria-hidden
        />
      </div>
    );
  }

  return (
    <div
      className={`bg-neutral-850 rounded-2xl overflow-x-auto overflow-y-hidden max-w-full ${
        withMargins ? "mt-8 mb-6" : ""
      }`}
    >
      <div className="relative">
        <div className="flex flex-nowrap min-w-full w-max justify-start gap-1 outline-none">
          {tabs.map((tab) => (
            <button
              key={String(tab.key)}
              className={`px-3 sm:px-6 py-2 transition whitespace-nowrap  ${
                selectedKey === tab.key
                  ? "text-brand-primary font-semibold"
                  : "text-neutral-100 "
              }`}
              onClick={() => onSelect(tab.key)}
              type="button"
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Sliding indicator (RTL/LTR safe) */}
        <span
          className=""
          style={{
            width: `${widthPct}%`,
            insetInlineStart: `${startPct}%`,
          }}
          aria-hidden
        />
      </div>
    </div>
  );
}
