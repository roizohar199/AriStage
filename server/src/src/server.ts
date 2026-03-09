import http from "http";
import { Server } from "socket.io";
import { createApp } from "./app";
import { env } from "./config/env";
import { socketCorsOptions } from "./config/cors";
import { logger } from "./core/logger";
import { verifyToken } from "./modules/auth/token.service";
import { createWebSocketRateLimiter } from "./middleware/rateLimiter";

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
      return next(new Error("Authentication required"));
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
      return next(new Error("Invalid token"));
    }

    // Rate limit check
    const clientIp = socket.handshake.address;
    if (!wsRateLimiter(clientIp)) {
      logger.warn(`🔴 WebSocket connection rejected: Rate limit exceeded`, {
        socketId: socket.id,
        userId: decoded.id,
        address: clientIp,
      });
      return next(new Error("Rate limit exceeded"));
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
      email: decoded.email,
    });

    next();
  } catch (error: any) {
    logger.error(`❌ WebSocket authentication error`, {
      socketId: socket.id,
      error: error.message,
    });
    next(new Error("Authentication failed"));
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

// -------------------------
//   SOCKET EVENTS
// -------------------------
io.on("connection", (socket) => {
  const authenticatedUser = socket.data.user;
  const strictRoomSecurity =
    env.nodeEnv !== "development" || process.env.WS_STRICT_ROOMS === "1";
  logger.info(`🟢 Client connected: ${socket.id}`, {
    userId: authenticatedUser?.id,
    email: authenticatedUser?.email,
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
        socket.emit("error", { message: "Unauthorized" });
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
        socket.emit("error", { message: "Unauthorized" });
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
  socket.on("join-host", (hostId: number) => {
    // TODO: Add database check to verify user has access to this host
    // For now, allow if user is the host or admin
    if (strictRoomSecurity) {
      if (!authenticatedUser?.id) {
        logger.warn(`🚫 Unauthorized attempt to join host room (no auth)`, {
          socketId: socket.id,
          requestedHostId: hostId,
        });
        socket.emit("error", { message: "Unauthorized" });
        return;
      }

      if (
        authenticatedUser.role !== "admin" &&
        authenticatedUser.id !== hostId
      ) {
        logger.warn(`🚫 Unauthorized attempt to join host room`, {
          socketId: socket.id,
          requestedHostId: hostId,
          actualUserId: authenticatedUser.id,
        });
        socket.emit("error", { message: "Unauthorized" });
        return;
      }
    }

    socket.join(`host_${hostId}`);
    logger.info(`🔗 Client ${socket.id} joined host_${hostId}`);
  });

  // הצטרפות לחדר של ליינאפ ספציפי - with permission check
  socket.on("join-lineup", (lineupId) => {
    // TODO: Add database check to verify user owns or has access to this lineup
    // For now, allow authenticated users (will be improved in Phase 2)
    socket.join(`lineup_${lineupId}`);
    logger.info(`🔗 Client ${socket.id} joined lineup_${lineupId}`);
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
        socket.emit("error", { message: "Unauthorized" });
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
        socket.emit("error", { message: "Unauthorized" });
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
        socket.emit("error", { message: "Unauthorized" });
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
        socket.emit("error", { message: "Unauthorized" });
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
        socket.emit("error", { message: "Unauthorized" });
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
        socket.emit("error", { message: "Unauthorized" });
        return;
      }
    }

    socket.join(`user-updates_${userId}`);
    logger.info(`🔗 Client ${socket.id} joined user-updates_${userId}`);
  });

  // עדכון ליינאפ ושליחת שידור (legacy - נשאר לתאימות)
  socket.on("lineup-updated", (lineupId) => {
    // TODO: Verify user owns this lineup before allowing broadcast
    logger.info("📣 Broadcasting update", {
      lineupId,
      userId: authenticatedUser.id,
    });
    io.to(`lineup_${lineupId}`).emit("lineup-updated");
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
