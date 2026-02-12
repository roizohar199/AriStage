import { AppError } from "../../core/errors";
import { countAll, countWhere } from "./dashboard.repository";
import { pool } from "../../database/pool";
import os from "os";

let lastCpuUsage = process.cpuUsage();
let lastHrtime = process.hrtime.bigint();

function getProcessCpuPercent(): number {
  const nowUsage = process.cpuUsage();
  const nowTime = process.hrtime.bigint();

  const cpuDiffUs =
    nowUsage.user - lastCpuUsage.user + (nowUsage.system - lastCpuUsage.system);
  const timeDiffUs = Number(nowTime - lastHrtime) / 1000;

  lastCpuUsage = nowUsage;
  lastHrtime = nowTime;

  const cores = os.cpus()?.length || 1;
  if (!timeDiffUs || timeDiffUs <= 0) return 0;

  const percent = (cpuDiffUs / (timeDiffUs * cores)) * 100;
  const rounded = Math.round(percent * 10) / 10;
  return Number.isFinite(rounded) ? Math.max(0, rounded) : 0;
}

function getMemorySnapshot() {
  const total = os.totalmem();
  const free = os.freemem();
  const used = Math.max(0, total - free);

  const toMb = (bytes: number) => Math.round((bytes / (1024 * 1024)) * 10) / 10;
  const usedMb = toMb(used);
  const totalMb = toMb(total);
  const percent = total ? Math.round((used / total) * 1000) / 10 : 0;

  return {
    used_mb: usedMb,
    total_mb: totalMb,
    percent,
    label: `${usedMb} MB / ${totalMb} MB (${percent}%)`,
  };
}

function getActiveUsersCount(): number {
  const counts: any = (global as any).activeUserSocketCounts;
  if (counts && typeof counts.size === "number") return counts.size;

  const io: any = (global as any).io;
  const fallback = io?.engine?.clientsCount;
  return typeof fallback === "number" ? fallback : 0;
}

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

    const cpuPercent = getProcessCpuPercent();
    const mem = getMemorySnapshot();
    const activeUsers = getActiveUsersCount();
    const uptimeSeconds = Math.round(process.uptime());

    return {
      role: user.role,
      // Monitoring (Admin tab)
      activeUsers,
      active_users: activeUsers,
      cpu: cpuPercent,
      cpu_percent: cpuPercent,
      memory: mem.label,
      memory_used: mem.used_mb,
      memory_used_mb: mem.used_mb,
      memory_total_mb: mem.total_mb,
      memory_percent: mem.percent,
      uptime_seconds: uptimeSeconds,
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
    [user.id],
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
    hostIds,
  );
  const songsCount = songsRows[0].count;

  // חישוב סך הליינאפים של כל האמנים
  const [lineupsRows] = await pool.query(
    `SELECT COUNT(*) AS count FROM lineups WHERE created_by IN (${placeholders})`,
    hostIds,
  );
  const lineupsCount = lineupsRows[0].count;

  return {
    artists: artistsCount,
    songs: songsCount,
    lineups: lineupsCount,
  };
}
