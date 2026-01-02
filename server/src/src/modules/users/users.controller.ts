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
import { resolveSubscriptionStatus } from "../subscriptions/resolveSubscriptionStatus.js";

/* -------------------------------------------------------
   ⭐ פונקציה אחידה לתיקון URL של תמונה — פתרון לבעיה שלך
-------------------------------------------------------- */
function fixAvatar(req, avatar) {
  if (!avatar) return null;

  const protocol = req.protocol;
  const host = req.get("host");
  const baseUrl = `${protocol}://${host.replace(/:\d+$/, "")}:5000`;

  const clean = avatar.replace(/^\/?uploads\//, "");
  return `${baseUrl}/uploads/${clean}`;
}

export const usersController = {
  // ⭐ מאגר אמנים — מי הזמין אותי
  myCollection: asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const creators = await getMyCollection(userId); // ← זה מחזיר ARRAY

    const fixed = creators.map((c) => ({
      ...c,
      avatar: c.avatar ? fixAvatar(req, c.avatar) : null,
    }));

    res.json(fixed);
  }),

  // ⭐ מחוברים אליי — מי אני הזמנתי
  connectedToMe: asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const users = await getMyConnections(userId);

    const usersWithAvatars = users.map((u) => ({
      ...u,
      avatar: u.avatar ? fixAvatar(req, u.avatar) : null,
    }));

    res.json(usersWithAvatars);
  }),

  // ⭐ פרופיל משתמש
  me: asyncHandler(async (req, res) => {
    const user = await getProfile(req.user.id);

    if (user) {
      // Ensure subscription status is correct on initial app load.
      user.subscription_status = resolveSubscriptionStatus(user);
    }

    if (user?.avatar) {
      user.avatar = fixAvatar(req, user.avatar);
    }

    res.json(user);
  }),

  // ⭐ קבלת הזמנות ממתינות (היה שבור! תוקן)
  pendingInvitation: asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const pending = await getPendingInvitations(userId);

    const fixed = pending.map((p) => ({
      ...p,
      avatar: p.avatar ? fixAvatar(req, p.avatar) : null,
    }));

    res.json(fixed);
  }),

  // ⭐ רשימת משתמשים — הוספתי תמונות
  list: asyncHandler(async (req, res) => {
    const users = await getUsers(req.user);

    const fixed = users.map((u) => ({
      ...u,
      avatar: u.avatar ? fixAvatar(req, u.avatar) : null,
    }));

    res.json(fixed);
  }),

  // ⭐ שאר הפונקציות — ללא שינוי (לא קשור לתמונות)
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

  updatePassword: asyncHandler(async (req, res) => {
    await changePassword(req.user.id, req.body.newPass);
    res.json({ message: "הסיסמה עודכנה בהצלחה ✅" });
  }),

  create: asyncHandler(async (req, res) => {
    await createUserAccount(req.user, req.body);
    res.status(201).json({ message: "המשתמש נוצר בהצלחה" });
  }),

  update: asyncHandler(async (req, res) => {
    await updateUserAccount(req.user, req.params.id, req.body);
    res.json({ message: "המשתמש עודכן בהצלחה" });
  }),

  remove: asyncHandler(async (req, res) => {
    await removeUserAccount(req.params.id);
    res.json({ message: "המשתמש נמחק בהצלחה" });
  }),

  impersonate: asyncHandler(async (req, res) => {
    const payload = await impersonateUser(req.params.id);
    res.json({
      message: "Impersonation success",
      ...payload,
    });
  }),

  inviteArtist: asyncHandler(async (req, res) => {
    const hostId = req.user.id;
    const artistId = req.body.artist_id;

    if (!artistId) {
      return res.status(400).json({ message: "נא להזין ID של אמן" });
    }

    const result = await inviteArtistToMyCollection(hostId, artistId);

    if (global.io) {
      const { emitToHost, emitToUser } = await import("../../core/socket.js");
      await emitToHost(global.io, hostId, "user:invited", { artistId, hostId });
      await emitToUser(global.io, artistId, "invitation:pending", {
        hostId,
        artistId,
      });
    }

    res.json(result);
  }),

  uninviteArtist: asyncHandler(async (req, res) => {
    const hostId = req.user.id;
    const artistId = req.body.artist_id;

    if (!artistId) {
      return res.status(400).json({ message: "נא להזין ID של אמן" });
    }

    const result = await uninviteArtistFromMyCollection(hostId, artistId);

    if (global.io) {
      const { emitToHost } = await import("../../core/socket.js");
      await emitToHost(global.io, hostId, "user:uninvited", {
        artistId,
        hostId,
      });
    }

    res.json(result);
  }),

  leaveCollection: asyncHandler(async (req, res) => {
    const artistId = req.user.id;
    const hostId = req.body.hostId ? parseInt(req.body.hostId) : null;

    const result = await leaveMyCollection(artistId, hostId);

    if (global.io) {
      const { emitToUserAndHost } = await import("../../core/socket.js");
      await emitToUserAndHost(global.io, artistId, "user:left-collection", {
        artistId,
        hostId,
      });
    }

    res.json(result);
  }),

  acceptInvitationStatus: asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const hostId = parseInt(req.body.hostId);

    if (!hostId || isNaN(hostId)) {
      return res.status(400).json({ message: "נא לספק hostId תקין" });
    }

    const { acceptInvitationStatus: acceptInvitationStatusService } =
      await import("./users.service.js");

    const result = await acceptInvitationStatusService(userId, hostId);

    if (global.io) {
      const { emitToUserAndHost } = await import("../../core/socket.js");
      await emitToUserAndHost(global.io, userId, "user:invitation-accepted", {
        userId,
        hostId,
      });
    }

    res.json(result);
  }),

  rejectInvitationStatus: asyncHandler(async (req, res) => {
    const avatar = req.file
      ? `/uploads/users/${req.user.id}/${req.file.filename}`
      : null;

    const userId = req.user.id;
    const hostId = parseInt(req.body.hostId);

    if (!hostId || isNaN(hostId)) {
      return res.status(400).json({ message: "נא לספק hostId תקין" });
    }

    const { rejectInvitationStatus: rejectInvitationStatusService } =
      await import("./users.service.js");

    const result = await rejectInvitationStatusService(userId, hostId);

    if (global.io) {
      const { emitToUserAndHost } = await import("../../core/socket.js");
      await emitToUserAndHost(global.io, userId, "user:invitation-rejected", {
        userId,
        hostId,
      });
    }

    res.json(result);
  }),

  checkGuest: asyncHandler(async (req, res) => {
    const { checkIfGuest, checkIfHost } = await import("./users.service.js");
    const hostIds = await checkIfGuest(req.user.id);
    const isHost = await checkIfHost(req.user.id);

    const hostIdsArray = Array.isArray(hostIds)
      ? hostIds
      : hostIds
      ? [hostIds]
      : [];

    const hostId = hostIdsArray.length > 0 ? hostIdsArray[0] : null;

    res.json({
      isGuest: hostIdsArray.length > 0,
      hostId,
      hostIds: hostIdsArray,
      isHost,
    });
  }),

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

  acceptInvitation: asyncHandler(async (req, res) => {
    const token = req.params.token;
    const result = await acceptInvitation(token);
    res.json(result);
  }),
};
