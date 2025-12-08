import { asyncHandler } from "../../core/asyncHandler.js";
import {
  createSong,
  getSongs,
  removeSong,
  updateSongDetails,
  uploadChartPdfForSong,
} from "./songs.service.js";
import { emitToUserAndHost, emitToUserUpdates } from "../../core/socket.js";

export const songsController = {
  list: asyncHandler(async (req, res) => {
    const songs = await getSongs(req.user);
    
    // הוספת URL מלא לקבצי PDF וסימון ownership
    const songsWithMetadata = songs.map((song) => {
      // הוספת URL ל-PDF
      if (song.chart_pdf) {
        const protocol = req.protocol;
        const host = req.get("host");
        const baseUrl = `${protocol}://${host.replace(/:\d+$/, "")}:5000`;
        const cleanPdf = song.chart_pdf.replace(/^\/uploads\//, "");
        song.chart_pdf_url = `${baseUrl}/uploads/${cleanPdf}`;
      }
      
      // סימון אם המשתמש הוא הבעלים של השיר
      song.is_owner = song.user_id === req.user.id;
      
      return song;
    });
    
    res.json(songsWithMetadata);
  }),
  create: asyncHandler(async (req, res) => {
    const payload = await createSong(req.user, req.body);
    
    // שליחת עדכון בזמן אמת
    if (global.io) {
      await emitToUserAndHost(
        global.io,
        req.user.id,
        "song:created",
        { songId: payload.id, userId: req.user.id }
      );
      
      // גם ל-user_updates כדי לרענן דפים אחרים
      await emitToUserUpdates(
        global.io,
        req.user.id,
        "song:created",
        { songId: payload.id, userId: req.user.id }
      );
    }
    
    res.status(201).json({
      message: "✅ שיר נוסף בהצלחה",
      id: payload.id,
    });
  }),
  update: asyncHandler(async (req, res) => {
    const songId = parseInt(req.params.id);
    await updateSongDetails(req.user, songId, req.body);
    
    // שליחת עדכון בזמן אמת
    if (global.io) {
      await emitToUserAndHost(
        global.io,
        req.user.id,
        "song:updated",
        { songId, userId: req.user.id }
      );
    }
    
    res.json({ message: "✅ השיר עודכן בהצלחה" });
  }),
  remove: asyncHandler(async (req, res) => {
    const songId = parseInt(req.params.id);
    await removeSong(req.user, songId);
    
    // שליחת עדכון בזמן אמת
    if (global.io) {
      await emitToUserAndHost(
        global.io,
        req.user.id,
        "song:deleted",
        { songId, userId: req.user.id }
      );
      
      // גם ל-user_updates כדי לרענן דפים אחרים
      await emitToUserUpdates(
        global.io,
        req.user.id,
        "song:deleted",
        { songId, userId: req.user.id }
      );
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
      const host = req.get("host");
      const baseUrl = `${protocol}://${host.replace(/:\d+$/, "")}:5000`;
      const pdfUrl = `${baseUrl}${filePath}`;
      
      // שליחת עדכון בזמן אמת
      if (global.io) {
        await emitToUserAndHost(
          global.io,
          req.user.id,
          "song:chart-uploaded",
          { songId, chartPdfUrl: pdfUrl, userId: req.user.id }
        );
      }
      
      res.json({ 
        message: "✅ קובץ PDF הועלה בהצלחה",
        chart_pdf_url: pdfUrl 
      });
    } catch (error) {
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
      if (error.message && error.message.includes("chart_pdf")) {
        return res.status(500).json({ 
          message: "השדה chart_pdf לא קיים בטבלה. נא להריץ את ה-SQL migration.",
          error: error.message 
        });
      }
      
      throw error;
    }
  }),
};

