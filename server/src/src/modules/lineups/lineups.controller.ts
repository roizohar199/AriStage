import { asyncHandler } from "../../core/asyncHandler.js";
import {
  createLineup,
  createShareLink,
  disableShareLink,
  getLineups,
  getPublicLineup,
  getShareStatus,
  updateLineup,
} from "./lineups.service.js";
import { emitToUserAndHost } from "../../core/socket.js";

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

  create: asyncHandler(async (req, res) => {
    const lineup = await createLineup(req.user, req.body);
    
    // שליחת עדכון בזמן אמת
    if (global.io) {
      await emitToUserAndHost(
        global.io,
        req.user.id,
        "lineup:created",
        { lineupId: lineup.id, userId: req.user.id }
      );
    }
    
    res.status(201).json(lineup);
  }),

  update: asyncHandler(async (req, res) => {
    const lineupId = parseInt(req.params.id);
    const lineup = await updateLineup(req.user, lineupId, req.body);
    
    // שליחת עדכון בזמן אמת
    if (global.io) {
      await emitToUserAndHost(
        global.io,
        req.user.id,
        "lineup:updated",
        { lineupId, userId: req.user.id }
      );
      
      // גם לחדר של הליינאפ הספציפי
      global.io.to(`lineup_${lineupId}`).emit("lineup:updated", { lineupId });
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
