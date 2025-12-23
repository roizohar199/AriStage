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
  onEdit: (song: Song) => void;
  onRemove: (songId: number) => void;
  chartsComponent: React.ReactNode;
}

const CardSong: React.FC<CardSongProps> = ({
  song,
  index,
  safeKey,
  safeDuration,
  onEdit,
  onRemove,
  chartsComponent,
}) => {
  return (
    <div className="bg-neutral-800 rounded-2xl p-4 flex justify-between items-center shadow-sm hover:shadow-lg transition border border-neutral-800">
      <div>
        <p className="font-semibold text-lg">
          {index + 1}. {song.title}
        </p>
        <div className="flex flex-wrap gap-2 mt-2 text-xs">
          <span className="bg-neutral-900 px-2 py-1 bg-neutral-800 rounded-2xl">
            {safeKey(song.key_sig)}
          </span>
          <span className="bg-neutral-900 px-2 py-1 bg-neutral-800 rounded-2xl">
            {song.bpm} BPM
          </span>
          <span className="bg-neutral-900 px-2 py-1 bg-neutral-800 rounded-2xl">
            {safeDuration(song.duration_sec)}
          </span>
          {song.notes && (
            <span className="inline-block px-2 py-1 text-xs bg-brand-orange rounded-2xl text-black font-semibold">
              {song.notes}
            </span>
          )}
        </div>
        {chartsComponent}
      </div>
      <div className="flex m-4 gap-6 flex-row-reverse items-center">
        {song.is_owner && (
          <>
            <button
              onClick={() => onRemove(song.id)}
              className="w-6 h-6 text-red-500 hover:text-red-400"
            >
              <Trash2 size={20} />
            </button>
            <button
              onClick={() => onEdit(song)}
              className="w-6 h-6 text-white hover:text-brand-orange"
            >
              <Edit2 size={20} />
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default CardSong;
