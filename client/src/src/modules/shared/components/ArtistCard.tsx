import React from "react";
import { User, Music, Trash2 } from "lucide-react";

interface ArtistCardProps {
  artist: {
    id: number;
    avatar?: string;
    full_name?: string;
    artist_role?: string;
    email?: string;
  };
  onUninvite?: () => void;
  disableActions?: boolean;
}

export default function ArtistCard({
  artist,
  onUninvite,
  disableActions = false,
}: ArtistCardProps): JSX.Element {
  return (
    <div
      key={artist.id}
      // Semantic animation: cards use `animation-hover`
      className="bg-neutral-850 rounded-2xl p-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center transition"
    >
      {/* תמונת פרופיל */}
      <div className="w-36 h-36 shrink-0 rounded-full overflow-hidden border-2 border-brand-primary shadow-surface">
        {artist.avatar ? (
          <img
            src={artist.avatar}
            alt={artist.full_name}
            className="w-full h-full object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = "none";
              if (target.nextSibling) {
                (target.nextSibling as HTMLElement).style.display = "flex";
              }
            }}
          />
        ) : null}
        <div
          className="w-16 h-16 rounded-full bg-neutral-950 border-2 border-brand-primary flex items-center justify-center shadow-surface"
          style={{ display: artist.avatar ? "none" : "flex" }}
        >
          <User size={24} className="text-neutral-500" />
        </div>
      </div>
      {/* פרטי האמן */}
      <div className="flex-1 min-w-0 text-start">
        <h3 className="h-page text-brand-primary mb-1">
          {artist.full_name || "אמן ללא שם"}
        </h3>
        {artist.artist_role && (
          <div className="mb-2">
            <span className="w-fit text-label bg-neutral-950 px-2 py-1 rounded-2xl text-neutral-100 shadow-surface">
              {artist.artist_role}
            </span>
          </div>
        )}
        {artist.email && (
          <p className="w-fit text-label bg-brand-primary px-2 py-1 rounded-2xl text-neutral-100 shadow-surface">
            {artist.email}
          </p>
        )}
      </div>
      {/* כפתור ביטול שיתוף */}
      {onUninvite && (
        <div className="flex m-4 gap-1 flex-row-reverse items-center">
          <button
            onClick={onUninvite}
            disabled={disableActions}
            // Semantic animation: buttons use `animation-press`
            className="text-red-600 hover:text-red-500 outline-none transition hover:bg-neutral-800 rounded-full p-2"
            title="בטל שיתוף מאגר"
          >
            <Trash2 size={20} />
          </button>
        </div>
      )}
    </div>
  );
}
