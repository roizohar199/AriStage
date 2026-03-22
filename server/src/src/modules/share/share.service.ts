import { AppError } from "../../core/errors";
import { ServerLocale, tServer } from "../../i18n/serverI18n";
import {
  findActiveShareToken,
  findLineupById,
  listSharedSongs,
} from "./share.repository";

export async function getSharedLineup(token, locale: ServerLocale = "he-IL") {
  const share = await findActiveShareToken(token);
  if (!share) {
    throw new AppError(404, tServer(locale, "share.invalidOrInactive"));
  }

  const lineup = await findLineupById(share.lineup_id);
  if (!lineup) {
    throw new AppError(404, tServer(locale, "lineups.notFound"));
  }

  const songs = await listSharedSongs(share.lineup_id);

  return {
    lineup,
    songs,
  };
}
