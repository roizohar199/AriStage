import { pool } from "../../database/pool.js";

export async function findActiveShareToken(token) {
  const [rows] = await pool.query(
    "SELECT lineup_id FROM lineup_shares WHERE share_token = ? LIMIT 1",
    [token]
  );
  return rows[0];
}

export async function findLineupById(lineupId) {
  const [rows] = await pool.query(
    "SELECT id, title, date, time, location, description FROM lineups WHERE id = ? LIMIT 1",
    [lineupId]
  );
  return rows[0];
}

export async function listSharedSongs(lineupId) {
  const [rows] = await pool.query(
    `SELECT 
        ls.song_id,
        s.title,
        s.artist,
        s.bpm,
        s.key_sig,
        s.duration_sec,
        s.notes
      FROM lineup_songs ls
      JOIN songs s ON s.id = ls.song_id
      WHERE ls.lineup_id = ?
      ORDER BY ls.position ASC`,
    [lineupId]
  );
  return rows;
}
