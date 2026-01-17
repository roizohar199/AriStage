import { getSongChartsByUser } from "./songs.repository.js";
// שליפת כל הצ'ארטים של שיר עבור המשתמש
export async function getPrivateChartsForSong(songId, user) {
  return await getSongChartsByUser(songId, user.id);
}
import { insertSongChart } from "./songs.repository.js";
// העלאת צ'ארט פרטי למשתמש
export async function uploadPrivateChartPdfForSong(songId, user, filePath) {
  // ודא שהשיר קיים
  const song = await getSongById(songId);
  if (!song) {
    throw new Error("שיר לא נמצא");
  }
  // שמור את הצ'ארט בטבלת song_charts
  const chartId = await insertSongChart({
    song_id: songId,
    user_id: user.id,
    file_path: filePath,
  });
  return chartId;
}
import { AppError } from "../../core/errors.js";
import {
  deleteSong,
  findSongOwnership,
  insertSong,
  listSongs,
  updateSong,
  updateSongChartPdf,
  getSongById,
  deleteSongChartPdf,
  upsertSongLyrics,
  deleteSongLyrics,
} from "./songs.repository.js";
import { checkIfGuest } from "../users/users.service.js";

export async function getSongs(user) {
  // בדיקה אם המשתמש הוא אורח - מחזיר רשימת מארחים
  const hostIds = await checkIfGuest(user.id);
  const hostIdsArray: number[] = Array.isArray(hostIds)
    ? hostIds
    : hostIds
      ? [hostIds]
      : [];
  return listSongs(user.role, user.id, hostIdsArray);
}

export async function createSong(user, payload) {
  if (!payload.title) {
    throw new AppError(400, "שם שיר הוא שדה חובה");
  }

  // כל המשתמשים יכולים ליצור שירים (כולל אורחים)
  const songId = await insertSong({
    title: payload.title.trim(),
    artist: payload.artist || "",
    bpm: payload.bpm || null,
    key_sig: payload.key_sig || "",
    duration_sec: payload.duration_sec || null,
    notes: payload.notes || "",
    user_id: user.id,
  });

  return { id: songId };
}

export async function updateSongDetails(user, id, payload) {
  if (!payload.title) {
    throw new AppError(400, "שם שיר הוא שדה חובה");
  }

  // כל המשתמשים יכולים לערוך את השירים שלהם (כולל אורחים)
  if (user.role !== "admin") {
    const ownsSong = await findSongOwnership(id, user.id);
    if (!ownsSong) {
      throw new AppError(403, "אין לך הרשאה לעדכן את השיר הזה");
    }
  }

  const affected = await updateSong(id, {
    title: payload.title.trim(),
    artist: payload.artist || "",
    bpm: payload.bpm || null,
    key_sig: payload.key_sig || "",
    duration_sec: payload.duration_sec || null,
    notes: payload.notes || "",
  });

  if (!affected) {
    throw new AppError(404, "שיר לא נמצא");
  }
}

export async function removeSong(user, id) {
  // כל המשתמשים יכולים למחוק את השירים שלהם (כולל אורחים)
  if (user.role !== "admin") {
    const ownsSong = await findSongOwnership(id, user.id);
    if (!ownsSong) {
      throw new AppError(403, "אין לך הרשאה למחוק את השיר הזה");
    }
  }

  const affected = await deleteSong(id);
  if (!affected) {
    throw new AppError(404, "שיר לא נמצא");
  }
}

export async function uploadChartPdfForSong(songId, user, filePath) {
  // כל המשתמשים יכולים להעלות קבצים לשירים שלהם (כולל אורחים)
  // אורחים יכולים גם להעלות קבצים לשירים של המארח שלהם
  const song = await getSongById(songId);
  if (!song) {
    throw new AppError(404, "שיר לא נמצא");
  }

  if (user.role !== "admin") {
    const ownsSong = await findSongOwnership(songId, user.id);

    // אם המשתמש לא הבעלים, נבדוק אם הוא אורח והשיר שייך למארח שלו
    if (!ownsSong) {
      const hostIds = await checkIfGuest(user.id);
      const hostIdsArray: number[] = Array.isArray(hostIds)
        ? hostIds
        : hostIds
          ? [hostIds]
          : [];
      if (hostIdsArray.includes(song.user_id)) {
        // המשתמש הוא אורח והשיר שייך למארח שלו - מותר להעלות PDF
      } else {
        throw new AppError(403, "אין לך הרשאה לעדכן את השיר הזה");
      }
    }
  }

  await updateSongChartPdf(songId, filePath);
  return song;
}

export async function removeChartPdfForSong(songId, user) {
  // כל המשתמשים יכולים למחוק קבצים מהשירים שלהם (כולל אורחים)
  // אורחים יכולים גם למחוק קבצים מהשירים של המארח שלהם
  const song = await getSongById(songId);
  if (!song) {
    throw new AppError(404, "שיר לא נמצא");
  }

  if (user.role !== "admin") {
    const ownsSong = await findSongOwnership(songId, user.id);

    // אם המשתמש לא הבעלים, נבדוק אם הוא אורח והשיר שייך למארח שלו
    if (!ownsSong) {
      const hostIds = await checkIfGuest(user.id);
      const hostIdsArray: number[] = Array.isArray(hostIds)
        ? hostIds
        : hostIds
          ? [hostIds]
          : [];
      if (hostIdsArray.includes(song.user_id)) {
        // המשתמש הוא אורח והשיר שייך למארח שלו - מותר למחוק PDF
      } else {
        throw new AppError(403, "אין לך הרשאה למחוק את הקובץ הזה");
      }
    }
  }

  const deleted = await deleteSongChartPdf(songId);
  if (!deleted) {
    throw new AppError(404, "קובץ PDF לא נמצא");
  }

  return song;
}

export async function setLyricsForSong(songId, user, lyricsText) {
  const song = await getSongById(songId);
  if (!song) {
    throw new AppError(404, "שיר לא נמצא");
  }

  // Only owner (or admin) may edit lyrics
  if (user.role !== "admin") {
    const ownsSong = await findSongOwnership(songId, user.id);
    if (!ownsSong) {
      throw new AppError(403, "רק בעל המאגר יכול להוסיף/לערוך/למחוק מילים");
    }
  }

  try {
    await upsertSongLyrics(songId, lyricsText);
  } catch (error: any) {
    throw new AppError(400, error?.message || "שגיאה בשמירת מילים");
  }

  return await getSongById(songId);
}

export async function removeLyricsForSong(songId, user) {
  const song = await getSongById(songId);
  if (!song) {
    throw new AppError(404, "שיר לא נמצא");
  }

  if (user.role !== "admin") {
    const ownsSong = await findSongOwnership(songId, user.id);
    if (!ownsSong) {
      throw new AppError(403, "רק בעל המאגר יכול להוסיף/לערוך/למחוק מילים");
    }
  }

  try {
    await deleteSongLyrics(songId);
  } catch (error: any) {
    throw new AppError(400, error?.message || "שגיאה במחיקת מילים");
  }

  return await getSongById(songId);
}
