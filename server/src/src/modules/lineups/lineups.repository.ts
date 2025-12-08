import { pool } from "../../database/pool.js";

export async function listLineups(role, userId, hostId = null) {
  let query = "SELECT * FROM lineups";
  const params = [];

  if (role === "user") {
    // אם המשתמש הוא אורח (יש לו hostId), הצג את הליינאפים שלו וגם של המארח
    if (hostId) {
      query += " WHERE created_by IN (?, ?)";
      params.push(userId, hostId);
    } else {
      // אחרת, הצג את הליינאפים של המשתמש עצמו
      query += " WHERE created_by = ?";
      params.push(userId);
    }
  }

  query += " ORDER BY id DESC";
  const [rows] = await pool.query(query, params);
  return rows;
}

export async function insertLineup(data) {
  const [result] = await pool.query(
    `INSERT INTO lineups 
       (title, date, time, location, description, created_by)
       VALUES (?, ?, ?, ?, ?, ?)`,
    [
      data.title,
      data.date,
      data.time,
      data.location,
      data.description,
      data.created_by,
    ]
  );

  return findLineupById(result.insertId);
}

export async function updateLineupRecord(id, data) {
  await pool.query(
    `UPDATE lineups 
       SET title = ?, date = ?, time = ?, location = ?, description = ?
       WHERE id = ?`,
    [data.title, data.date, data.time, data.location, data.description, id]
  );

  return findLineupById(id);
}

export async function findLineupById(id) {
  const [rows] = await pool.query("SELECT * FROM lineups WHERE id = ?", [id]);
  return rows[0];
}

export async function lineupBelongsToUser(id, userId) {
  const [rows] = await pool.query(
    "SELECT id FROM lineups WHERE id = ? AND created_by = ?",
    [id, userId]
  );
  return rows.length > 0;
}

export async function findActiveShare(lineupId) {
  const [rows] = await pool.query(
    "SELECT share_token FROM lineup_shares WHERE lineup_id = ? AND is_active = 1 LIMIT 1",
    [lineupId]
  );
  return rows[0];
}

export async function insertShareToken(lineupId, token) {
  await pool.query(
    "INSERT INTO lineup_shares (lineup_id, share_token, is_active) VALUES (?, ?, 1)",
    [lineupId, token]
  );
  return token;
}

export async function deactivateShare(lineupId) {
  await pool.query(
    "UPDATE lineup_shares SET is_active = 0 WHERE lineup_id = ? AND is_active = 1",
    [lineupId]
  );
}

