import { AppError } from "../../core/errors.js";
import {
  deleteFile,
  fileBelongsToUser,
  findFileById,
  insertFile,
  listFiles,
  updateFile,
} from "./files.repository.js";

export function getFiles(user) {
  return listFiles(user.role, user.id);
}

export async function createFile(user, payload) {
  if (!payload.file_name || !payload.file_url) {
    throw new AppError(400, "חובה להזין שם וקישור לקובץ");
  }

  const id = await insertFile({
    user_id: user.id,
    file_name: payload.file_name.trim(),
    file_url: payload.file_url.trim(),
    file_type: payload.file_type || "unknown",
  });

  return findFileById(id);
}

export async function updateFileDetails(user, id, payload) {
  if (!payload.file_name || !payload.file_name.trim()) {
    throw new AppError(400, "חובה להזין שם קובץ");
  }

  if (user.role !== "admin") {
    const ownsFile = await fileBelongsToUser(id, user.id);
    if (!ownsFile) {
      throw new AppError(403, "אין לך הרשאה לעדכן את הקובץ הזה");
    }
  }

  const affected = await updateFile(id, {
    file_name: payload.file_name.trim(),
    file_type: payload.file_type || "unknown",
  });

  if (!affected) {
    throw new AppError(404, "קובץ לא נמצא");
  }

  return findFileById(id);
}

export async function removeFile(user, id) {
  if (user.role !== "admin") {
    const ownsFile = await fileBelongsToUser(id, user.id);
    if (!ownsFile) {
      throw new AppError(403, "אין לך הרשאה למחוק את הקובץ הזה");
    }
  }

  const affected = await deleteFile(id);
  if (!affected) {
    throw new AppError(404, "קובץ לא נמצא");
  }
}

