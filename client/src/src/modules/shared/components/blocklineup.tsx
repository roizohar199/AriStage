import React from "react";
import { CalendarDays, Clock, MapPin, Trash2, Pencil } from "lucide-react";

interface BlockLineupProps {
  lineup: any;
  onOpen?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  index?: number;
}

const BlockLineup: React.FC<BlockLineupProps> = ({
  lineup,
  onOpen,
  onEdit,
  onDelete,
  index,
}) => {
  const normalizeTime = (t: any) => {
    if (!t) return "";
    return t.toString().slice(0, 5);
  };

  const formatForDisplay = (d: any) => {
    if (!d) return "לא צוין תאריך";
    const obj = new Date(d);
    if (isNaN(obj.getTime())) return "לא צוין תאריך";
    return obj.toLocaleDateString("he-IL");
  };

  return (
    <div
      role="button"
      onClick={onOpen}
      className="relative aspect-square bg-neutral-800 p-4 rounded-2xl flex flex-col justify-center items-center text-center select-none hover:bg-neutral-700/50 active:bg-neutral-700"
    >
      {/* מספור – תמיד נראה */}
      {typeof index === "number" && (
        <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-neutral-900 text-white/70 text-xs font-bold flex items-center justify-center shadow-md">
          {index + 1}
        </div>
      )}

      <div className="w-full flex-1 flex flex-col justify-center items-center gap-0">
        <p className="font-semibold text-lg line-clamp-2 break-words">
          {lineup?.title}
        </p>

        {/* תאריך */}
        <div className="flex items-center justify-left gap-2 mt-3 text-xs w-fit">
          <span className="flex items-center gap-1 px-2 py-1 bg-neutral-900 rounded-2xl flex-row-reverse w-full justify-center">
            <CalendarDays size={14} />
            {formatForDisplay(lineup?.date)}
          </span>
        </div>

        {/* שעה */}
        <div className="flex items-center justify-left gap-2 mt-2 text-xs w-fit">
          <span className="flex items-center gap-1 px-2 py-1 bg-neutral-900 rounded-2xl flex-row-reverse w-full justify-center">
            <Clock size={14} />
            {normalizeTime(lineup?.time) || "לא צוין שעה"}
          </span>
        </div>

        {/* מיקום */}
        <div className="flex items-center justify-left gap-2 mt-2 text-xs w-fit">
          <span className="flex flex-row-reverse items-center gap-1 px-2 py-1 bg-brand-orange rounded-2xl text-black font-semibold w-full justify-center">
            <MapPin size={14} />
            {lineup?.location || "לא צוין מיקום"}
          </span>
        </div>
      </div>

      {lineup?.is_owner && (
        <div className="mt-4 flex gap-3 flex-row-reverse">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete?.();
            }}
            className="w-6 h-6 text-red-500 hover:text-red-400 outline-none"
            aria-label="delete-lineup"
          >
            <Trash2 size={20} />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit?.();
            }}
            className="w-6 h-6 text-white hover:text-brand-orange outline-none"
            aria-label="edit-lineup"
          >
            <Pencil size={20} />
          </button>
        </div>
      )}
    </div>
  );
};

export default BlockLineup;
