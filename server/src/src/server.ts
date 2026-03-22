import http from "http";
import { Server } from "socket.io";
import { createApp } from "./app";
import { env } from "./config/env";
import { socketCorsOptions } from "./config/cors";
import { logger } from "./core/logger";
import { verifyToken } from "./modules/auth/token.service";
import { createWebSocketRateLimiter } from "./middleware/rateLimiter";
import { tServer } from "./i18n/serverI18n";
import { pool } from "./database/pool";

declare global {
  // מאפשר שימוש ב־global.io בקבצים אחרים
  var io: Server;

  // מעקב אחרי משתמשים פעילים (unique) לפי חיבורי Socket.IO
  var activeUserSocketCounts: Map<number, number>;
  var socketToUserId: Map<string, number>;
}

const app = createApp();
const server = http.createServer(app);

// יצירת socket.io
const io = new Server(server, {
  cors: socketCorsOptions,
});

// שיתוף ה־io לכל המערכת
global.io = io;

// מעקב משתמשים פעילים
global.activeUserSocketCounts = new Map<number, number>();
global.socketToUserId = new Map<string, number>();

// WebSocket rate limiter
const wsRateLimiter = createWebSocketRateLimiter();
const websocketAuthRequired = tServer(
  "he-IL",
  "websocket.authenticationRequired",
);
const websocketInvalidToken = tServer("he-IL", "websocket.invalidToken");
const websocketRateLimitExceeded = tServer(
  "he-IL",
  "websocket.rateLimitExceeded",
);
const websocketAuthenticationFailed = tServer(
  "he-IL",
  "websocket.authenticationFailed",
);
const websocketUnauthorized = tServer("he-IL", "websocket.unauthorized");

// WebSocket Authentication Middleware
io.use((socket, next) => {
  try {
    const relaxedWsSecurity =
      env.nodeEnv === "development" && process.env.WS_AUTH_REQUIRED !== "1";

    // Get token from auth or query
    const token =
      socket.handshake.auth?.token || (socket.handshake.query?.token as string);

    if (!token) {
      if (relaxedWsSecurity) {
        // Dev mode: allow unauthenticated sockets (pre-login) to avoid disconnect loops.
        socket.data.user = {
          id: 0,
          email: "",
          role: "guest",
          full_name: "",
        };
        logger.debug(`⚠️ WebSocket connected without token (dev relaxed)`, {
          socketId: socket.id,
          address: socket.handshake.address,
        });
        return next();
      }

      logger.warn(`🔴 WebSocket connection rejected: No token provided`, {
        socketId: socket.id,
        address: socket.handshake.address,
      });
      return next(new Error(websocketAuthRequired));
    }

    // Verify JWT token
    const decoded = verifyToken(token);

    if (!decoded || !decoded.id) {
      if (relaxedWsSecurity) {
        socket.data.user = {
          id: 0,
          email: "",
          role: "guest",
          full_name: "",
        };
        logger.debug(
          `⚠️ WebSocket connected with invalid token (dev relaxed)`,
          {
            socketId: socket.id,
            address: socket.handshake.address,
          },
        );
        return next();
      }

      logger.warn(`🔴 WebSocket connection rejected: Invalid token`, {
        socketId: socket.id,
        address: socket.handshake.address,
      });
      return next(new Error(websocketInvalidToken));
    }

    // Rate limit check
    const clientIp = socket.handshake.address;
    if (!wsRateLimiter(clientIp)) {
      logger.warn(`🔴 WebSocket connection rejected: Rate limit exceeded`, {
        socketId: socket.id,
        userId: decoded.id,
        address: clientIp,
      });
      return next(new Error(websocketRateLimitExceeded));
    }

    // Attach user data to socket
    socket.data.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
      full_name: decoded.full_name,
    };

    logger.debug(`✅ WebSocket authenticated`, {
      socketId: socket.id,
      userId: decoded.id,
    });

    next();
  } catch (error: any) {
    logger.error(`❌ WebSocket authentication error`, {
      socketId: socket.id,
      error: error.message,
    });
    next(new Error(websocketAuthenticationFailed));
  }
});

