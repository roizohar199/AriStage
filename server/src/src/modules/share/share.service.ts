import { AppError } from "../../core/errors";
import {
  findActiveShareToken,
  findLineupById,
  listSharedSongs,
} from "./share.repository";

export async function getSharedLineup(token) {
  const share = await findActiveShareToken(token);
  if (!share) {
    throw new AppError(404, "קישור שיתוף לא פעיל או לא קיים");
  }

  const lineup = await findLineupById(share.lineup_id);
  if (!lineup) {
    throw new AppError(404, "ליינאפ לא נמצא");
  }

  const songs = await listSharedSongs(share.lineup_id);

  return {
    lineup,
    songs,
  };
}
