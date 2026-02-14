import React from "react";
import { Trash2, Edit2 } from "lucide-react";

interface Song {
  id: number;
  title: string;
  artist: string;
  bpm: number;
  key_sig: string;
  duration_sec: number;
  notes?: string;
  is_owner?: boolean;
  owner_id?: number;
  owner_name?: string;
  chart_pdf_url?: string | null;
  owner_avatar?: string;
  owner_role?: string;
  owner_email?: string;
}

interface CardSongProps {
  song: Song;
  index: number;
  safeKey: (key: string) => string;
  safeDuration: (duration: string | number) => string;
  onEdit?: (song: Song) => void;
  onRemove: (songId: number) => void;
  chartsComponent: React.ReactNode;
  lyricsComponent?: React.ReactNode;
  compact?: boolean;
  hideActions?: boolean;
}

const CardSong: React.FC<CardSongProps> = ({
  song,
  index,
  safeKey,
  safeDuration,
  onEdit,
  onRemove,
  chartsComponent,
  lyricsComponent,
  compact = false,
  hideActions = false,
}) => {
  const durationText = safeDuration(song.duration_sec);

  return (
    <div
      // Semantic animation: cards use `animation-hover`
      className={`bg-neutral-850 rounded-2xl flex justify-between items-center ${
        compact ? "p-3" : "p-4"
      }`}
    >
      <div>
        <p className="w-6 h-6 rounded-full bg-neutral-950 text-neutral-300 text-sm font-bold flex items-center justify-center shadow-surface">
          {index + 1}
        </p>
        <p
          className={`font-semibold text-neutral-100 ${
            compact ? "text-xl" : "text-2xl"
          }`}
        >
          {song.title}
        </p>
        <p className="text-neutral-400">{song.artist}</p>
        <div className="flex flex-wrap gap-1 mt-2 text-sm">
          <span className="bg-neutral-950 px-2 py-1 rounded-2xl text-neutral-100 shadow-surface">
            {safeKey(song.key_sig)}
          </span>
          <span className="bg-neutral-950 px-2 py-1 rounded-2xl text-neutral-100 shadow-surface">
            {song.bpm} BPM
          </span>
          <span className="bg-neutral-950 px-2 py-1 rounded-2xl text-neutral-100 shadow-surface">
            {song.duration_sec}
          </span>
          {song.notes && (
            <span className="inline-block px-2 py-1 bg-brand-primary rounded-2xl text-black shadow-surface">
              {song.notes}
            </span>
          )}
        </div>
        {chartsComponent}
        {lyricsComponent}
      </div>
      {!hideActions && (
        <div className="flex m-4 gap-4 flex-row-reverse items-center">
          {song.is_owner && (
            <>
              <button
                onClick={() => onRemove(song.id)}
                // Semantic animation: buttons use `animation-press`
                className="outline-none bg-red-600 text-white rounded-full p-2 hover:bg-red-500 transition"
              >
                <Trash2 size={20} />
              </button>

              {onEdit && (
                <button
                  onClick={() => onEdit(song)}
                  // Semantic animation: buttons use `animation-press`
                  className="outline-none bg-brand-primary text-black rounded-full p-2 hover:bg-brand-primaryLight transition"
                >
                  <Edit2 size={20} />
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default CardSong;
