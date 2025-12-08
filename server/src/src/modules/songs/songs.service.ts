import { AppError } from "../../core/errors.js";
import {
  deleteSong,
  findSongOwnership,
  insertSong,
  listSongs,
  updateSong,
  updateSongChartPdf,
  getSongById,
} from "./songs.repository.js";
import { checkIfGuest } from "../users/users.service.js";

export async function getSongs(user) {
  // בדיקה אם המשתמש הוא אורח
  const hostId = await checkIfGuest(user.id);
  return listSongs(user.role, user.id, hostId);
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
  const song = await getSongById(songId);
  if (!song) {
    throw new AppError(404, "שיר לא נמצא");
  }

  if (user.role !== "admin") {
    const ownsSong = await findSongOwnership(songId, user.id);
    if (!ownsSong) {
      throw new AppError(403, "אין לך הרשאה לעדכן את השיר הזה");
    }
  }

  await updateSongChartPdf(songId, filePath);
  return song;
}

