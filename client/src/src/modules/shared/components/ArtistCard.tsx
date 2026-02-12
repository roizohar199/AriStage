import React from "react";
import { User, Music, Trash2 } from "lucide-react";
import Avatar from "@/modules/shared/components/Avatar";
import { getAvatarInitial } from "@/modules/shared/lib/avatar";

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
      className="bg-neutral-850 rounded-2xl p-4 flex flex-col sm:flex-row gap-4 items-center sm:items-center justify-center transition"
    >
      {/* תמונת פרופיל */}
      <div className="w-36 h-36 shrink-0 rounded-full overflow-hidden border-2 border-brand-primary shadow-surface">
        <Avatar
          src={artist.avatar}
          name={artist.full_name}
          email={artist.email}
          alt={artist.full_name || "Artist"}
          className="w-full h-full"
          imgClassName="w-full h-full object-cover"
          fallbackClassName="w-full h-full flex items-center justify-center bg-neutral-700 text-neutral-100 text-5xl font-bold"
          fallback={getAvatarInitial(artist.full_name || artist.email, "A")}
        />
      </div>
      {/* פרטי האמן */}
      <div className="w-full text-center sm:text-start">
        <div className="flex-1 min-w-0 text-center sm:text-start">
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
            <p className="w-fit text-label bg-brand-primary px-2 py-1 rounded-2xl text-black shadow-surface text-center sm:text-start mx-auto sm:mx-0">
              {artist.email}
            </p>
          )}
        </div>
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
