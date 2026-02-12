import { AppError } from "../../core/errors";
import fs from "fs/promises";
import path from "path";
import {
  deleteFile,
  fileBelongsToUser,
  findFileById,
  insertFile,
  listFiles,
  updateFile,
} from "./files.repository";
import { isElevatedRole } from "../../types/roles";
import { getUploadsRoot } from "../../utils/uploadsRoot";

function normalizeUploadsDiskPath(fileUrl: unknown): string | null {
  if (!fileUrl) return null;
  const raw = String(fileUrl).trim();
  if (!raw) return null;

  let pathname = "";
  try {
    if (raw.startsWith("http://") || raw.startsWith("https://")) {
      pathname = new URL(raw).pathname || "";
    } else {
      pathname = raw;
    }
  } catch {
    pathname = raw;
  }

  // Support common forms:
  // - /uploads/...
  // - uploads/...
  // - .../uploads/...
  const idx = pathname.indexOf("/uploads/");
  let relative = "";
  if (idx >= 0) {
    relative = pathname.slice(idx + "/uploads/".length);
  } else if (pathname.startsWith("uploads/")) {
    relative = pathname.slice("uploads/".length);
  } else if (pathname.startsWith("/uploads/")) {
    relative = pathname.slice("/uploads/".length);
  } else {
    return null;
  }

  // Prevent path traversal by resolving and then verifying it stays under uploads root.
  const uploadsRoot = path.resolve(getUploadsRoot());
  const diskPath = path.resolve(uploadsRoot, relative);
  if (
    !diskPath.startsWith(uploadsRoot + path.sep) &&
    diskPath !== uploadsRoot
  ) {
    return null;
  }

  return diskPath;
}

export async function getFiles(user, opts?: { userId?: number }) {
  const rows: any[] = await listFiles(user.role, user.id, {
    userId: opts?.userId,
  });

  // Enrich with size_bytes when file_url points to local /uploads path.
  const enriched = await Promise.all(
    rows.map(async (row) => {
      const diskPath = normalizeUploadsDiskPath(row.file_url);
      if (!diskPath) return { ...row, size_bytes: null };

      try {
        const stat = await fs.stat(diskPath);
        return { ...row, size_bytes: stat.size };
      } catch {
        return { ...row, size_bytes: null };
      }
    }),
  );

  return enriched;
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

export async function removeFile(
  user,
  id,
  opts?: { deleteFromDisk?: boolean },
) {
  const isAdmin = user.role === "admin";
  const elevated = isElevatedRole(user.role);

  if (!isAdmin) {
    const ownsFile = await fileBelongsToUser(id, user.id);
    if (!ownsFile) {
      throw new AppError(403, "אין לך הרשאה למחוק את הקובץ הזה");
    }
  }

  const file = await findFileById(id);
  if (!file) {
    throw new AppError(404, "קובץ לא נמצא");
  }

  // Optional disk deletion for elevated roles (or admin). Non-elevated users can still
  // delete their DB record, but cannot request disk deletion.
  const shouldDeleteDisk = Boolean(opts?.deleteFromDisk) && elevated;
  if (shouldDeleteDisk) {
    const diskPath = normalizeUploadsDiskPath(file.file_url);
    if (diskPath) {
      try {
        await fs.unlink(diskPath);
      } catch (err: any) {
        // Ignore missing files; proceed to delete DB record.
        if (err?.code !== "ENOENT") {
          throw err;
        }
      }
    }
  }

  const affected = await deleteFile(id);
  if (!affected) throw new AppError(404, "קובץ לא נמצא");
}
