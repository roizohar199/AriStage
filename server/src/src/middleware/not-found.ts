import { tRequest } from "../i18n/serverI18n";

export function notFoundHandler(req, res) {
  res.status(404).json({ error: tRequest(req, "errors.notFound") });
}
