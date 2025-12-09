import { Server } from "socket.io";
import { isGuest } from "../modules/users/users.repository.js";

/**
 * שליחת event למשתמש ספציפי
 */
export async function emitToUser(
  io: Server,
  userId: number,
  event: string,
  data: any
) {
  if (!io) return;
  
  // שליחה ל-room של המשתמש
  io.to(`user_${userId}`).emit(event, data);
}

/**
 * שליחת event למארח ולכל האמנים שלו
 */
export async function emitToHost(
  io: Server,
  hostId: number,
  event: string,
  data: any
) {
  if (!io) return;
  
  // שליחה למארח
  io.to(`user_${hostId}`).emit(event, data);
  
  // שליחה לכל האמנים שהוזמנו על ידי המארח
  io.to(`host_${hostId}`).emit(event, data);
}

/**
 * שליחת event לאורח ולמארח שלו
 */
export async function emitToGuest(
  io: Server,
  guestId: number,
  hostId: number,
  event: string,
  data: any
) {
  if (!io) return;
  
  // שליחה לאורח
  io.to(`user_${guestId}`).emit(event, data);
  
  // שליחה למארח
  io.to(`user_${hostId}`).emit(event, data);
}

/**
 * שליחת event למשתמש ולמארח שלו (אם יש)
 */
export async function emitToUserAndHost(
  io: Server,
  userId: number,
  event: string,
  data: any
) {
  if (!io) return;
  
  // שליחה למשתמש
  io.to(`user_${userId}`).emit(event, data);
  
  // בדיקה אם המשתמש הוא אורח - מחזיר רשימת מארחים
  const hostIds = await isGuest(userId);
  const hostIdsArray: number[] = Array.isArray(hostIds) ? hostIds : (hostIds ? [hostIds] : []);
  
  // שליחה לכל המארחים שלו
  for (const hostId of hostIdsArray) {
    io.to(`user_${hostId}`).emit(event, data);
  }
  
  // שליחה לכל האמנים שהוזמנו על ידי המשתמש (אם הוא מארח)
  io.to(`host_${userId}`).emit(event, data);
}

/**
 * שליחת event לכל המשתמשים שמאזינים לעדכונים
 */
export async function emitToUserUpdates(
  io: Server,
  userId: number,
  event: string,
  data: any
) {
  if (!io) return;
  
  // שליחה ל-room של עדכוני משתמש
  io.to(`user_updates_${userId}`).emit(event, data);
  
  // בדיקה אם המשתמש הוא אורח
  const hostId = await isGuest(userId);
  if (hostId) {
    // שליחה גם למארח
    io.to(`user_updates_${hostId}`).emit(event, data);
  }
  
  // שליחה לכל האמנים שהוזמנו על ידי המשתמש (אם הוא מארח)
  io.to(`host_${userId}`).emit(event, data);
}

