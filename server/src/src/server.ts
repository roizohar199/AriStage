import http from "http";
import { Server } from "socket.io";
import { createApp } from "./app";
import { env } from "./config/env";
import { socketCorsOptions } from "./config/cors";
import { logger } from "./core/logger";

declare global {
  // מאפשר שימוש ב־global.io בקבצים אחרים
  var io: Server;
}

const app = createApp();
const server = http.createServer(app);

// יצירת socket.io
const io = new Server(server, {
  cors: socketCorsOptions,
});

// שיתוף ה־io לכל המערכת
global.io = io;

// -------------------------
//   SOCKET EVENTS
// -------------------------
io.on("connection", (socket) => {
  logger.info(`🟢 Client connected: ${socket.id}`);

  // הצטרפות לחדר של משתמש ספציפי
  socket.on("join-user", (userId: number) => {
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
