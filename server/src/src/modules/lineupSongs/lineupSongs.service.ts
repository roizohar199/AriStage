import { AppError } from "../../core/errors.js";
import {
  getNextPosition,
  insertLineupSong,
  listLineupSongs,
  removeSongFromLineup,
  updateSongPosition,
  updateChartPdf,
  getLineupSongById,
} from "./lineupSongs.repository.js";
import { lineupBelongsToUser } from "../lineups/lineups.repository.js";

async function ensureAccess(lineupId, user) {
  if (user.role === "admin") return true;
  const hasAccess = await lineupBelongsToUser(lineupId, user.id);
  if (!hasAccess) {
    throw new AppError(403, "אין לך הרשאה לפעולה בליינאפ הזה");
  }
  return true;
}

const emitUpdate = (lineupId, event = "lineup-updated", data = {}) => {
  if (global.io) {
    global.io.to(`lineup_${lineupId}`).emit("lineup-updated", { lineupId, ...data });
    if (event !== "lineup-updated") {
      global.io.to(`lineup_${lineupId}`).emit(event, { lineupId, ...data });
    }
  }
};

export async function getLineupSongs(lineupId, user) {
  await ensureAccess(lineupId, user);
  return listLineupSongs(lineupId);
}

export async function addSongToLineup(lineupId, user, songId) {
  if (!songId) {
    throw new AppError(400, "חובה לבחור שיר להוספה");
  }

  await ensureAccess(lineupId, user);

  const position = await getNextPosition(lineupId);
  await insertLineupSong(lineupId, songId, position);

  emitUpdate(lineupId, "lineup-song:added", { songId });
}

export async function reorderLineupSongs(lineupId, user, songs) {
  if (!Array.isArray(songs)) {
    throw new AppError(400, "פורמט שגוי - יש להעביר מערך של שירים");
  }

  await ensureAccess(lineupId, user);

  for (let index = 0; index < songs.length; index += 1) {
    await updateSongPosition(lineupId, songs[index], index + 1);
  }

  emitUpdate(lineupId, "lineup-song:reordered", { songs });
}

export async function removeSong(lineupId, user, songId) {
  await ensureAccess(lineupId, user);

  const affected = await removeSongFromLineup(lineupId, songId);
  if (!affected) {
    throw new AppError(404, "השיר לא נמצא בליינאפ");
  }

  emitUpdate(lineupId, "lineup-song:removed", { songId });
}

export async function uploadChartPdfForSong(lineupSongId, user, filePath) {
  const lineupSong = await getLineupSongById(lineupSongId);
  if (!lineupSong) {
    throw new AppError(404, "שיר לא נמצא בליינאפ");
  }

  await ensureAccess(lineupSong.lineup_id, user);

  await updateChartPdf(lineupSongId, filePath);
  emitUpdate(lineupSong.lineup_id);

  return lineupSong;
}

