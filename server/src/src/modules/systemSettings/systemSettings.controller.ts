import type { Request, Response } from "express";
import * as service from "./systemSettings.service.js";
import {
  hasServerTranslationKey,
  resolveRequestLocale,
  tRequest,
  tServer,
} from "../../i18n/serverI18n";

/**
 * System Settings Controller
 * HTTP handlers for system configuration endpoints
 */

/**
 * GET /api/admin/system-settings
 * List all system settings (admin only)
 */
export async function listSystemSettings(req: Request, res: Response) {
  try {
    const category = req.query.category as string | undefined;
    const settings = await service.getSystemSettings(category);

    res.json({ settings });
  } catch (error: any) {
    console.error("Error fetching system settings:", error);
    res
      .status(500)
      .json({ error: tRequest(req, "systemSettings.fetchFailed") });
  }
}

/**
 * GET /api/admin/system-settings/i18n
 * Get i18n configuration (public - available to all authenticated users)
 */
export async function getI18nSettings(req: Request, res: Response) {
  try {
    const settings = await service.getI18nSettings();
    res.json(settings);
  } catch (error: any) {
    console.error("Error fetching i18n settings:", error);
    res
      .status(500)
      .json({ error: tRequest(req, "systemSettings.fetchI18nFailed") });
  }
}

/**
 * PUT /api/admin/system-settings/i18n
 * Update i18n configuration (admin only)
 */
export async function updateI18nSettings(req: Request, res: Response) {
  try {
    const { default_locale, enabled_locales, default_locale_mode } = req.body;

    await service.updateI18nSettings({
      default_locale,
      enabled_locales,
      default_locale_mode,
    });

    const updated = await service.getI18nSettings();
    res.json({ success: true, settings: updated });
  } catch (error: any) {
    console.error("Error updating i18n settings:", error);

    if (hasServerTranslationKey(error?.message || "")) {
      return res.status(400).json({
        error: tServer(resolveRequestLocale(req), error.message),
      });
    }

    res
      .status(500)
      .json({ error: tRequest(req, "systemSettings.updateI18nFailed") });
  }
}
