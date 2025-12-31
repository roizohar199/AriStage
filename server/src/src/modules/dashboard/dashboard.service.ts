import { AppError } from "../../core/errors.js";
import { countAll, countWhere } from "./dashboard.repository.js";
import { pool } from "../../database/pool.js";

export async function getDashboardPayload(user) {
  if (!user?.id) {
    throw new AppError(401, "משתמש לא מזוהה");
  }

  if (user.role === "admin") {
    const [songs, lineups, users, files, notifications, metrics, activeAdmins] =
      await Promise.all([
        countAll("songs"),
        countAll("lineups"),
        countAll("users"),
        countAll("files"),
        countAll("notifications"),
        countAll("metrics"),
        countWhere("users", "role", "admin"),
      ]);

    return {
      role: user.role,
      stats: {
        songs,
        lineups,
        users,
        files,
        notifications,
        metrics,
        activeAdmins,
      },
    };
  }

  const [songs, lineups, files, notifications] = await Promise.all([
    countWhere("songs", "user_id", user.id),
    countWhere("lineups", "created_by", user.id),
    countWhere("files", "user_id", user.id),
    countWhere("notifications", "user_id", user.id),
  ]);

  return {
    role: user.role,
    stats: {
      songs,
      lineups,
      files,
      notifications,
    },
  };
}

export async function getSharedDashboardStats(user) {
  if (!user?.id) {
    throw new AppError(401, "משתמש לא מזוהה");
  }

  // קבלת רשימת אמנים שהזמינו אותי
  const [artistsRows] = await pool.query(
    `SELECT DISTINCT host_id FROM artist_access WHERE guest_id = ?`,
    [user.id]
  );

  const hostIds = artistsRows.map((row) => row.host_id);
  const artistsCount = hostIds.length;

  if (artistsCount === 0) {
    return {
      artists: 0,
      songs: 0,
      lineups: 0,
    };
  }

  // חישוב סך השירים של כל האמנים
  const placeholders = hostIds.map(() => "?").join(", ");
  const [songsRows] = await pool.query(
    `SELECT COUNT(*) AS count FROM songs WHERE user_id IN (${placeholders})`,
    hostIds
  );
  const songsCount = songsRows[0].count;

  // חישוב סך הליינאפים של כל האמנים
  const [lineupsRows] = await pool.query(
    `SELECT COUNT(*) AS count FROM lineups WHERE created_by IN (${placeholders})`,
    hostIds
  );
  const lineupsCount = lineupsRows[0].count;

  return {
    artists: artistsCount,
    songs: songsCount,
    lineups: lineupsCount,
  };
}
