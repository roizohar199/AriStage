import { pool } from "../../database/pool.js";

export async function listSongs(role, userId, hostId = null) {
  let query = "SELECT * FROM songs";
  const params = [];

  if (role === "user") {
    // אם המשתמש הוא אורח (יש לו hostId), הצג את השירים שלו וגם של המארח
    if (hostId) {
      query += " WHERE user_id IN (?, ?)";
      params.push(userId, hostId);
    } else {
      // אחרת, הצג את השירים של המשתמש עצמו
      query += " WHERE user_id = ?";
      params.push(userId);
    }
  }

  query += " ORDER BY id DESC";
  const [rows] = await pool.query(query, params);
  return rows;
}

export async function updateSongChartPdf(songId, chartPdfPath) {
  try {
    await pool.query(
      "UPDATE songs SET chart_pdf = ? WHERE id = ?",
      [chartPdfPath, songId]
    );
  } catch (error) {
    // אם השדה לא קיים, נזרוק שגיאה ברורה יותר
    if (error.code === "ER_BAD_FIELD_ERROR" || error.message?.includes("chart_pdf")) {
      throw new Error("השדה chart_pdf לא קיים בטבלה songs. נא להריץ את ה-SQL migration: sql/add_chart_pdf_to_songs.sql");
    }
    throw error;
  }
}

export async function getSongById(songId) {
  const [rows] = await pool.query(
    "SELECT * FROM songs WHERE id = ?",
    [songId]
  );
  return rows[0] || null;
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
    ]
  );
  return result.insertId;
}

export async function updateSong(id, data) {
  const [result] = await pool.query(
    "UPDATE songs SET title=?, artist=?, bpm=?, key_sig=?, duration_sec=?, notes=? WHERE id=?",
    [data.title, data.artist, data.bpm, data.key_sig, data.duration_sec, data.notes, id]
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
    [id, userId]
  );
  return rows.length > 0;
}

