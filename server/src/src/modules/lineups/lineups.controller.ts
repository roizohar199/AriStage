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
  getSharedLineups,
  updateLineup,
  deleteLineup,
} from "./lineups.service.js";
import { emitToUserAndHost, emitToUserUpdates } from "../../core/socket.js";
import { listLineupSongsForLyricsExport } from "../lineupSongs/lineupSongs.repository.js";

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
      lineup.owner_id = lineup.created_by; // הוספת owner_id בצורה מפורשת
      return lineup;
    });

    res.json(lineupsWithMetadata);
  }),

  // endpoint חדש לליינאפים משותפים
  sharedWithMe: asyncHandler(async (req, res) => {
    const sharedLineups = await getSharedLineups(req.user);

    // הוספת מטאדאטה לכל ליינאפ
    const lineupsWithMetadata = sharedLineups.map((lineup) => {
      lineup.is_owner = false; // בהגדרה אני לא הבעלים של ליינאפים משותפים
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
    lineup.owner_id = lineup.created_by;

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
    lineup.owner_id = lineup.created_by;

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
    lineup.owner_id = lineup.created_by;

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
          { lineup, lineupId, userId: req.user.id },
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

  downloadCharts: asyncHandler(async (req, res) => {
    const puppeteer = await import("puppeteer");
    const fetch = (await import("node-fetch")).default;
    const sharp = (await import("sharp")).default;
    const { env } = await import("../../config/env.js");
    const { charts } = req.body;

    console.log("=== התחלת הורדת צ'ארטים ===");
    console.log("מספר צ'ארטים:", charts?.length);

    if (!charts || !Array.isArray(charts) || charts.length === 0) {
      return res.status(400).json({ message: "לא נמצאו צ'ארטים להורדה" });
    }

    let browser;
    try {
      // הכנת HTML עם כל הצ'ארטים
      let htmlContent = `
        <!DOCTYPE html>
        <html dir="rtl" lang="he">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Lineup Charts</title>
          <style>
            * {
              margin: 0;
              padding: 0;
            }
            body {
              font-family: Arial, sans-serif;
              direction: rtl;
              line-height: 1.6;
              background: white;
              padding: 20px;
            }
            .song-container {
              page-break-after: always;
              margin-bottom: 40px;
              padding: 20px;
              border-bottom: 2px solid #ddd;
            }
            .song-title {
              font-size: 24px;
              font-weight: bold;
              color: #333;
              margin-bottom: 15px;
              text-align: right;
            }
            .song-details {
              margin-bottom: 20px;
              text-align: right;
            }
            .detail-line {
              font-size: 14px;
              color: #555;
              margin: 8px 0;
              padding: 5px;
            }
            .chart-image {
              max-width: 100%;
              height: auto;
              margin-top: 20px;
              border: 1px solid #ccc;
              padding: 10px;
            }
            .no-chart {
              color: #999;
              font-style: italic;
              margin-top: 10px;
            }
          </style>
        </head>
        <body>
      `;

      // הוספת כל השירים
      for (let i = 0; i < charts.length; i++) {
        const chart = charts[i];

        htmlContent += `
          <div class="song-container">
            <div class="song-title">${chart.songTitle || `Song #${i + 1}`}</div>
            <div class="song-details">
              <div class="detail-line"><strong>מספר:</strong> ${i + 1}</div>
              <div class="detail-line"><strong>אמן:</strong> ${
                chart.artist || "N/A"
              }</div>
              <div class="detail-line"><strong>מפתח:</strong> ${
                chart.key_sig || "N/A"
              }</div>
              <div class="detail-line"><strong>BPM:</strong> ${
                chart.bpm || "N/A"
              }</div>
              <div class="detail-line"><strong>משך:</strong> ${
                chart.duration || "N/A"
              }</div>
            </div>
        `;

        // הוסף צ'ארט אם קיים
        if (chart.chartUrl) {
          let fullUrl = chart.chartUrl;
          if (chart.chartUrl.startsWith("/uploads")) {
            fullUrl = `${env.baseUrl}${chart.chartUrl}`;
          }

          try {
            const response = await fetch(fullUrl);
            if (response.ok) {
              const buffer = await response.buffer();

              // בדוק אם זה תמונה
              if (chart.chartUrl.match(/\.(jpg|jpeg|png|gif)$/i)) {
                // המרת תמונה ל-base64
                const base64 = buffer.toString("base64");
                const imageType = chart.chartUrl.match(/\.(jpg|jpeg)$/i)
                  ? "jpeg"
                  : "png";
                htmlContent += `<img class="chart-image" src="data:image/${imageType};base64,${base64}" alt="Chart">`;
              }
            }
          } catch (err) {
            console.error(`שגיאה בהוספת צ'ארט ${chart.songTitle}:`, err);
            htmlContent += `<div class="no-chart">לא ניתן להוריד את הצ'ארט</div>`;
          }
        } else {
          htmlContent += `<div class="no-chart">אין צ'ארט לשיר זה</div>`;
        }

        htmlContent += `</div>`;
      }

      htmlContent += `
        </body>
        </html>
      `;

      // הפעלת Puppeteer כדי להמיר HTML ל-PDF
      browser = await puppeteer.default.launch({
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      });

      const page = await browser.newPage();
      await page.setContent(htmlContent, { waitUntil: "networkidle0" });

      const pdfBuffer = await page.pdf({
        format: "A4",
        margin: {
          top: "20px",
          bottom: "20px",
          left: "20px",
          right: "20px",
        },
      });

      await browser.close();

      // שלח את ה-PDF
      res.contentType("application/pdf");
      res.setHeader(
        "Content-Disposition",
        'attachment; filename="lineup-charts.pdf"',
      );
      res.send(pdfBuffer);
    } catch (err) {
      console.error("שגיאה ביצירת PDF:", err);
      if (browser) {
        await browser.close();
      }
      res.status(500).json({ message: "שגיאה ביצירת ה-PDF" });
    }
  }),

  downloadLyrics: asyncHandler(async (req, res) => {
    const puppeteer = await import("puppeteer");

    const lineupId = parseInt(req.params.id);
    if (isNaN(lineupId)) {
      return res.status(400).json({ message: "ID ליינאפ לא תקין" });
    }

    // enforce access (owner or invited guest)
    const lineup = await getLineupById(lineupId, req.user);

    let rows: any[];
    try {
      rows = (await listLineupSongsForLyricsExport(lineupId)) as any[];
    } catch (error: any) {
      return res
        .status(400)
        .json({ message: error?.message || "שגיאה בטעינת מילים" });
    }

    if (!rows || rows.length === 0) {
      return res.status(404).json({ message: "לא נמצאו שירים בליינאפ" });
    }

    const esc = (s: string) =>
      s
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\"/g, "&quot;")
        .replace(/'/g, "&#39;");

    const title = String(lineup?.title || "Lineup");
    let htmlContent = `
      <!DOCTYPE html>
      <html dir="rtl" lang="he">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${esc(title)} - Lyrics</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: Arial, sans-serif;
            direction: rtl;
            line-height: 1.6;
            background: white;
            padding: 20px;
            color: #111;
          }
          .header {
            margin-bottom: 18px;
            padding-bottom: 12px;
            border-bottom: 2px solid #eee;
          }
          .header-title {
            font-size: 22px;
            font-weight: bold;
          }
          .song-container {
            page-break-after: always;
            margin-bottom: 28px;
            padding-bottom: 18px;
            border-bottom: 1px solid #eee;
          }
          .song-title {
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 6px;
          }
          .song-meta {
            font-size: 12px;
            color: #444;
            margin-bottom: 10px;
          }
          .lyrics {
            white-space: pre-wrap;
            font-size: 13px;
            background: #fafafa;
            border: 1px solid #eee;
            padding: 12px;
            border-radius: 6px;
          }
          .no-lyrics {
            font-size: 13px;
            color: #777;
            font-style: italic;
            background: #fafafa;
            border: 1px dashed #ddd;
            padding: 12px;
            border-radius: 6px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="header-title">${esc(title)}</div>
        </div>
    `;

    for (let i = 0; i < rows.length; i++) {
      const r: any = rows[i];
      const songTitle = String(r.title || `Song #${i + 1}`);
      const artist = String(r.artist || "");
      const lyricsText = r.lyrics_text ? String(r.lyrics_text) : "";

      htmlContent += `
        <div class="song-container">
          <div class="song-title">${i + 1}. ${esc(songTitle)}</div>
          <div class="song-meta">${artist ? `<strong>אמן:</strong> ${esc(artist)}` : ""}</div>
          ${
            lyricsText.trim()
              ? `<div class="lyrics">${esc(lyricsText)}</div>`
              : `<div class="no-lyrics">אין מילים לשיר זה</div>`
          }
        </div>
      `;
    }

    htmlContent += `
      </body>
      </html>
    `;

    let browser;
    try {
      browser = await puppeteer.default.launch({
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      });
      const page = await browser.newPage();
      await page.setContent(htmlContent, { waitUntil: "networkidle0" });

      const pdfBuffer = await page.pdf({
        format: "A4",
        margin: { top: "20px", bottom: "20px", left: "20px", right: "20px" },
      });

      await browser.close();

      res.contentType("application/pdf");
      res.setHeader(
        "Content-Disposition",
        'attachment; filename="lineup-lyrics.pdf"',
      );
      res.send(pdfBuffer);
    } catch (err) {
      console.error("שגיאה ביצירת PDF מילים:", err);
      if (browser) {
        try {
          await browser.close();
        } catch {}
      }
      res.status(500).json({ message: "שגיאה ביצירת ה-PDF" });
    }
  }),
};
