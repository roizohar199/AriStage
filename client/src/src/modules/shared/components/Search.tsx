import React, { useState } from "react";
import { Search as LucideSearch } from "lucide-react";

type SearchVariant = "song" | "artist" | "lineup" | "full";

interface SearchProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  className?: string;
  variant?: SearchVariant;
}

const PLACEHOLDERS: Record<SearchVariant, string> = {
  song: "חפש לפי שם שיר",
  artist: "חפש לפי שם אמן",
  lineup: "חפש לפי שם לינאפ",
  full: "חפש",
};

const Search: React.FC<SearchProps> = ({
  value,
  onChange,
  variant = "full",
  className = "",
}) => {
  const [open, setOpen] = useState(false);

  return (
    <div className={`flex-1 ${className}`}>
      <div
        className={`
          relative h-11 ml-auto
          transition-all duration-300
          ${open ? "w-full" : "w-11"}
        `}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => {
          if (!value) setOpen(false);
        }}
      >
        {/* INPUT */}
        <input
          type="text"
          value={value}
          onChange={onChange}
          onFocus={() => setOpen(true)}
          onBlur={() => {
            if (!value) setOpen(false);
          }}
          placeholder={open ? PLACEHOLDERS[variant] : ""}
          readOnly={!open}
          className={`
            w-full h-full
            text-sm
            focus:outline-none
            transition-all duration-300
            ${
              open
                ? "bg-neutral-800 border border-neutral-800 rounded-2xl pr-10 pl-4 placeholder-neutral-500 focus:border-brand-orange"
                : "bg-neutral-800 border-transparent rounded-2xl cursor-pointer"
            }
          `}
        />

        {/* ICON – סגור (אמצע) */}
        <div
          className={`
            absolute inset-0
            flex items-center justify-center
            text-brand-orange
            pointer-events-none
            transition-all duration-200
            ${open ? "opacity-0 scale-90" : "opacity-100 scale-100"}
          `}
        >
          <LucideSearch size={18} />
        </div>

        {/* ICON – פתוח (ימין) */}
        <div
          className={`
            absolute right-3 top-1/2 -translate-y-1/2
            text-brand-orange
            transition-all duration-200
            ${open ? "opacity-100 scale-100" : "opacity-0 scale-90"}
          `}
        >
          <LucideSearch size={18} />
        </div>
      </div>
    </div>
  );
};

export default Search;
