import { Users, Music, CalendarCheck } from "lucide-react";

type SharedStats = {
  artists: number;
  songs: number;
  lineups: number;
};

type Props = {
  stats: SharedStats;
};

export default function SharedArtistsStats({ stats }: Props) {
  return (
    <div className="bg-neutral-900 rounded-2xl">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-neutral-800 rounded-2xl p-4 flex items-center gap-4">
          <Music size={32} className="text-brand-orange shrink-0" />
          <div className="flex flex-col">
            <span className="text-xl font-bold">{stats.songs}</span>
            <span className="text-sm text-neutral-300"> שירים משותפים</span>
          </div>
        </div>

        <div className="bg-neutral-800 rounded-2xl p-4 flex items-center gap-4">
          <CalendarCheck size={32} className="text-brand-orange shrink-0" />
          <div className="flex flex-col">
            <span className="text-xl font-bold">{stats.lineups}</span>
            <span className="text-sm text-neutral-300">לינאפים משותפים</span>
          </div>
        </div>

        <div className="bg-neutral-800 rounded-2xl p-4 flex items-center gap-4">
          <Users size={32} className="text-brand-orange shrink-0" />
          <div className="flex flex-col">
            <span className="text-xl font-bold">{stats.artists}</span>
            <span className="text-sm text-neutral-300">אמנים משותפים</span>
          </div>
        </div>
      </div>
    </div>
  );
}
