import { AppError } from "../../core/errors.js";
import {
  getNextPosition,
  insertLineupSong,
  listLineupSongs,
  removeSongFromLineup,
  updateSongPosition,
  updateChartPdf,
  getLineupSongById,
  deleteLineupSongChartPdf,
  getLineupSongByLineupAndSong,
} from "./lineupSongs.repository.js";
import {
  lineupBelongsToUser,
  findLineupById,
} from "../lineups/lineups.repository.js";
import { checkIfGuest } from "../users/users.service.js";
import { emitToUserAndHost } from "../../core/socket.js";

async function ensureAccess(lineupId, user) {
  if (user.role === "admin") return true;

  // בדיקה אם הליינאפ שייך למשתמש
  const hasAccess = await lineupBelongsToUser(lineupId, user.id);
  if (hasAccess) return true;

  // אם לא, בדיקה אם המשתמש הוא אורח והליינאפ שייך לאחד מהמארחים שלו
  const hostIds = await checkIfGuest(user.id);
  const hostIdsArray: number[] = Array.isArray(hostIds)
    ? hostIds
    : hostIds
    ? [hostIds]
    : [];
  if (hostIdsArray.length > 0) {
    // בדיקה אם אחד מהמארחים הוא הבעלים של הליינאפ
    for (const hostId of hostIdsArray) {
      const hostHasAccess = await lineupBelongsToUser(lineupId, hostId);
      if (hostHasAccess) return true;
    }
  }

  throw new AppError(403, "אין לך הרשאה לפעולה בליינאפ הזה");
}

