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
      // Semantic animation: cards use `animation-hover`
      className="relative aspect-square bg-neutral-850 p-4 rounded-2xl flex flex-col justify-center items-center text-center select-none hover:bg-neutral-800 "
    >
      {/* מספור – תמיד נראה */}
      {typeof index === "number" && (
        <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-neutral-950 text-neutral-300 text-sm font-bold flex items-center justify-center shadow-surface">
          {index + 1}
        </div>
      )}

      <div className="w-full flex-1 flex flex-col justify-center items-center gap-0">
        <p className="font-semibold text-2xl text-neutral-100">
          {lineup?.title}
        </p>

        <div className="w-fit">
          {/* תאריך */}
          <div className="flex items-center justify-left gap-2 mt-3 text-sm w-full">
            <span className="flex items-center gap-1 px-2 py-1 bg-neutral-950 rounded-2xl text-neutral-100 flex-row-reverse w-full justify-center shadow-surface">
              <CalendarDays size={14} />
              {formatForDisplay(lineup?.date)}
            </span>
          </div>

          {/* שעה */}
          <div className="flex items-center justify-left gap-2 mt-2 text-sm w-full">
            <span className="flex items-center gap-1 px-2 py-1 bg-neutral-950 rounded-2xl text-neutral-100 flex-row-reverse w-full justify-center shadow-surface">
              <Clock size={14} />
              {normalizeTime(lineup?.time) || "לא צוין שעה"}
            </span>
          </div>

          {/* מיקום */}
          <div className="flex items-center justify-left gap-2 mt-2 text-sm w-full">
            <span className="flex items-center gap-1 px-2 py-1 bg-brand-primary rounded-2xl text-black flex-row-reverse w-full justify-center shadow-surface">
              <MapPin size={14} />
              {lineup?.location || "לא צוין מיקום"}
            </span>
          </div>
        </div>
      </div>
      {lineup?.is_owner && (
        <div className="flex m-4 gap-4 flex-row-reverse items-center">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete?.();
            }}
            // Semantic animation: buttons use `animation-press`
            className="outline-none bg-red-600 text-white rounded-full p-2 hover:bg-red-500 transition"
            aria-label="delete-lineup"
          >
            <Trash2 size={20} />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit?.();
            }}
            // Semantic animation: buttons use `animation-press`
            className="outline-none bg-brand-primary text-black rounded-full p-2 hover:bg-brand-primaryLight transition"
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
