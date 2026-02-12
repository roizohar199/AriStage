import { pool } from "../../database/pool";
import { isElevatedRole } from "../../types/roles";
import fs from "fs";
import path from "path";

function isMissingSongLyricsTableError(error: any): boolean {
  return (
    error?.code === "ER_NO_SUCH_TABLE" ||
    (typeof error?.message === "string" &&
      error.message.includes("song_lyrics"))
  );
}

export async function listSongs(
  role: string,
  userId: number,
  hostIds: number[] = [],
) {
  let query = `
    SELECT
      songs.*,
      songs.user_id AS owner_id,
      users.full_name AS owner_name,
      users.avatar AS owner_avatar,
      users.artist_role AS owner_role,
      users.email AS owner_email,
      sl.lyrics_text,
      sl.updated_at AS lyrics_updated_at
    FROM songs
    JOIN users ON users.id = songs.user_id
    LEFT JOIN song_lyrics sl ON sl.song_id = songs.id
  `;
  const params: any[] = [];

  // Only admin/manager are considered elevated. Any unknown role is
  // treated as a regular artist (scoped like "user").
  if (!isElevatedRole(role)) {
    // אם המשתמש הוא אורח (יש לו מארחים), הצג את השירים שלו וגם של כל המארחים
    if (hostIds && hostIds.length > 0) {
      const placeholders = hostIds.map(() => "?").join(", ");
      query += ` WHERE songs.user_id IN (?, ${placeholders})`;
      params.push(userId, ...hostIds);
    } else {
      // אחרת, הצג את השירים של המשתמש עצמו
      query += " WHERE songs.user_id = ?";
      params.push(userId);
    }
  }

  query += " ORDER BY songs.id DESC";
  try {
    const [rows] = await pool.query(query, params);
    return rows;
  } catch (error: any) {
    if (isMissingSongLyricsTableError(error)) {
      // Backward-compatible: return songs without lyrics fields.
      let fallbackQuery = `
        SELECT
          songs.*,
          songs.user_id AS owner_id,
          users.full_name AS owner_name,
          users.avatar AS owner_avatar,
          users.artist_role AS owner_role,
          users.email AS owner_email
        FROM songs
        JOIN users ON users.id = songs.user_id
      `;

      const fallbackParams: any[] = [];
      if (!isElevatedRole(role)) {
        if (hostIds && hostIds.length > 0) {
          const placeholders = hostIds.map(() => "?").join(", ");
          fallbackQuery += ` WHERE songs.user_id IN (?, ${placeholders})`;
          fallbackParams.push(userId, ...hostIds);
        } else {
          fallbackQuery += " WHERE songs.user_id = ?";
          fallbackParams.push(userId);
        }
      }

      fallbackQuery += " ORDER BY songs.id DESC";
      const [rows] = await pool.query(fallbackQuery, fallbackParams);
      return rows;
    }
    throw error;
  }
}

export async function updateSongChartPdf(songId, chartPdfPath) {
  try {
    await pool.query("UPDATE songs SET chart_pdf = ? WHERE id = ?", [
      chartPdfPath,
      songId,
    ]);
  } catch (error: any) {
    // אם השדה לא קיים, נזרוק שגיאה ברורה יותר
    if (
      error.code === "ER_BAD_FIELD_ERROR" ||
      error.message?.includes("chart_pdf")
    ) {
      throw new Error(
        "השדה chart_pdf לא קיים בטבלה songs. נא להריץ את ה-SQL migration: sql/add_chart_pdf_to_songs.sql",
      );
    }
    throw error;
  }
}

// יצירת צ'ארט חדש
export async function insertSongChart({ song_id, user_id, file_path }) {
  const [result] = await pool.query(
    "INSERT INTO song_charts (song_id, user_id, file_path) VALUES (?, ?, ?)",
    [song_id, user_id, file_path],
  );
  return result.insertId;
}

// שליפת כל הצ'ארטים של שיר עבור משתמש
export async function getSongChartsByUser(song_id, user_id) {
  const [rows] = await pool.query(
    "SELECT * FROM song_charts WHERE song_id = ? AND user_id = ? ORDER BY uploaded_at DESC",
    [song_id, user_id],
  );
  return rows;
}

// שליפת כל הצ'ארטים של שיר (למשתמשים שונים)
export async function getSongCharts(song_id) {
  const [rows] = await pool.query(
    "SELECT * FROM song_charts WHERE song_id = ? ORDER BY uploaded_at DESC",
    [song_id],
  );
  return rows;
}

