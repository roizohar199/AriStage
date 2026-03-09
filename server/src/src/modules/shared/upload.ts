import multer from "multer";
import path from "path";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";
import { joinUploadsPath } from "../../utils/uploadsRoot";

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
      const ext = path.extname(file.originalname).toLowerCase();
      // Use UUID for secure, unique filenames
      const filename = `avatar-${uuidv4()}${ext}`;
      cb(null, filename);
    },
  }),
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("רק קבצי תמונה מותרים (JPG, PNG, GIF, WebP)"), false);
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit for avatars
  },
});

// ⭐ העלאת תמונה ע"י משתמש קיים
export const uploadUserAvatar = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const userId = req.user?.id;
      if (!userId) return cb(new Error("User ID not found"), "");

      // Validate userId is a positive integer to prevent path traversal
      const numericUserId = Number(userId);
      if (!Number.isInteger(numericUserId) || numericUserId <= 0) {
        return cb(new Error("Invalid user ID"), "");
      }

      const dir = uploadsRoot("users", String(numericUserId));

      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      cb(null, dir);
    },

    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      // Use UUID for secure filenames
      const filename = `avatar-${uuidv4()}${ext}`;
      cb(null, filename);
    },
  }),
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("רק קבצי תמונה מותרים (JPG, PNG, GIF, WebP)"), false);
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

// ⭐ העלאת קובץ PDF צ'ארט לשיר בליינאפ
export const uploadChartPdf = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const userId = req.user?.id;
      if (!userId) return cb(new Error("User ID not found"), "");

      // Validate userId to prevent path traversal
      const numericUserId = Number(userId);
      if (!Number.isInteger(numericUserId) || numericUserId <= 0) {
        return cb(new Error("Invalid user ID"), "");
      }

      const dir = uploadsRoot("charts", String(numericUserId));

      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      cb(null, dir);
    },

    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      // Use UUID instead of lineupSongId for security
      const filename = `chart-${uuidv4()}${ext}`;
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

      // Validate userId to prevent path traversal
      const numericUserId = Number(userId);
      if (!Number.isInteger(numericUserId) || numericUserId <= 0) {
        return cb(new Error("Invalid user ID"), "");
      }

      const dir = uploadsRoot("charts", String(numericUserId));

      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      cb(null, dir);
    },

    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      // Use UUID for secure filenames
      const filename = `song-chart-${uuidv4()}${ext}`;
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
