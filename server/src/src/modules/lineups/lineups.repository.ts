import { pool } from "../../database/pool.js";

export async function listLineups(role, userId, hostId = null) {
  let query = "SELECT * FROM lineups";
  const params: any[] = [];

  if (role === "user") {
    // בדף הליינאפים - הצג רק את הליינאפים שהמשתמש יצר בעצמו
    // הליינאפים של המארח יראו רק בדף פרופיל האמן
    query += " WHERE created_by = ?";
    params.push(userId);
  }

  query += " ORDER BY id DESC";
  const [rows] = await pool.query(query, params);
  return rows;
}

// פונקציה לקבלת ליינאפים של משתמש ספציפי (לשימוש ב-ArtistProfile)
export async function listLineupsByUserId(targetUserId) {
  const [rows] = await pool.query(
    "SELECT * FROM lineups WHERE created_by = ? ORDER BY id DESC",
    [targetUserId]
  );
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

export async function deleteLineupRecord(id) {
  await pool.query("DELETE FROM lineups WHERE id = ?", [id]);
}

// פונקציה לקבלת ליינאפים משותפים (אמנים שהזמינו אותי)
export async function listSharedLineups(userId) {
  const [rows] = await pool.query(
    `SELECT 
      l.*,
      l.created_by AS owner_id,
      u.full_name AS owner_name,
      u.avatar AS owner_avatar,
      u.artist_role AS owner_role
     FROM lineups l
     INNER JOIN user_hosts uh ON l.created_by = uh.host_id
     INNER JOIN users u ON l.created_by = u.id
     WHERE uh.guest_id = ? 
       AND uh.invitation_status = 'accepted'
       AND l.created_by != ?
     ORDER BY l.id DESC`,
    [userId, userId]
  );
  return rows;
}
