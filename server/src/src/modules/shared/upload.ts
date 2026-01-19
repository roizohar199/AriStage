import multer from "multer";
import path from "path";
import fs from "fs";
import { joinUploadsPath } from "../../utils/uploadsRoot.js";

// פונקציה לבניית נתיב מוחלט לתיקיית uploads בשורש הפרויקט
function uploadsRoot(...sub) {
  return joinUploadsPath(...sub);
}

// ⭐ העלאת תמונה בהרשמה — אין userId עדיין
export const uploadTempAvatar = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const dir = uploadsRoot("temp");

      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      cb(null, dir);
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      const filename = Date.now() + "-" + Math.round(Math.random() * 1e9) + ext;
      cb(null, filename);
    },
  }),
});

// ⭐ העלאת תמונה ע"י משתמש קיים
export const uploadUserAvatar = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const userId = req.user?.id;
      if (!userId) return cb(new Error("User ID not found"), "");

      const dir = uploadsRoot("users", String(userId));

      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      cb(null, dir);
    },

    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      cb(null, "avatar" + ext);
    },
  }),
});

// ⭐ העלאת קובץ PDF צ'ארט לשיר בליינאפ
export const uploadChartPdf = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const userId = req.user?.id;
      if (!userId) return cb(new Error("User ID not found"), "");

      const dir = uploadsRoot("charts", String(userId));

      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      cb(null, dir);
    },

    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      const lineupSongId = req.params.lineupSongId || Date.now();
      const filename = `chart-${lineupSongId}-${Date.now()}${ext}`;
      cb(null, filename);
    },
  }),

  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("רק קבצי PDF מותרים"), false);
    }
  },

  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
});

// ⭐ העלאת קובץ PDF צ'ארט לשיר במאגר השירים
export const uploadSongChartPdf = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const userId = req.user?.id;
      if (!userId) return cb(new Error("User ID not found"), "");

      const dir = uploadsRoot("charts", String(userId));

      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      cb(null, dir);
    },

    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      const songId = req.params.id || req.params.songId || Date.now();
      const filename = `song-chart-${songId}-${Date.now()}${ext}`;
      cb(null, filename);
    },
  }),

  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/jpg",
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("רק קבצי PDF או תמונה (JPG, PNG, GIF) מותרים"), false);
    }
  },

  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
});
