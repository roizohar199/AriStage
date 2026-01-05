import http from "http";
import { Server } from "socket.io";
import { createApp } from "./app";
import { env } from "./config/env";
import { socketCorsOptions } from "./config/cors";
import { logger } from "./core/logger";

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
  logger.info(`🟢 Client connected: ${socket.id}`);

  // הצטרפות לחדר של משתמש ספציפי
  socket.on("join-user", (userId: number) => {
    const numericUserId = Number(userId);
    if (Number.isFinite(numericUserId) && numericUserId > 0) {
      trackSocketUser(socket.id, numericUserId);
    }
    socket.join(`user_${userId}`);
    logger.info(`🔗 Client ${socket.id} joined user_${userId}`);
  });

  // הצטרפות לחדר של מארח (כולל אמנים שלו)
  socket.on("join-host", (hostId: number) => {
    socket.join(`host_${hostId}`);
    logger.info(`🔗 Client ${socket.id} joined host_${hostId}`);
  });

  // הצטרפות לחדר של ליינאפ ספציפי
  socket.on("join-lineup", (lineupId) => {
    socket.join(`lineup_${lineupId}`);
    logger.info(`🔗 Client ${socket.id} joined lineup_${lineupId}`);
  });

  // הצטרפות לעדכוני שירים
  socket.on("join-songs", (userId: number) => {
    socket.join(`songs_${userId}`);
    logger.info(`🔗 Client ${socket.id} joined songs_${userId}`);
  });

  // הצטרפות לעדכוני ליינאפים
  socket.on("join-lineups", (userId: number) => {
    socket.join(`lineups_${userId}`);
    logger.info(`🔗 Client ${socket.id} joined lineups_${userId}`);
  });

  // הצטרפות לעדכוני משתמשים
  socket.on("join-user-updates", (userId: number) => {
    socket.join(`user-updates_${userId}`);
    logger.info(`🔗 Client ${socket.id} joined user-updates_${userId}`);
  });

  // עדכון ליינאפ ושליחת שידור (legacy - נשאר לתאימות)
  socket.on("lineup-updated", (lineupId) => {
    logger.info("📣 Broadcasting update", { lineupId });
    io.to(`lineup_${lineupId}`).emit("lineup-updated");
  });

  // התנתקות
  socket.on("disconnect", () => {
    untrackSocket(socket.id);
    logger.info(`🔴 Client disconnected: ${socket.id}`);
  });
});

// -------------------------
//   START SERVER
// -------------------------
server.listen(env.port, env.host, () => {
  logger.info(
    `🔥 Server running with Socket.IO at http://${env.host}:${env.port}`
  );
});
