import { asyncHandler } from "../../core/asyncHandler.js";
import {
  createFile,
  getFiles,
  removeFile,
  updateFileDetails,
} from "./files.service.js";

export const filesController = {
  list: asyncHandler(async (req, res) => {
    const rawUserId = req.query?.userId;
    const userIdFilter =
      typeof rawUserId === "string" && rawUserId.trim()
        ? Number(rawUserId)
        : undefined;

    const files = await getFiles(req.user, {
      userId: Number.isFinite(userIdFilter as number)
        ? (userIdFilter as number)
        : undefined,
    });
    res.json(files);
  }),
  create: asyncHandler(async (req, res) => {
    const file = await createFile(req.user, req.body);
    res.status(201).json(file);
  }),
  update: asyncHandler(async (req, res) => {
    const file = await updateFileDetails(req.user, req.params.id, req.body);
    res.json(file);
  }),
  remove: asyncHandler(async (req, res) => {
    const rawDisk = req.query?.disk;
    const deleteFromDisk = rawDisk === "1" || rawDisk === "true";

    await removeFile(req.user, req.params.id, { deleteFromDisk });
    res.json({ message: "✅ הקובץ נמחק בהצלחה" });
  }),
};
