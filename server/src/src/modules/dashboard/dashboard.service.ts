import { AppError } from "../../core/errors.js";
import { countAll, countWhere } from "./dashboard.repository.js";

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

