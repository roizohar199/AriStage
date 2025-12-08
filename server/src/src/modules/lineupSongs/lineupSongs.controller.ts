import { asyncHandler } from "../../core/asyncHandler.js";
import {
  addSongToLineup,
  getLineupSongs,
  removeSong,
  reorderLineupSongs,
  uploadChartPdfForSong,
} from "./lineupSongs.service.js";

export const lineupSongsController = {
  list: asyncHandler(async (req, res) => {
    const songs = await getLineupSongs(req.params.lineupId, req.user);
    
    // בדיקה אם הליינאפ שייך למשתמש
    const { lineupBelongsToUser } = await import("../lineups/lineups.repository.js");
    const lineupId = parseInt(req.params.lineupId);
    const isLineupOwner = req.user.role === "admin" || await lineupBelongsToUser(lineupId, req.user.id);
    
    // הוספת URL מלא לקבצי PDF וסימון ownership
    const songsWithMetadata = songs.map((song) => {
      if (song.chart_pdf) {
        const protocol = req.protocol;
        const host = req.get("host");
        const baseUrl = `${protocol}://${host.replace(/:\d+$/, "")}:5000`;
        const cleanPdf = song.chart_pdf.replace(/^\/uploads\//, "");
        song.chart_pdf_url = `${baseUrl}/uploads/${cleanPdf}`;
      }
      
      // המשתמש יכול לערוך רק אם הוא הבעלים של הליינאפ
      song.can_edit = isLineupOwner;
      
      return song;
    });
    
    res.json(songsWithMetadata);
  }),
  create: asyncHandler(async (req, res) => {
    await addSongToLineup(req.params.lineupId, req.user, req.body.song_id);
    res.status(201).json({ message: "✅ שיר נוסף לליינאפ בהצלחה" });
  }),
  reorder: asyncHandler(async (req, res) => {
    await reorderLineupSongs(req.params.lineupId, req.user, req.body.songs);
    res.json({ message: "✅ סדר השירים עודכן בהצלחה" });
  }),
  remove: asyncHandler(async (req, res) => {
    await removeSong(req.params.lineupId, req.user, req.params.songId);
    res.json({ message: "🗑️ השיר נמחק מהליינאפ בהצלחה" });
  }),
  uploadChart: asyncHandler(async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ message: "לא הועלה קובץ" });
    }

    const lineupSongId = parseInt(req.params.lineupSongId);
    const filePath = `/uploads/charts/${req.user.id}/${req.file.filename}`;
    
    await uploadChartPdfForSong(lineupSongId, req.user, filePath);
    
    const protocol = req.protocol;
    const host = req.get("host");
    const baseUrl = `${protocol}://${host.replace(/:\d+$/, "")}:5000`;
    const pdfUrl = `${baseUrl}${filePath}`;
    
    res.json({ 
      message: "✅ קובץ PDF הועלה בהצלחה",
      chart_pdf_url: pdfUrl 
    });
  }),
};

