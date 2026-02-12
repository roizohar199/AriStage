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

export const songsController = {
  deletePrivateChart: asyncHandler(async (req, res) => {
    const chartId = parseInt(req.params.chartId);
    const user = req.user;
    const deleted = await deleteSongChart(chartId, user.id);
    if (deleted) {
      res.json({ message: "הצ'ארט נמחק בהצלחה" });
    } else {
      res.status(403).json({ message: "לא נמצא או אין הרשאה למחוק" });
    }
  }),
  getPrivateCharts: asyncHandler(async (req, res) => {
    const songId = parseInt(req.params.id);
    const user = req.user;
    const charts = await getPrivateChartsForSong(songId, user);

    // הוספת URL מלא לכל צ'ארט
    const protocol = req.protocol;
    const host = req.get("host") ?? "localhost";
    const baseUrl = `${protocol}://${host.replace(/:\d+$/, "")}:5000`;

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
          : `${baseUrl}/${cleanPath}`,
      };
    });

    res.json({ charts: chartsWithUrl });
  }),
  uploadPrivateChart: asyncHandler(async (req, res) => {
    const songId = parseInt(req.params.id);
    const user = req.user;
    const file = req.file;
    if (!file) {
      return res.status(400).json({ message: "לא נבחר קובץ" });
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
    res.json({ message: "הצ'ארט הועלה בהצלחה", chartId });
  }),
  list: asyncHandler(async (req, res) => {
    const songs = await getSongs(req.user);

    // הוספת URL מלא לקבצי PDF וסימון ownership
    const songsWithMetadata = songs.map((song) => {
      // הוספת URL ל-PDF
      if (song.chart_pdf) {
        const protocol = req.protocol;
        const host = req.get("host") ?? "localhost";
        const baseUrl = `${protocol}://${host.replace(/:\d+$/, "")}:5000`;
        const cleanPdf = song.chart_pdf.replace(/^\/uploads\//, "");
        song.chart_pdf_url = `${baseUrl}/uploads/${cleanPdf}`;
      }

      // סימון אם המשתמש הוא הבעלים של השיר
      song.is_owner = song.user_id === req.user.id;

      // הוספת URL מלא לאווטאר של הבעלים אם צריך
      if (song.owner_avatar && !/^https?:\/\//.test(song.owner_avatar)) {
        const protocol = req.protocol;
        const host = req.get("host") ?? "localhost";
        const baseUrl = `${protocol}://${host.replace(/:\d+$/, "")}:5000`;
        const cleanAvatar = song.owner_avatar.replace(/^\/uploads\//, "");
        song.owner_avatar = `${baseUrl}/uploads/${cleanAvatar}`;
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
      const protocol = req.protocol;
      const host = req.get("host") ?? "localhost";
      const baseUrl = `${protocol}://${host.replace(/:\d+$/, "")}:5000`;
      const cleanPdf = fullSong.chart_pdf.replace(/^\/uploads\//, "");
      fullSong.chart_pdf_url = `${baseUrl}/uploads/${cleanPdf}`;
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
      const protocol = req.protocol;
      const host = req.get("host") ?? "localhost";
      const baseUrl = `${protocol}://${host.replace(/:\d+$/, "")}:5000`;
      const cleanAvatar = fullSong.owner_avatar.replace(/^\/uploads\//, "");
      fullSong.owner_avatar = `${baseUrl}/uploads/${cleanAvatar}`;
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
      message: "✅ שיר נוסף בהצלחה",
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
      const protocol = req.protocol;
      const host = req.get("host") ?? "localhost";
      const baseUrl = `${protocol}://${host.replace(/:\d+$/, "")}:5000`;
      const cleanPdf = fullSong.chart_pdf.replace(/^\/uploads\//, "");
      fullSong.chart_pdf_url = `${baseUrl}/uploads/${cleanPdf}`;
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
      const protocol = req.protocol;
      const host = req.get("host") ?? "localhost";
      const baseUrl = `${protocol}://${host.replace(/:\d+$/, "")}:5000`;
      const cleanAvatar = fullSong.owner_avatar.replace(/^\/uploads\//, "");
      fullSong.owner_avatar = `${baseUrl}/uploads/${cleanAvatar}`;
    }

    // שליחת עדכון בזמן אמת עם הנתונים המלאים
    if (global.io && fullSong) {
      await emitToUserAndHost(global.io, req.user.id, "song:updated", {
        song: fullSong,
        songId,
        userId: req.user.id,
      });
    }

    res.json({ message: "✅ השיר עודכן בהצלחה" });
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

    res.json({ message: "✅ השיר נמחק בהצלחה" });
  }),
  uploadChart: asyncHandler(async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ message: "לא הועלה קובץ" });
    }

    try {
      const songId = parseInt(req.params.id);
      if (isNaN(songId)) {
        return res.status(400).json({ message: "ID שיר לא תקין" });
      }

      const filePath = `/uploads/charts/${req.user.id}/${req.file.filename}`;

      await uploadChartPdfForSong(songId, req.user, filePath);

      const protocol = req.protocol;
      const host = req.get("host") ?? "localhost";
      const baseUrl = `${protocol}://${host.replace(/:\d+$/, "")}:5000`;
      const pdfUrl = `${baseUrl}${filePath}`;

      // שליחת עדכון בזמן אמת
      if (global.io) {
        await emitToUserAndHost(global.io, req.user.id, "song:chart-uploaded", {
          songId,
          chartPdfUrl: pdfUrl,
          userId: req.user.id,
        });
      }

      res.json({
        message: "✅ קובץ PDF הועלה בהצלחה",
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
          message: "השדה chart_pdf לא קיים בטבלה. נא להריץ את ה-SQL migration.",
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
        return res.status(400).json({ message: "ID שיר לא תקין" });
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
        message: "✅ קובץ PDF נמחק בהצלחה",
      });
    } catch (error: any) {
      console.error("❌ שגיאה במחיקת PDF:", error);
      throw error;
    }
  }),

  upsertLyrics: asyncHandler(async (req, res) => {
    const songId = parseInt(req.params.id);
    if (isNaN(songId)) {
      return res.status(400).json({ message: "ID שיר לא תקין" });
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
      message: "✅ המילים נשמרו בהצלחה",
      song: updatedSong,
    });
  }),

  deleteLyrics: asyncHandler(async (req, res) => {
    const songId = parseInt(req.params.id);
    if (isNaN(songId)) {
      return res.status(400).json({ message: "ID שיר לא תקין" });
    }

    const updatedSong = await removeLyricsForSong(songId, req.user);

    if (global.io) {
      await emitToUserAndHost(global.io, req.user.id, "song:lyrics-deleted", {
        songId,
        userId: req.user.id,
      });
    }

    res.json({
      message: "✅ המילים נמחקו בהצלחה",
      song: updatedSong,
    });
  }),
};
