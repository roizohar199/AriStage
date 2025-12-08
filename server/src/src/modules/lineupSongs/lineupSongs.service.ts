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
import { lineupBelongsToUser, findLineupById } from "../lineups/lineups.repository.js";
import { checkIfGuest } from "../users/users.service.js";
import { emitToUserAndHost } from "../../core/socket.js";

async function ensureAccess(lineupId, user) {
  if (user.role === "admin") return true;
  
  // בדיקה אם הליינאפ שייך למשתמש
  const hasAccess = await lineupBelongsToUser(lineupId, user.id);
  if (hasAccess) return true;
  
  // אם לא, בדיקה אם המשתמש הוא אורח והליינאפ שייך למארח שלו
  const hostId = await checkIfGuest(user.id);
  if (hostId) {
    const hostHasAccess = await lineupBelongsToUser(lineupId, hostId);
    if (hostHasAccess) return true;
  }
  
  throw new AppError(403, "אין לך הרשאה לפעולה בליינאפ הזה");
}

const emitUpdate = (lineupId, event = "lineup-updated", data = {}) => {
  if (global.io) {
    // שליחה לחדר של הליינאפ הספציפי
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

  // שליחה לחדר של הליינאפ הספציפי
  emitUpdate(lineupId, "lineup-song:added", { songId });
  
  // שליחה גם למשתמש ולמארח שלו (אם יש) כדי לרענן דפים אחרים
  if (global.io) {
    const lineup = await findLineupById(lineupId);
    if (lineup) {
      await emitToUserAndHost(
        global.io,
        user.id,
        "lineup-song:added",
        { lineupId, songId, userId: user.id }
      );
      
      if (lineup.created_by !== user.id) {
        await emitToUserAndHost(
          global.io,
          lineup.created_by,
          "lineup-song:added",
          { lineupId, songId, userId: user.id }
        );
      }
    }
  }
}

export async function reorderLineupSongs(lineupId, user, songs) {
  if (!Array.isArray(songs)) {
    throw new AppError(400, "פורמט שגוי - יש להעביר מערך של שירים");
  }

  // רק הבעלים של הליינאפ יכול לשנות את סדר השירים (לא אורחים)
  if (user.role !== "admin") {
    const isOwner = await lineupBelongsToUser(lineupId, user.id);
    if (!isOwner) {
      throw new AppError(403, "רק הבעלים של הליינאפ יכול לשנות את סדר השירים");
    }
  }

  for (let index = 0; index < songs.length; index += 1) {
    await updateSongPosition(lineupId, songs[index], index + 1);
  }

  // שליחה לחדר של הליינאפ הספציפי
  emitUpdate(lineupId, "lineup-song:reordered", { songs });
  
  // שליחה גם למשתמש ולמארח שלו (אם יש) כדי לרענן דפים אחרים
  if (global.io) {
    // קבלת פרטי הליינאפ כדי לדעת מי יצר אותו
    const lineup = await findLineupById(lineupId);
    if (lineup) {
      // שליחה למשתמש שביצע את הפעולה ולמארח שלו
      await emitToUserAndHost(
        global.io,
        user.id,
        "lineup-song:reordered",
        { lineupId, songs, userId: user.id }
      );
      
      // שליחה גם למשתמש שיצר את הליינאפ (אם הוא שונה מהמשתמש שביצע את הפעולה)
      if (lineup.created_by !== user.id) {
        await emitToUserAndHost(
          global.io,
          lineup.created_by,
          "lineup-song:reordered",
          { lineupId, songs, userId: user.id }
        );
      }
    }
  }
}

export async function removeSong(lineupId, user, songId) {
  await ensureAccess(lineupId, user);

  const affected = await removeSongFromLineup(lineupId, songId);
  if (!affected) {
    throw new AppError(404, "השיר לא נמצא בליינאפ");
  }

  // שליחה לחדר של הליינאפ הספציפי
  emitUpdate(lineupId, "lineup-song:removed", { songId });
  
  // שליחה גם למשתמש ולמארח שלו (אם יש) כדי לרענן דפים אחרים
  if (global.io) {
    const lineup = await findLineupById(lineupId);
    if (lineup) {
      await emitToUserAndHost(
        global.io,
        user.id,
        "lineup-song:removed",
        { lineupId, songId, userId: user.id }
      );
      
      if (lineup.created_by !== user.id) {
        await emitToUserAndHost(
          global.io,
          lineup.created_by,
          "lineup-song:removed",
          { lineupId, songId, userId: user.id }
        );
      }
    }
  }
}

export async function uploadChartPdfForSong(lineupSongId, user, filePath) {
  const lineupSong = await getLineupSongById(lineupSongId);
  if (!lineupSong) {
    throw new AppError(404, "שיר לא נמצא בליינאפ");
  }

  await ensureAccess(lineupSong.lineup_id, user);

  await updateChartPdf(lineupSongId, filePath);
  
  // שליחה לחדר של הליינאפ הספציפי
  emitUpdate(lineupSong.lineup_id, "lineup-song:chart-uploaded", { lineupSongId, songId: lineupSong.song_id });
  
  // שליחה גם למשתמש ולמארח שלו (אם יש) כדי לרענן דפים אחרים
  if (global.io) {
    const lineup = await findLineupById(lineupSong.lineup_id);
    if (lineup) {
      await emitToUserAndHost(
        global.io,
        user.id,
        "lineup-song:chart-uploaded",
        { lineupId: lineupSong.lineup_id, lineupSongId, songId: lineupSong.song_id, userId: user.id }
      );
      
      if (lineup.created_by !== user.id) {
        await emitToUserAndHost(
          global.io,
          lineup.created_by,
          "lineup-song:chart-uploaded",
          { lineupId: lineupSong.lineup_id, lineupSongId, songId: lineupSong.song_id, userId: user.id }
        );
      }
    }
  }

  return lineupSong;
}

