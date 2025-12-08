import { asyncHandler } from "../../core/asyncHandler.js";
import {
  createFile,
  getFiles,
  removeFile,
  updateFileDetails,
} from "./files.service.js";

export const filesController = {
  list: asyncHandler(async (req, res) => {
    const files = await getFiles(req.user);
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
    await removeFile(req.user, req.params.id);
    res.json({ message: "✅ הקובץ נמחק בהצלחה" });
  }),
};

