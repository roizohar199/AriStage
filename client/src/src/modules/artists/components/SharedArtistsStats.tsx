import { Users, Music, CalendarCheck } from "lucide-react";
import Bord from "@/modules/shared/components/bord";

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
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <Bord Icon={Music} value={stats.songs} label="שירים משותפים" />
      <Bord
        Icon={CalendarCheck}
        value={stats.lineups}
        label="לינאפים משותפים"
      />
      <Bord Icon={Users} value={stats.artists} label="אמנים משותפים" />
    </div>
  );
}
