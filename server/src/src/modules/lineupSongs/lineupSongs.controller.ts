import { asyncHandler } from "../../core/asyncHandler";
import {
  addSongToLineup,
  getLineupSongs,
  removeSong,
  reorderLineupSongs,
  uploadChartPdfForSong,
  removeChartPdfForSong,
} from "./lineupSongs.service";
import { tRequest } from "../../i18n/serverI18n";

export const lineupSongsController = {
  list: asyncHandler(async (req, res) => {
    const songs = await getLineupSongs(req.params.lineupId, req.user);

    // בדיקה אם הליינאפ שייך למשתמש או למארח שלו (אם הוא אורח)
    const { lineupBelongsToUser } =
      await import("../lineups/lineups.repository");
    const { checkIfGuest } = await import("../users/users.service");
    const lineupId = parseInt(req.params.lineupId);

    let isLineupOwner =
      req.user.role === "admin" ||
      (await lineupBelongsToUser(lineupId, req.user.id));

    // אם לא, בדיקה אם המשתמש הוא אורח והליינאפ שייך לאחד מהמארחים שלו
    if (!isLineupOwner) {
      const hostIds = await checkIfGuest(req.user.id);
      const hostIdsArray: number[] = Array.isArray(hostIds)
        ? hostIds
        : hostIds
          ? [hostIds]
          : [];
      for (const hostId of hostIdsArray) {
        if (await lineupBelongsToUser(lineupId, hostId)) {
          isLineupOwner = true;
          break;
        }
      }
    }

    // בדיקה אם המשתמש הוא הבעלים (לא אורח)
    const isActualOwner =
      req.user.role === "admin" ||
      (await lineupBelongsToUser(lineupId, req.user.id));

    // הוספת URL מלא לקבצי PDF וסימון ownership
    const songsWithMetadata = songs.map((song) => {
      if (song.chart_pdf) {
        const protocol = req.protocol;
        const host = req.get("host") ?? "localhost";
        const baseUrl = `${protocol}://${host.replace(/:\d+$/, "")}:5000`;
        const cleanPdf = song.chart_pdf.replace(/^\/uploads\//, "");
        song.chart_pdf_url = `${baseUrl}/uploads/${cleanPdf}`;
      }

      // המשתמש יכול לערוך רק אם הוא הבעלים של הליינאפ (לא אורח)
      song.can_edit = isActualOwner;

      return song;
    });

    res.json(songsWithMetadata);
  }),
  create: asyncHandler(async (req, res) => {
    await addSongToLineup(req.params.lineupId, req.user, req.body.song_id);
    res.status(201).json({ message: tRequest(req, "lineupSongs.created") });
  }),
  reorder: asyncHandler(async (req, res) => {
    await reorderLineupSongs(req.params.lineupId, req.user, req.body.songs);
    res.json({ message: tRequest(req, "lineupSongs.reordered") });
  }),
  remove: asyncHandler(async (req, res) => {
    const lineupId = parseInt(req.params.lineupId);
    const songId = parseInt(req.params.songId);

    if (isNaN(lineupId) || isNaN(songId)) {
      return res
        .status(400)
        .json({ message: tRequest(req, "lineupSongs.invalidIds") });
    }

    await removeSong(lineupId, req.user, songId);
    res.json({ message: tRequest(req, "lineupSongs.removed") });
  }),
  uploadChart: asyncHandler(async (req, res) => {
    if (!req.file) {
      return res
        .status(400)
        .json({ message: tRequest(req, "lineupSongs.fileNotUploaded") });
    }

    const lineupSongId = parseInt(req.params.lineupSongId);
    if (isNaN(lineupSongId)) {
      return res
        .status(400)
        .json({ message: tRequest(req, "lineupSongs.invalidSongId") });
    }

    const filePath = `/uploads/charts/${req.user.id}/${req.file.filename}`;
    const updatedLineupSong = await uploadChartPdfForSong(
      lineupSongId,
      req.user,
      filePath,
    );

    const protocol = req.protocol;
    const host = req.get("host") ?? "localhost";
    const baseUrl = `${protocol}://${host.replace(/:\d+$/, "")}:5000`;
    const pdfUrl = `${baseUrl}${filePath}`;

    res.json({
      message: tRequest(req, "lineupSongs.chartUploaded"),
      chart_pdf_url: pdfUrl,
      lineupSong: updatedLineupSong,
    });
  }),
  deleteChart: asyncHandler(async (req, res) => {
    try {
      const lineupSongId = parseInt(req.params.lineupSongId);
      if (isNaN(lineupSongId)) {
        return res
          .status(400)
          .json({ message: tRequest(req, "lineupSongs.invalidSongId") });
      }

      await removeChartPdfForSong(lineupSongId, req.user);

      res.json({
        message: tRequest(req, "lineupSongs.chartDeleted"),
      });
    } catch (error: any) {
      console.error("❌ שגיאה במחיקת PDF:", error);
      throw error;
    }
  }),
};