function trackSocketUser(socketId: string, userId: number) {
  const prevUserId = global.socketToUserId.get(socketId);
  if (prevUserId === userId) return;

  // אם הסוקט היה משויך למשתמש אחר — ננקה קודם
  if (typeof prevUserId === "number") {
    const prevCount = global.activeUserSocketCounts.get(prevUserId) || 0;
    if (prevCount <= 1) global.activeUserSocketCounts.delete(prevUserId);
    else global.activeUserSocketCounts.set(prevUserId, prevCount - 1);
  }

  global.socketToUserId.set(socketId, userId);
  const nextCount = (global.activeUserSocketCounts.get(userId) || 0) + 1;
  global.activeUserSocketCounts.set(userId, nextCount);
}

function untrackSocket(socketId: string) {
  const userId = global.socketToUserId.get(socketId);
  if (typeof userId !== "number") return;

  global.socketToUserId.delete(socketId);
  const prevCount = global.activeUserSocketCounts.get(userId) || 0;
  if (prevCount <= 1) global.activeUserSocketCounts.delete(userId);
  else global.activeUserSocketCounts.set(userId, prevCount - 1);
}

async function hasAcceptedHostAccess(
  userId: number,
  hostId: number,
): Promise<boolean> {
  const [rows] = (await pool.query(
    `SELECT 1
     FROM user_hosts
     WHERE guest_id = ? AND host_id = ? AND invitation_status = 'accepted'
     LIMIT 1`,
    [userId, hostId],
  )) as any[];

  return Array.isArray(rows) && rows.length > 0;
}

async function canAccessHostRoom(
  userId: number,
  hostId: number,
  role?: string,
): Promise<boolean> {
  const [rows] = (await pool.query(
    "SELECT id AS owner_id FROM users WHERE id = ? LIMIT 1",
    [hostId],
  )) as any[];

  const host = rows?.[0];
  if (!host) {
    return false;
  }

  if (role === "admin") {
    return true;
  }

  return (
    host.owner_id === userId || hasAcceptedHostAccess(userId, host.owner_id)
  );
}

async function canAccessLineupRoom(
  userId: number,
  lineupId: number,
  role?: string,
): Promise<boolean> {
  const [rows] = (await pool.query(
    "SELECT id, created_by AS owner_id FROM lineups WHERE id = ? LIMIT 1",
    [lineupId],
  )) as any[];

  const lineup = rows?.[0];
  if (!lineup) {
    return false;
  }

  if (role === "admin") {
    return true;
  }

  return (
    lineup.owner_id === userId || hasAcceptedHostAccess(userId, lineup.owner_id)
  );
}

