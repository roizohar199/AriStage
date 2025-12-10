import { pool } from "../../database/pool.js";
import fs from "fs";
import path from "path";

export async function listLineupSongs(lineupId) {
  const [rows] = await pool.query(
    `SELECT 
        ls.id, 
        ls.lineup_id, 
        ls.song_id, 
        ls.position,
        ls.chart_pdf,
        s.title, 
        s.artist, 
        s.bpm, 
        s.key_sig,
        s.duration_sec,
        s.notes
     FROM lineup_songs ls
     JOIN songs s ON ls.song_id = s.id
     WHERE ls.lineup_id = ?
     ORDER BY ls.position ASC`,
    [lineupId]
  );
  return rows;
}

export async function getNextPosition(lineupId) {
  const [rows] = await pool.query(
    "SELECT COALESCE(MAX(position), 0) + 1 AS nextPos FROM lineup_songs WHERE lineup_id = ?",
    [lineupId]
  );
  return rows[0].nextPos;
}

export async function insertLineupSong(lineupId, songId, position) {
  await pool.query(
    "INSERT INTO lineup_songs (lineup_id, song_id, position) VALUES (?, ?, ?)",
    [lineupId, songId, position]
  );
}

export async function updateSongPosition(lineupId, songId, position) {
  await pool.query(
    "UPDATE lineup_songs SET position = ? WHERE lineup_id = ? AND song_id = ?",
    [position, lineupId, songId]
  );
}

export async function removeSongFromLineup(lineupId, songId) {
  const [result] = await pool.query(
    "DELETE FROM lineup_songs WHERE lineup_id = ? AND song_id = ?",
    [lineupId, songId]
  );
  return result.affectedRows;
}

export async function updateChartPdf(lineupSongId, chartPdfPath) {
  await pool.query(
    "UPDATE lineup_songs SET chart_pdf = ? WHERE id = ?",
    [chartPdfPath, lineupSongId]
  );
}

export async function getLineupSongById(lineupSongId) {
  const [rows] = await pool.query(
    `SELECT 
        ls.id, 
        ls.lineup_id, 
        ls.song_id, 
        ls.position,
        ls.chart_pdf,
        s.title, 
        s.artist, 
        s.bpm, 
        s.key_sig,
        s.duration_sec,
        s.notes
     FROM lineup_songs ls
     JOIN songs s ON ls.song_id = s.id
     WHERE ls.id = ?`,
    [lineupSongId]
  );
  return rows[0] || null;
}

export async function getLineupSongByLineupAndSong(lineupId, songId) {
  const [rows] = await pool.query(
    `SELECT 
        ls.id, 
        ls.lineup_id, 
        ls.song_id, 
        ls.position,
        ls.chart_pdf,
        s.title, 
        s.artist, 
        s.bpm, 
        s.key_sig,
        s.duration_sec,
        s.notes
     FROM lineup_songs ls
     JOIN songs s ON ls.song_id = s.id
     WHERE ls.lineup_id = ? AND ls.song_id = ?
     ORDER BY ls.id DESC
     LIMIT 1`,
    [lineupId, songId]
  );
  return rows[0] || null;
}

export async function deleteLineupSongChartPdf(lineupSongId) {
  // קבלת נתיב הקובץ לפני המחיקה
  const [rows] = await pool.query(
    "SELECT chart_pdf FROM lineup_songs WHERE id = ?",
    [lineupSongId]
  );
  
  const chartPdf = rows[0]?.chart_pdf;
  
  // מחיקת הקובץ מהדיסק אם קיים
  if (chartPdf) {
    try {
      const filePath = path.join(process.cwd(), chartPdf);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (error) {
      console.error("שגיאה במחיקת קובץ PDF:", error);
      // ממשיכים גם אם המחיקה מהדיסק נכשלה
    }
  }
  
  // עדכון המסד נתונים
  const [result] = await pool.query(
    "UPDATE lineup_songs SET chart_pdf = NULL WHERE id = ?",
    [lineupSongId]
  );
  return result.affectedRows > 0;
}

