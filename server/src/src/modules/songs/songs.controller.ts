import { deleteSongChart } from "./songs.repository";
import { getPrivateChartsForSong } from "./songs.service";
import { uploadPrivateChartPdfForSong } from "./songs.service";
import { asyncHandler } from "../../core/asyncHandler";
import {
  createSong,
  getSongs,
  removeSong,
  updateSongDetails,
  uploadChartPdfForSong,
  removeChartPdfForSong,
  setLyricsForSong,
  removeLyricsForSong,
} from "./songs.service";
import { getSongById } from "./songs.repository";
import { emitToUserAndHost, emitToUserUpdates } from "../../core/socket";
import { tRequest } from "../../i18n/serverI18n";
import { env } from "../../config/env";

export const songsController = {
  deletePrivateChart: asyncHandler(async (req, res) => {
    const chartId = parseInt(req.params.chartId);
    const user = req.user;
    const deleted = await deleteSongChart(chartId, user.id);
    if (deleted) {
      res.json({ message: tRequest(req, "songs.privateChartDeleted") });
    } else {
      res.status(403).json({
        message: tRequest(req, "songs.privateChartNotFoundOrForbidden"),
      });
    }
  }),
  getPrivateCharts: asyncHandler(async (req, res) => {
    const songId = parseInt(req.params.id);
    const user = req.user;
    const charts = await getPrivateChartsForSong(songId, user);

    // הוספת URL מלא לכל צ'ארט
    const chartsWithUrl = charts.map((chart) => {
      // נקה את הנתיב - הסר נתיב מלא אם קיים ותשאיר רק את החלק היחסי
      let cleanPath = chart.file_path;

      // אם זה נתיב מלא (מכיל C:/ או דומה), קח רק את החלק אחרי uploads/
      if (cleanPath.includes(":")) {
        const uploadsIndex = cleanPath.indexOf("uploads/");
        if (uploadsIndex !== -1) {
          cleanPath = cleanPath.substring(uploadsIndex);
        }
      }

      // הסר / מהתחלה אם קיים
      cleanPath = cleanPath.replace(/^[\/\\]+/, "");

      return {
        ...chart,
        file_path: chart.file_path.startsWith("http")
          ? chart.file_path
          : `${env.baseUrl}/${cleanPath}`,
      };
    });

    res.json({ charts: chartsWithUrl });
  }),
  uploadPrivateChart: asyncHandler(async (req, res) => {
    const songId = parseInt(req.params.id);
    const user = req.user;
    const file = req.file;
    if (!file) {
      return res
        .status(400)
        .json({ message: tRequest(req, "songs.fileNotSelected") });
    }

    // המרת הנתיב המלא לנתיב יחסי
    let relativePath = file.path;
    const uploadsIndex = relativePath.indexOf("uploads");
    if (uploadsIndex !== -1) {
      relativePath = relativePath.substring(uploadsIndex);
    }
    // החלפת backslashes ב-forward slashes
    relativePath = relativePath.replace(/\\/g, "/");

    const chartId = await uploadPrivateChartPdfForSong(
      songId,
      user,
      relativePath,
    );
    res.json({ message: tRequest(req, "songs.privateChartUploaded"), chartId });
  }),
  list: asyncHandler(async (req, res) => {
    const songs = await getSongs(req.user);

    // הוספת URL מלא לקבצי PDF וסימון ownership
    const songsWithMetadata = songs.map((song) => {
      // הוספת URL ל-PDF
      if (song.chart_pdf) {
        const cleanPdf = song.chart_pdf.replace(/^\/uploads\//, "");
        song.chart_pdf_url = `${env.baseUrl}/uploads/${cleanPdf}`;
      }

      // סימון אם המשתמש הוא הבעלים של השיר
      song.is_owner = song.user_id === req.user.id;

      // הוספת URL מלא לאווטאר של הבעלים אם צריך
      if (song.owner_avatar && !/^https?:\/\//.test(song.owner_avatar)) {
        const cleanAvatar = song.owner_avatar.replace(/^\/uploads\//, "");
        song.owner_avatar = `${env.baseUrl}/uploads/${cleanAvatar}`;
      }

      return song;
    });

    res.json(songsWithMetadata);
  }),
  create: asyncHandler(async (req, res) => {
    const payload = await createSong(req.user, req.body);

    // קבלת הנתונים המלאים של השיר שנוצר
    const fullSong = await getSongById(payload.id);

    // הוספת URL מלא ל-PDF אם קיים
    if (fullSong && fullSong.chart_pdf) {
      const cleanPdf = fullSong.chart_pdf.replace(/^\/uploads\//, "");
      fullSong.chart_pdf_url = `${env.baseUrl}/uploads/${cleanPdf}`;
    }

    // הוספת סימון ownership
    if (fullSong) {
      fullSong.is_owner = fullSong.user_id === req.user.id;
    }

    // הוספת URL מלא לאווטאר של הבעלים אם צריך
    if (
      fullSong &&
      fullSong.owner_avatar &&
      !/^https?:\/\//.test(fullSong.owner_avatar)
    ) {
      const cleanAvatar = fullSong.owner_avatar.replace(/^\/uploads\//, "");
      fullSong.owner_avatar = `${env.baseUrl}/uploads/${cleanAvatar}`;
    }

    // שליחת עדכון בזמן אמת עם הנתונים המלאים
    if (global.io && fullSong) {
      await emitToUserAndHost(global.io, req.user.id, "song:created", {
        song: fullSong,
        songId: payload.id,
        userId: req.user.id,
      });

      // גם ל-user_updates כדי לרענן דפים אחרים
      await emitToUserUpdates(global.io, req.user.id, "song:created", {
        song: fullSong,
        songId: payload.id,
        userId: req.user.id,
      });
    }

    res.status(201).json({
      message: tRequest(req, "songs.created"),
      id: payload.id,
    });
  }),
  update: asyncHandler(async (req, res) => {
    const songId = parseInt(req.params.id);
    await updateSongDetails(req.user, songId, req.body);

    // קבלת הנתונים המלאים של השיר שעודכן
    const fullSong = await getSongById(songId);

    // הוספת URL מלא ל-PDF אם קיים
    if (fullSong && fullSong.chart_pdf) {
      const cleanPdf = fullSong.chart_pdf.replace(/^\/uploads\//, "");
      fullSong.chart_pdf_url = `${env.baseUrl}/uploads/${cleanPdf}`;
    }

    // הוספת סימון ownership
    if (fullSong) {
      fullSong.is_owner = fullSong.user_id === req.user.id;
    }

    // הוספת URL מלא לאווטאר של הבעלים אם צריך
    if (
      fullSong &&
      fullSong.owner_avatar &&
      !/^https?:\/\//.test(fullSong.owner_avatar)
    ) {
      const cleanAvatar = fullSong.owner_avatar.replace(/^\/uploads\//, "");
      fullSong.owner_avatar = `${env.baseUrl}/uploads/${cleanAvatar}`;
    }

    // שליחת עדכון בזמן אמת עם הנתונים המלאים
    if (global.io && fullSong) {
      await emitToUserAndHost(global.io, req.user.id, "song:updated", {
        song: fullSong,
        songId,
        userId: req.user.id,
      });
    }

    res.json({ message: tRequest(req, "songs.updated") });
  }),
  remove: asyncHandler(async (req, res) => {
    const songId = parseInt(req.params.id);
    await removeSong(req.user, songId);

    // שליחת עדכון בזמן אמת
    if (global.io) {
      await emitToUserAndHost(global.io, req.user.id, "song:deleted", {
        songId,
        userId: req.user.id,
      });

      // גם ל-user_updates כדי לרענן דפים אחרים
      await emitToUserUpdates(global.io, req.user.id, "song:deleted", {
        songId,
        userId: req.user.id,
      });
    }

    res.json({ message: tRequest(req, "songs.deleted") });
  }),
  uploadChart: asyncHandler(async (req, res) => {
    if (!req.file) {
      return res
        .status(400)
        .json({ message: tRequest(req, "songs.fileNotUploaded") });
    }

    try {
      const songId = parseInt(req.params.id);
      if (isNaN(songId)) {
        return res
          .status(400)
          .json({ message: tRequest(req, "songs.invalidSongId") });
      }

      const filePath = `/uploads/charts/${req.user.id}/${req.file.filename}`;

      await uploadChartPdfForSong(songId, req.user, filePath);

      const pdfUrl = `${env.baseUrl}${filePath}`;

      // שליחת עדכון בזמן אמת
      if (global.io) {
        await emitToUserAndHost(global.io, req.user.id, "song:chart-uploaded", {
          songId,
          chartPdfUrl: pdfUrl,
          userId: req.user.id,
        });
      }

      res.json({
        message: tRequest(req, "songs.chartUploaded"),
        chart_pdf_url: pdfUrl,
      });
    } catch (error: any) {
      console.error("❌ שגיאה בהעלאת PDF:", error);
      console.error("Stack:", error.stack);

      // אם יש שגיאה, נמחק את הקובץ שהועלה
      if (req.file && req.file.path) {
        const fs = await import("fs");
        try {
          fs.unlinkSync(req.file.path);
        } catch (unlinkError) {
          // התעלם משגיאות מחיקה
        }
      }

      // החזר שגיאה ברורה יותר
      if (error?.message && error.message.includes("chart_pdf")) {
        return res.status(500).json({
          message: tRequest(req, "songs.chartPdfMigrationMissing"),
          error: error.message,
        });
      }

      throw error;
    }
  }),
  deleteChart: asyncHandler(async (req, res) => {
    try {
      const songId = parseInt(req.params.id);
      if (isNaN(songId)) {
        return res
          .status(400)
          .json({ message: tRequest(req, "songs.invalidSongId") });
      }

      await removeChartPdfForSong(songId, req.user);

      // שליחת עדכון בזמן אמת
      if (global.io) {
        await emitToUserAndHost(global.io, req.user.id, "song:chart-deleted", {
          songId,
          userId: req.user.id,
        });
      }

      res.json({
        message: tRequest(req, "songs.chartDeleted"),
      });
    } catch (error: any) {
      console.error("❌ שגיאה במחיקת PDF:", error);
      throw error;
    }
  }),

  upsertLyrics: asyncHandler(async (req, res) => {
    const songId = parseInt(req.params.id);
    if (isNaN(songId)) {
      return res
        .status(400)
        .json({ message: tRequest(req, "songs.invalidSongId") });
    }

    const lyricsText = req.body?.lyrics_text ?? "";
    const updatedSong = await setLyricsForSong(songId, req.user, lyricsText);

    // realtime
    if (global.io) {
      await emitToUserAndHost(global.io, req.user.id, "song:lyrics-updated", {
        songId,
        userId: req.user.id,
      });
    }

    res.json({
      message: tRequest(req, "songs.lyricsSaved"),
      song: updatedSong,
    });
  }),

  deleteLyrics: asyncHandler(async (req, res) => {
    const songId = parseInt(req.params.id);
    if (isNaN(songId)) {
      return res
        .status(400)
        .json({ message: tRequest(req, "songs.invalidSongId") });
    }

    const updatedSong = await removeLyricsForSong(songId, req.user);

    if (global.io) {
      await emitToUserAndHost(global.io, req.user.id, "song:lyrics-deleted", {
        songId,
        userId: req.user.id,
      });
    }

    res.json({
      message: tRequest(req, "songs.lyricsDeleted"),
      song: updatedSong,
    });
  }),
};