// -------------------------
//   SOCKET EVENTS
// -------------------------
io.on("connection", (socket) => {
  const authenticatedUser = socket.data.user;
  const strictRoomSecurity =
    env.nodeEnv !== "development" || process.env.WS_STRICT_ROOMS === "1";
  logger.info(`🟢 Client connected: ${socket.id}`, {
    userId: authenticatedUser?.id,
  });

  // הצטרפות לחדר של משתמש ספציפי - with permission check
  socket.on("join-user", (userId: number) => {
    const numericUserId = Number(userId);

    // Security: Only allow users to join their own room (unless admin)
    if (strictRoomSecurity) {
      if (!authenticatedUser?.id) {
        logger.warn(`🚫 Unauthorized attempt to join user room (no auth)`, {
          socketId: socket.id,
          requestedUserId: numericUserId,
        });
        socket.emit("error", { message: websocketUnauthorized });
        return;
      }

      if (
        authenticatedUser.role !== "admin" &&
        authenticatedUser.id !== numericUserId
      ) {
        logger.warn(`🚫 Unauthorized attempt to join user room`, {
          socketId: socket.id,
          requestedUserId: numericUserId,
          actualUserId: authenticatedUser.id,
        });
        socket.emit("error", { message: websocketUnauthorized });
        return;
      }
    }

    if (Number.isFinite(numericUserId) && numericUserId > 0) {
      trackSocketUser(socket.id, numericUserId);
      socket.join(`user_${userId}`);
      logger.info(`🔗 Client ${socket.id} joined user_${userId}`);
    }
  });

  // הצטרפות לחדר של מארח (כולל אמנים שלו) - with permission check
  socket.on("join-host", async (hostId: number) => {
    const socketUser = socket.data.user;
    const numericHostId = Number(hostId);

    if (
      !socketUser?.id ||
      !Number.isInteger(numericHostId) ||
      numericHostId <= 0
    ) {
      return socket.emit("error", "Unauthorized");
    }

    try {
      const authorized = await canAccessHostRoom(
        socketUser.id,
        numericHostId,
        socketUser.role,
      );

      if (!authorized) {
        logger.warn(`🚫 Unauthorized attempt to join host room`, {
          socketId: socket.id,
          requestedHostId: numericHostId,
          actualUserId: socketUser.id,
        });
        return socket.emit("error", "Unauthorized");
      }

      socket.join(`host_${numericHostId}`);
      logger.info(`🔗 Client ${socket.id} joined host_${numericHostId}`, {
        userId: socketUser.id,
      });
    } catch (error: any) {
      logger.error(`❌ Failed to authorize host room join`, {
        socketId: socket.id,
        userId: socketUser.id,
        requestedHostId: numericHostId,
        error: error.message,
      });
      return socket.emit("error", "Unauthorized");
    }
  });

  // הצטרפות לחדר של ליינאפ ספציפי - with permission check
  socket.on("join-lineup", async (lineupId) => {
    const socketUser = socket.data.user;
    const numericLineupId = Number(lineupId);

    if (
      !socketUser?.id ||
      !Number.isInteger(numericLineupId) ||
      numericLineupId <= 0
    ) {
      return socket.emit("error", "Unauthorized");
    }

    try {
      const authorized = await canAccessLineupRoom(
        socketUser.id,
        numericLineupId,
        socketUser.role,
      );

      if (!authorized) {
        logger.warn(`🚫 Unauthorized attempt to join lineup room`, {
          socketId: socket.id,
          requestedLineupId: numericLineupId,
          actualUserId: socketUser.id,
        });
        return socket.emit("error", "Unauthorized");
      }

      socket.join(`lineup_${numericLineupId}`);
      logger.info(`🔗 Client ${socket.id} joined lineup_${numericLineupId}`, {
        userId: socketUser.id,
      });
    } catch (error: any) {
      logger.error(`❌ Failed to authorize lineup room join`, {
        socketId: socket.id,
        userId: socketUser.id,
        requestedLineupId: numericLineupId,
        error: error.message,
      });
      return socket.emit("error", "Unauthorized");
    }
  });

  // הצטרפות לעדכוני שירים - with permission check
  socket.on("join-songs", (userId: number) => {
    // Security: Only allow users to join their own songs room
    if (strictRoomSecurity) {
      if (!authenticatedUser?.id) {
        logger.warn(`🚫 Unauthorized attempt to join songs room (no auth)`, {
          socketId: socket.id,
          requestedUserId: userId,
        });
        socket.emit("error", { message: websocketUnauthorized });
        return;
      }

      if (
        authenticatedUser.role !== "admin" &&
        authenticatedUser.id !== userId
      ) {
        logger.warn(`🚫 Unauthorized attempt to join songs room`, {
          socketId: socket.id,
          requestedUserId: userId,
          actualUserId: authenticatedUser.id,
        });
        socket.emit("error", { message: websocketUnauthorized });
        return;
      }
    }

    socket.join(`songs_${userId}`);
    logger.info(`🔗 Client ${socket.id} joined songs_${userId}`);
  });

  // הצטרפות לעדכוני ליינאפים - with permission check
  socket.on("join-lineups", (userId: number) => {
    // Security: Only allow users to join their own lineups room
    if (strictRoomSecurity) {
      if (!authenticatedUser?.id) {
        logger.warn(`🚫 Unauthorized attempt to join lineups room (no auth)`, {
          socketId: socket.id,
          requestedUserId: userId,
        });
        socket.emit("error", { message: websocketUnauthorized });
        return;
      }

      if (
        authenticatedUser.role !== "admin" &&
        authenticatedUser.id !== userId
      ) {
        logger.warn(`🚫 Unauthorized attempt to join lineups room`, {
          socketId: socket.id,
          requestedUserId: userId,
          actualUserId: authenticatedUser.id,
        });
        socket.emit("error", { message: websocketUnauthorized });
        return;
      }
    }

    socket.join(`lineups_${userId}`);
    logger.info(`🔗 Client ${socket.id} joined lineups_${userId}`);
  });

  // הצטרפות לעדכוני משתמשים - with permission check
  socket.on("join-user-updates", (userId: number) => {
    // Security: Only allow users to join their own updates room
    if (strictRoomSecurity) {
      if (!authenticatedUser?.id) {
        logger.warn(
          `🚫 Unauthorized attempt to join user-updates room (no auth)`,
          {
            socketId: socket.id,
            requestedUserId: userId,
          },
        );
        socket.emit("error", { message: websocketUnauthorized });
        return;
      }

      if (
        authenticatedUser.role !== "admin" &&
        authenticatedUser.id !== userId
      ) {
        logger.warn(`🚫 Unauthorized attempt to join user-updates room`, {
          socketId: socket.id,
          requestedUserId: userId,
          actualUserId: authenticatedUser.id,
        });
        socket.emit("error", { message: websocketUnauthorized });
        return;
      }
    }

    socket.join(`user-updates_${userId}`);
    logger.info(`🔗 Client ${socket.id} joined user-updates_${userId}`);
  });

  // עדכון ליינאפ ושליחת שידור (legacy - נשאר לתאימות)
  socket.on("lineup-updated", async (lineupId) => {
    const socketUser = socket.data.user;
    const numericLineupId = Number(lineupId);

    if (
      !socketUser?.id ||
      !Number.isInteger(numericLineupId) ||
      numericLineupId <= 0
    ) {
      return socket.emit("error", "Unauthorized");
    }

    try {
      const authorized = await canAccessLineupRoom(
        socketUser.id,
        numericLineupId,
        socketUser.role,
      );

      if (!authorized) {
        logger.warn("🚫 Unauthorized attempt to broadcast lineup update", {
          socketId: socket.id,
          lineupId: numericLineupId,
          userId: socketUser.id,
        });
        return socket.emit("error", "Unauthorized");
      }

      logger.info("📣 Broadcasting update", {
        lineupId: numericLineupId,
        userId: socketUser.id,
      });
      io.to(`lineup_${numericLineupId}`).emit("lineup-updated");
    } catch (error: any) {
      logger.error("❌ Failed to authorize lineup broadcast", {
        socketId: socket.id,
        lineupId: numericLineupId,
        userId: socketUser?.id,
        error: error.message,
      });
      return socket.emit("error", "Unauthorized");
    }
  });

  // התנתקות
  socket.on("disconnect", () => {
    untrackSocket(socket.id);
    logger.info(`🔴 Client disconnected: ${socket.id}`, {
      userId: authenticatedUser?.id,
    });
  });
});

// -------------------------
//   START SERVER
// -------------------------
server.listen(env.port, env.host, () => {
  logger.info(
    `🔥 Server running with Socket.IO at http://${env.host}:${env.port}`,
  );
});