// מחיקת צ'ארט לפי מזהה
export async function deleteSongChart(chartId, userId) {
  // קבלת נתיב הקובץ לפני מחיקה
  const [rows] = await pool.query(
    "SELECT file_path FROM song_charts WHERE id = ? AND user_id = ?",
    [chartId, userId],
  );
  const chart = rows[0];
  if (chart?.file_path) {
    try {
      const filePath = path.join(process.cwd(), chart.file_path);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (error) {
      console.error("שגיאה במחיקת קובץ PDF:", error);
    }
  }
  // מחיקה מהמסד
  const [result] = await pool.query(
    "DELETE FROM song_charts WHERE id = ? AND user_id = ?",
    [chartId, userId],
  );
  return result.affectedRows > 0;
}

export async function getSongById(songId) {
  try {
    const [rows] = await pool.query(
      `
      SELECT
        songs.*,
        songs.user_id AS owner_id,
        users.full_name AS owner_name,
        users.avatar AS owner_avatar,
        users.artist_role AS owner_role,
        users.email AS owner_email,
        sl.lyrics_text,
        sl.updated_at AS lyrics_updated_at
      FROM songs
      JOIN users ON users.id = songs.user_id
      LEFT JOIN song_lyrics sl ON sl.song_id = songs.id
      WHERE songs.id = ?
      `,
      [songId],
    );
    return rows[0] || null;
  } catch (error: any) {
    if (isMissingSongLyricsTableError(error)) {
      const [rows] = await pool.query(
        `
        SELECT
          songs.*,
          songs.user_id AS owner_id,
          users.full_name AS owner_name,
          users.avatar AS owner_avatar,
          users.artist_role AS owner_role,
          users.email AS owner_email
        FROM songs
        JOIN users ON users.id = songs.user_id
        WHERE songs.id = ?
        `,
        [songId],
      );
      return rows[0] || null;
    }
    throw error;
  }
}

export async function upsertSongLyrics(songId, lyricsText) {
  try {
    const trimmed = String(lyricsText ?? "").trim();
    await pool.query(
      `INSERT INTO song_lyrics (song_id, lyrics_text)
       VALUES (?, ?)
       ON DUPLICATE KEY UPDATE lyrics_text = VALUES(lyrics_text), updated_at = CURRENT_TIMESTAMP`,
      [songId, trimmed],
    );
  } catch (error: any) {
    if (isMissingSongLyricsTableError(error)) {
      throw new Error(
        "הטבלה song_lyrics לא קיימת. נא להריץ את ה-SQL migration: sql/create_song_lyrics.sql",
      );
    }
    throw error;
  }
}

export async function deleteSongLyrics(songId) {
  try {
    const [result] = await pool.query(
      "DELETE FROM song_lyrics WHERE song_id = ?",
      [songId],
    );
    return result.affectedRows > 0;
  } catch (error: any) {
    if (isMissingSongLyricsTableError(error)) {
      throw new Error(
        "הטבלה song_lyrics לא קיימת. נא להריץ את ה-SQL migration: sql/create_song_lyrics.sql",
      );
    }
    throw error;
  }
}

export async function insertSong(data) {
  const [result] = await pool.query(
    "INSERT INTO songs (title, artist, bpm, key_sig, duration_sec, notes, user_id) VALUES (?, ?, ?, ?, ?, ?, ?)",
    [
      data.title,
      data.artist,
      data.bpm,
      data.key_sig,
      data.duration_sec,
      data.notes,
      data.user_id,
    ],
  );
  return result.insertId;
}

export async function updateSong(id, data) {
  const [result] = await pool.query(
    "UPDATE songs SET title=?, artist=?, bpm=?, key_sig=?, duration_sec=?, notes=? WHERE id=?",
    [
      data.title,
      data.artist,
      data.bpm,
      data.key_sig,
      data.duration_sec,
      data.notes,
      id,
    ],
  );
  return result.affectedRows;
}

export async function deleteSong(id) {
  const [result] = await pool.query("DELETE FROM songs WHERE id = ?", [id]);
  return result.affectedRows;
}

export async function findSongOwnership(id, userId) {
  const [rows] = await pool.query(
    "SELECT id FROM songs WHERE id = ? AND user_id = ?",
    [id, userId],
  );
  return rows.length > 0;
}

export async function deleteSongChartPdf(songId) {
  // קבלת נתיב הקובץ לפני המחיקה
  const [rows] = await pool.query("SELECT chart_pdf FROM songs WHERE id = ?", [
    songId,
  ]);

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
    "UPDATE songs SET chart_pdf = NULL WHERE id = ?",
    [songId],
  );
  return result.affectedRows > 0;
}
