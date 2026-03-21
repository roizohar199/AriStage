import { Users, Music, CalendarCheck } from "lucide-react";
import Bord from "@/modules/shared/components/bord";
import { useTranslation } from "@/hooks/useTranslation.ts";

type SharedStats = {
  artists: number;
  songs: number;
  lineups: number;
};

type Props = {
  stats: SharedStats;
};

export default function SharedArtistsStats({ stats }: Props) {
  const { t } = useTranslation();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <Bord Icon={Music} value={stats.songs} label={t("shared.songs")} />
      <Bord
        Icon={CalendarCheck}
        value={stats.lineups}
        label={t("shared.lineups")}
      />
      <Bord Icon={Users} value={stats.artists} label={t("shared.artists")} />
    </div>
  );
}
