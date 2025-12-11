import { asyncHandler } from "../../core/asyncHandler.js";
import {
  createLineup,
  createShareLink,
  disableShareLink,
  getLineupById,
  getLineups,
  getLineupsByUserId,
  getPublicLineup,
  getShareStatus,
  updateLineup,
  deleteLineup,
} from "./lineups.service.js";
import { emitToUserAndHost, emitToUserUpdates } from "../../core/socket.js";

export const lineupsController = {
  public: asyncHandler(async (req, res) => {
    const payload = await getPublicLineup(req.params.token);
    res.json({
      ...payload.lineup,
      songs: payload.songs,
    });
  }),

  list: asyncHandler(async (req, res) => {
    const lineups = await getLineups(req.user);

    // הוספת סימון ownership לכל ליינאפ
    const lineupsWithMetadata = lineups.map((lineup) => {
      lineup.is_owner = lineup.created_by === req.user.id;
      return lineup;
    });

    res.json(lineupsWithMetadata);
  }),

  // endpoint לקבלת ליינאפים של משתמש ספציפי (לשימוש ב-ArtistProfile)
  listByUserId: asyncHandler(async (req, res) => {
    const targetUserId = parseInt(req.params.userId);
    if (isNaN(targetUserId)) {
      return res.status(400).json({ message: "ID משתמש לא תקין" });
    }

    // בדיקה שהמשתמש הנוכחי הוא אורח והמשתמש המבוקש הוא אחד מהמארחים שלו
    const { checkIfGuest } = await import("../users/users.service.js");
    const hostIds = await checkIfGuest(req.user.id);
    const hostIdsArray: number[] = Array.isArray(hostIds)
      ? hostIds
      : hostIds
      ? [hostIds]
      : [];

    if (hostIdsArray.length === 0 || !hostIdsArray.includes(targetUserId)) {
      return res
        .status(403)
        .json({ message: "אין לך גישה לליינאפים של משתמש זה" });
    }

    const lineups = await getLineupsByUserId(targetUserId);
    res.json(lineups);
  }),

  get: asyncHandler(async (req, res) => {
    const lineupId = parseInt(req.params.id);
    if (isNaN(lineupId)) {
      return res.status(400).json({ message: "ID ליינאפ לא תקין" });
    }

    const lineup = await getLineupById(lineupId, req.user);

    // הוספת סימון ownership
    lineup.is_owner = lineup.created_by === req.user.id;

    res.json(lineup);
  }),

  remove: asyncHandler(async (req, res) => {
    await deleteLineup(req.user.id, req.params.id);
    res.json({ message: "נמחק בהצלחה" });
  }),

  create: asyncHandler(async (req, res) => {
    const lineup = await createLineup(req.user, req.body);

    // הוספת סימון ownership
    lineup.is_owner = lineup.created_by === req.user.id;

    // שליחת עדכון בזמן אמת עם הנתונים המלאים
    if (global.io) {
      await emitToUserAndHost(global.io, req.user.id, "lineup:created", {
        lineup,
        lineupId: lineup.id,
        userId: req.user.id,
      });

      // גם ל-user_updates כדי לרענן דפים אחרים
      await emitToUserUpdates(global.io, req.user.id, "lineup:created", {
        lineup,
        lineupId: lineup.id,
        userId: req.user.id,
      });
    }

    res.status(201).json(lineup);
  }),

  update: asyncHandler(async (req, res) => {
    const lineupId = parseInt(req.params.id);
    const lineup = await updateLineup(req.user, lineupId, req.body);

    // הוספת סימון ownership
    lineup.is_owner = lineup.created_by === req.user.id;

    // שליחת עדכון בזמן אמת עם הנתונים המלאים
    if (global.io) {
      // שליחה למשתמש שביצע את הפעולה ולמארח שלו (אם הוא אורח)
      await emitToUserAndHost(global.io, req.user.id, "lineup:updated", {
        lineup,
        lineupId,
        userId: req.user.id,
      });

      // שליחה גם למארח שיצר את הליינאפ (אם הוא שונה מהמשתמש שביצע את הפעולה)
      // זה מבטיח שגם אם מארח משנה משהו, האורחים שלו מקבלים את זה
      if (lineup.created_by !== req.user.id) {
        await emitToUserAndHost(
          global.io,
          lineup.created_by,
          "lineup:updated",
          { lineup, lineupId, userId: req.user.id }
        );
      }

      // גם לחדר של הליינאפ הספציפי
      global.io
        .to(`lineup_${lineupId}`)
        .emit("lineup:updated", { lineup, lineupId });
    }

    res.json(lineup);
  }),

  // ⭐ מתוקן — העברת req כדי לייצר URL דינמי
  shareStatus: asyncHandler(async (req, res) => {
    const status = await getShareStatus(req, req.params.id);
    res.json(status);
  }),

  // ⭐ מתוקן — העברת req כדי לייצר URL דינמי
  generateShare: asyncHandler(async (req, res) => {
    const payload = await createShareLink(req, req.params.id);
    res.json(payload);
  }),

  disableShare: asyncHandler(async (req, res) => {
    await disableShareLink(req.params.id);
    res.json({ message: "קישור השיתוף בוטל" });
  }),
};
