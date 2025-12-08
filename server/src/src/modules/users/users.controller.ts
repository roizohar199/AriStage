import { asyncHandler } from "../../core/asyncHandler.js";
import { env } from "../../config/env.js";
import {
  changePassword,
  createUserAccount,
  getProfile,
  getUsers,
  impersonateUser,
  removeUserAccount,
  updateProfile,
  updateUserAccount,
  getMyCollection,
  getMyConnections,
  inviteArtistToMyCollection,
  uninviteArtistFromMyCollection,
  leaveMyCollection,
  getPendingInvitations,
  acceptInvitationStatus,
  rejectInvitationStatus,
  checkIfGuest,
  sendArtistInvitation,
  acceptInvitation,
} from "./users.service.js";

export const usersController = {
  // ⭐ מאגר אמנים — מי הזמין אותי
  myCollection: asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const creator = await getMyCollection(userId);
    
    if (creator?.avatar) {
      const protocol = req.protocol;
      const host = req.get("host");
      const baseUrl = `${protocol}://${host.replace(/:\d+$/, "")}:5000`;
      const cleanAvatar = creator.avatar.replace(/^\/uploads\//, "");
      creator.avatar = `${baseUrl}/uploads/${cleanAvatar}`;
    }
    
    res.json(creator || null);
  }),

  // ⭐ מחוברים אליי — מי אני הזמנתי
  connectedToMe: asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const users = await getMyConnections(userId);
    
    const protocol = req.protocol;
    const host = req.get("host");
    const baseUrl = `${protocol}://${host.replace(/:\d+$/, "")}:5000`;
    
    const usersWithAvatars = users.map((user) => {
      if (user.avatar) {
        const cleanAvatar = user.avatar.replace(/^\/uploads\//, "");
        return { ...user, avatar: `${baseUrl}/uploads/${cleanAvatar}` };
      }
      return user;
    });
    
    res.json(usersWithAvatars);
  }),

  // ⭐ פרופיל משתמש
  me: asyncHandler(async (req, res) => {
    const user = await getProfile(req.user.id);

    if (user?.avatar) {
      const protocol = req.protocol;
      const host = req.get("host");

      const baseUrl = `${protocol}://${host.replace(/:\d+$/, "")}:5000`;

      const cleanAvatar = user.avatar.replace(/^\/uploads\//, "");
      user.avatar = `${baseUrl}/uploads/${cleanAvatar}`;
    }

    res.json(user);
  }),

  // ⭐ עדכון הגדרות
  updateSettings: asyncHandler(async (req, res) => {
    const avatar = req.file
      ? `/uploads/users/${req.user.id}/${req.file.filename}`
      : null;

    const updatedUser = await updateProfile(req.user.id, {
      ...req.body,
      artist_role: req.body.artist_role || null,
      avatar,
    });

    res.json(updatedUser);
  }),

  // ⭐ עדכון סיסמה
  updatePassword: asyncHandler(async (req, res) => {
    await changePassword(req.user.id, req.body.newPass);
    res.json({ message: "הסיסמה עודכנה בהצלחה ✅" });
  }),

  // ⭐ רשימת משתמשים
  list: asyncHandler(async (req, res) => {
    const users = await getUsers(req.user);
    res.json(users);
  }),

  // ⭐ יצירת משתמש חדש
  create: asyncHandler(async (req, res) => {
    await createUserAccount(req.user, req.body);
    res.status(201).json({ message: "המשתמש נוצר בהצלחה" });
  }),

  // ⭐ עדכון משתמש
  update: asyncHandler(async (req, res) => {
    await updateUserAccount(req.user, req.params.id, req.body);
    res.json({ message: "המשתמש עודכן בהצלחה" });
  }),

  // ⭐ מחיקה
  remove: asyncHandler(async (req, res) => {
    await removeUserAccount(req.params.id);
    res.json({ message: "המשתמש נמחק בהצלחה" });
  }),

  // ⭐ התחזות
  impersonate: asyncHandler(async (req, res) => {
    const payload = await impersonateUser(req.params.id);
    res.json({
      message: "Impersonation success",
      ...payload,
    });
  }),

  // ⭐ הזמנת אמן למאגר שלי
  inviteArtist: asyncHandler(async (req, res) => {
    const hostId = req.user.id;
    const artistId = req.body.artist_id;
    
    if (!artistId) {
      return res.status(400).json({ message: "נא להזין ID של אמן" });
    }

    const result = await inviteArtistToMyCollection(hostId, artistId);
    
    // שליחת עדכון בזמן אמת
    if (global.io) {
      const { emitToHost } = await import("../../core/socket.js");
      await emitToHost(
        global.io,
        hostId,
        "user:invited",
        { artistId, hostId }
      );
    }
    
    res.json(result);
  }),

  // ⭐ ביטול הזמנת אמן מהמאגר שלי
  uninviteArtist: asyncHandler(async (req, res) => {
    const hostId = req.user.id;
    const artistId = req.body.artist_id;
    
    if (!artistId) {
      return res.status(400).json({ message: "נא להזין ID של אמן" });
    }

    const result = await uninviteArtistFromMyCollection(hostId, artistId);
    
    // שליחת עדכון בזמן אמת
    if (global.io) {
      const { emitToHost } = await import("../../core/socket.js");
      await emitToHost(
        global.io,
        hostId,
        "user:uninvited",
        { artistId, hostId }
      );
    }
    
    res.json(result);
  }),

  // ⭐ אורח מבטל את השתתפותו במאגר (כל המארחים או מארח ספציפי)
  leaveCollection: asyncHandler(async (req, res) => {
    const artistId = req.user.id;
    const hostId = req.body.hostId ? parseInt(req.body.hostId) : null;
    
    const result = await leaveMyCollection(artistId, hostId);
    
    // שליחת עדכון בזמן אמת
    if (global.io) {
      const { emitToUserAndHost } = await import("../../core/socket.js");
      await emitToUserAndHost(
        global.io,
        artistId,
        "user:left-collection",
        { artistId, hostId }
      );
    }
    
    res.json(result);
  }),

  // ⭐ קבלת הזמנות ממתינות לאישור
  pendingInvitation: asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { getPendingInvitations } = await import("./users.service.js");
    const pending = await getPendingInvitations(userId);
    res.json(pending);
  }),

  // ⭐ אישור הזמנה
  acceptInvitationStatus: asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const hostId = parseInt(req.body.hostId);
    if (!hostId || isNaN(hostId)) {
      return res.status(400).json({ message: "נא לספק hostId תקין" });
    }
    const { acceptInvitationStatus: acceptInvitationStatusService } = await import("./users.service.js");
    const result = await acceptInvitationStatusService(userId, hostId);
    
    // שליחת עדכון בזמן אמת
    if (global.io) {
      const { emitToUserAndHost } = await import("../../core/socket.js");
      await emitToUserAndHost(
        global.io,
        userId,
        "user:invitation-accepted",
        { userId, hostId }
      );
    }
    
    res.json(result);
  }),

  // ⭐ דחיית הזמנה
  rejectInvitationStatus: asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const hostId = parseInt(req.body.hostId);
    if (!hostId || isNaN(hostId)) {
      return res.status(400).json({ message: "נא לספק hostId תקין" });
    }
    const { rejectInvitationStatus: rejectInvitationStatusService } = await import("./users.service.js");
    const result = await rejectInvitationStatusService(userId, hostId);
    
    // שליחת עדכון בזמן אמת
    if (global.io) {
      const { emitToUserAndHost } = await import("../../core/socket.js");
      await emitToUserAndHost(
        global.io,
        userId,
        "user:invitation-rejected",
        { userId, hostId }
      );
    }
    
    res.json(result);
  }),

  // ⭐ בדיקה אם משתמש הוא אורח או מארח
  checkGuest: asyncHandler(async (req, res) => {
    const { checkIfGuest, checkIfHost } = await import("./users.service.js");
    const hostIds = await checkIfGuest(req.user.id);
    const isHost = await checkIfHost(req.user.id);
    // מחזיר את המארח הראשון לתאימות לאחור, או null אם אין מארחים
    const hostIdsArray: number[] = Array.isArray(hostIds) ? hostIds : (hostIds ? [hostIds] : []);
    const hostId = hostIdsArray.length > 0 ? hostIdsArray[0] : null;
    res.json({ isGuest: hostIdsArray.length > 0, hostId, hostIds: hostIdsArray, isHost });
  }),

  // ⭐ שליחת הזמנה במייל
  sendInvitation: asyncHandler(async (req, res) => {
    const hostId = req.user.id;
    const hostName = req.user.full_name || "אמן";
    const email = req.body.email;
    
    if (!email) {
      return res.status(400).json({ message: "נא להזין כתובת אימייל" });
    }

    const result = await sendArtistInvitation(hostId, hostName, email);
    res.json(result);
  }),

  // ⭐ קבלת הזמנה
  acceptInvitation: asyncHandler(async (req, res) => {
    const token = req.params.token;
    const result = await acceptInvitation(token);
    res.json(result);
  }),
};