const emitUpdate = async (lineupId, event = "lineup-updated", data = {}) => {
  if (!global.io) return;

  const payload = { lineupId, ...data };

  // שליחה לחדר של הליינאפ הספציפי
  global.io.to(`lineup_${lineupId}`).emit("lineup-updated", payload);
  if (event !== "lineup-updated") {
    global.io.to(`lineup_${lineupId}`).emit(event, payload);
  }

  // שליחה גם לחדר של המארח שיצר את הליינאפ (כדי שכל האמנים שלו יקבלו את העדכון)
  try {
    const lineup = await findLineupById(lineupId);
    if (lineup && lineup.created_by) {
      // שליחה למארח ולכל האמנים שלו
      const { emitToHost } = await import("../../core/socket.js");
      await emitToHost(global.io, lineup.created_by, "lineup-updated", payload);
      if (event !== "lineup-updated") {
        await emitToHost(global.io, lineup.created_by, event, payload);
      }
    }
  } catch (err: any) {
    // אם יש שגיאה, רק לוג - לא לשבור את הפעולה
    console.warn("⚠️ Warning: Could not emit to host room:", err.message);
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

  // קבלת הנתונים המלאים של השיר שנוסף
  const lineupSong = await getLineupSongByLineupAndSong(lineupId, songId);

  // שליחה לחדר של הליינאפ הספציפי
  await emitUpdate(lineupId, "lineup-song:added", { songId, lineupSong });

  // שליחה גם למשתמש ולמארח שלו (אם יש) כדי לרענן דפים אחרים
  if (global.io) {
    const lineup = await findLineupById(lineupId);
    if (lineup) {
      // שליחה למשתמש שביצע את הפעולה ולמארח שלו (אם הוא אורח)
      await emitToUserAndHost(global.io, user.id, "lineup-song:added", {
        lineupId,
        songId,
        lineupSong,
        userId: user.id,
      });

      // שליחה גם למארח שיצר את הליינאפ (אם הוא שונה מהמשתמש שביצע את הפעולה)
      // זה מבטיח שגם אם מארח משנה משהו, האורחים שלו מקבלים את זה
      if (lineup.created_by !== user.id) {
        await emitToUserAndHost(
          global.io,
          lineup.created_by,
          "lineup-song:added",
          { lineupId, songId, lineupSong, userId: user.id }
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
  await emitUpdate(lineupId, "lineup-song:reordered", { songs });

  // שליחה גם למשתמש ולמארח שלו (אם יש) כדי לרענן דפים אחרים
  if (global.io) {
    // קבלת פרטי הליינאפ כדי לדעת מי יצר אותו
    const lineup = await findLineupById(lineupId);
    if (lineup) {
      // שליחה למשתמש שביצע את הפעולה ולמארח שלו
      await emitToUserAndHost(global.io, user.id, "lineup-song:reordered", {
        lineupId,
        songs,
        userId: user.id,
      });

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
  await emitUpdate(lineupId, "lineup-song:removed", { songId });

  // שליחה גם למשתמש ולמארח שלו (אם יש) כדי לרענן דפים אחרים
  if (global.io) {
    const lineup = await findLineupById(lineupId);
    if (lineup) {
      await emitToUserAndHost(global.io, user.id, "lineup-song:removed", {
        lineupId,
        songId,
        userId: user.id,
      });

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

  // קבלת הנתונים המלאים של השיר שעודכן (עם ה-PDF החדש)
  const updatedLineupSong = await getLineupSongById(lineupSongId);

  // שליחה לחדר של הליינאפ הספציפי
  await emitUpdate(lineupSong.lineup_id, "lineup-song:chart-uploaded", {
    lineupSongId,
    songId: lineupSong.song_id,
    lineupSong: updatedLineupSong,
  });

  // שליחה גם למשתמש ולמארח שלו (אם יש) כדי לרענן דפים אחרים
  if (global.io) {
    const lineup = await findLineupById(lineupSong.lineup_id);
    if (lineup) {
      await emitToUserAndHost(
        global.io,
        user.id,
        "lineup-song:chart-uploaded",
        {
          lineupId: lineupSong.lineup_id,
          lineupSongId,
          songId: lineupSong.song_id,
          lineupSong: updatedLineupSong,
          userId: user.id,
        }
      );

      if (lineup.created_by !== user.id) {
        await emitToUserAndHost(
          global.io,
          lineup.created_by,
          "lineup-song:chart-uploaded",
          {
            lineupId: lineupSong.lineup_id,
            lineupSongId,
            songId: lineupSong.song_id,
            lineupSong: updatedLineupSong,
            userId: user.id,
          }
        );
      }
    }
  }

  return updatedLineupSong;
}

export async function removeChartPdfForSong(lineupSongId, user) {
  const lineupSong = await getLineupSongById(lineupSongId);
  if (!lineupSong) {
    throw new AppError(404, "שיר לא נמצא בליינאפ");
  }

  await ensureAccess(lineupSong.lineup_id, user);

  const deleted = await deleteLineupSongChartPdf(lineupSongId);
  if (!deleted) {
    throw new AppError(404, "קובץ PDF לא נמצא");
  }

  // שליחה לחדר של הליינאפ הספציפי
  await emitUpdate(lineupSong.lineup_id, "lineup-song:chart-deleted", {
    lineupSongId,
    songId: lineupSong.song_id,
  });

  // שליחה גם למשתמש ולמארח שלו (אם יש) כדי לרענן דפים אחרים
  if (global.io) {
    const lineup = await findLineupById(lineupSong.lineup_id);
    if (lineup) {
      await emitToUserAndHost(global.io, user.id, "lineup-song:chart-deleted", {
        lineupId: lineupSong.lineup_id,
        lineupSongId,
        songId: lineupSong.song_id,
        userId: user.id,
      });

      if (lineup.created_by !== user.id) {
        await emitToUserAndHost(
          global.io,
          lineup.created_by,
          "lineup-song:chart-deleted",
          {
            lineupId: lineupSong.lineup_id,
            lineupSongId,
            songId: lineupSong.song_id,
            userId: user.id,
          }
        );
      }
    }
  }

  return lineupSong;
}
