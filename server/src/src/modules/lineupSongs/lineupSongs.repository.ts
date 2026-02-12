import { pool } from "../../database/pool";
import fs from "fs";
import path from "path";

function isMissingSongLyricsTableError(error: any): boolean {
  return (
    error?.code === "ER_NO_SUCH_TABLE" ||
    (typeof error?.message === "string" &&
      error.message.includes("song_lyrics"))
  );
}

export async function listLineupSongs(lineupId) {
  try {
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
          s.notes,
          sl.lyrics_text,
          sl.updated_at AS lyrics_updated_at
       FROM lineup_songs ls
       JOIN songs s ON ls.song_id = s.id
       LEFT JOIN song_lyrics sl ON sl.song_id = s.id
       WHERE ls.lineup_id = ?
       ORDER BY ls.position ASC`,
      [lineupId],
    );
    return rows;
  } catch (error: any) {
    if (isMissingSongLyricsTableError(error)) {
      // Backward-compatible: if song_lyrics table hasn't been created yet,
      // return the same payload but without lyrics fields.
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
        [lineupId],
      );
      return rows;
    }

    throw error;
  }
}

export async function getNextPosition(lineupId) {
  const [rows] = await pool.query(
    "SELECT COALESCE(MAX(position), 0) + 1 AS nextPos FROM lineup_songs WHERE lineup_id = ?",
    [lineupId],
  );
  return rows[0].nextPos;
}

export async function insertLineupSong(lineupId, songId, position) {
  await pool.query(
    "INSERT INTO lineup_songs (lineup_id, song_id, position) VALUES (?, ?, ?)",
    [lineupId, songId, position],
  );
}

export async function updateSongPosition(lineupId, songId, position) {
  await pool.query(
    "UPDATE lineup_songs SET position = ? WHERE lineup_id = ? AND song_id = ?",
    [position, lineupId, songId],
  );
}

export async function removeSongFromLineup(lineupId, songId) {
  const [result] = await pool.query(
    "DELETE FROM lineup_songs WHERE lineup_id = ? AND song_id = ?",
    [lineupId, songId],
  );
  return result.affectedRows;
}

export async function updateChartPdf(lineupSongId, chartPdfPath) {
  await pool.query("UPDATE lineup_songs SET chart_pdf = ? WHERE id = ?", [
    chartPdfPath,
    lineupSongId,
  ]);
}

export async function getLineupSongById(lineupSongId) {
  try {
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
          s.notes,
          sl.lyrics_text,
          sl.updated_at AS lyrics_updated_at
       FROM lineup_songs ls
       JOIN songs s ON ls.song_id = s.id
       LEFT JOIN song_lyrics sl ON sl.song_id = s.id
       WHERE ls.id = ?`,
      [lineupSongId],
    );
    return rows[0] || null;
  } catch (error: any) {
    if (isMissingSongLyricsTableError(error)) {
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
        [lineupSongId],
      );
      return rows[0] || null;
    }

    throw error;
  }
}

export async function getLineupSongByLineupAndSong(lineupId, songId) {
  try {
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
          s.notes,
          sl.lyrics_text,
          sl.updated_at AS lyrics_updated_at
       FROM lineup_songs ls
       JOIN songs s ON ls.song_id = s.id
       LEFT JOIN song_lyrics sl ON sl.song_id = s.id
       WHERE ls.lineup_id = ? AND ls.song_id = ?
       ORDER BY ls.id DESC
       LIMIT 1`,
      [lineupId, songId],
    );
    return rows[0] || null;
  } catch (error: any) {
    if (isMissingSongLyricsTableError(error)) {
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
        [lineupId, songId],
      );
      return rows[0] || null;
    }

    throw error;
  }
}

export async function listLineupSongsForLyricsExport(lineupId) {
  try {
    const [rows] = await pool.query(
      `SELECT
          ls.id,
          ls.position,
          s.title,
          s.artist,
          sl.lyrics_text
       FROM lineup_songs ls
       JOIN songs s ON ls.song_id = s.id
       LEFT JOIN song_lyrics sl ON sl.song_id = s.id
       WHERE ls.lineup_id = ?
       ORDER BY ls.position ASC`,
      [lineupId],
    );
    return rows;
  } catch (error: any) {
    if (isMissingSongLyricsTableError(error)) {
      throw new Error(
        "הטבלה song_lyrics לא קיימת. נא להריץ את ה-SQL migration: sql/create_song_lyrics.sql",
      );
    }

    throw error;
  }
}

export async function deleteLineupSongChartPdf(lineupSongId) {
  // קבלת נתיב הקובץ לפני המחיקה
  const [rows] = await pool.query(
    "SELECT chart_pdf FROM lineup_songs WHERE id = ?",
    [lineupSongId],
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
    [lineupSongId],
  );
  return result.affectedRows > 0;
}
