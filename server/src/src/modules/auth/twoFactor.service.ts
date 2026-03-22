import speakeasy from "speakeasy";
import QRCode from "qrcode";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { pool } from "../../database/pool";
import { AppError } from "../../core/errors";
import { logger } from "../../core/logger";
import { env } from "../../config/env";
import { logAuthEvent } from "../security/auditLogger.service";
import { tServer, type ServerLocale } from "../../i18n/serverI18n";

/**
 * Two-Factor Authentication Service
 * Implements TOTP (Time-based One-Time Password) using authenticator apps
 */

interface BackupCode {
  id: number;
  user_id: number;
  code_hash: string;
  used_at: Date | null;
  created_at: Date;
}

const APP_NAME = "Ari Stage";

/**
 * Encrypt sensitive data (like 2FA secret) before storing
 */
const encrypt = (text: string): string => {
  const algorithm = "aes-256-cbc";
  const key = crypto.scryptSync(env.jwtSecret, "salt", 32);
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  return `${iv.toString("hex")}:${encrypted}`;
};

/**
 * Decrypt sensitive data
 */
const decrypt = (encryptedText: string): string => {
  const algorithm = "aes-256-cbc";
  const key = crypto.scryptSync(env.jwtSecret, "salt", 32);
  const [ivHex, encrypted] = encryptedText.split(":");
  const iv = Buffer.from(ivHex, "hex");
  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
};

/**
 * Generate 2FA secret and QR code for setup
 * @param userId - User ID
 * @param email - User email
 * @returns Object with secret and QR code data URL
 */
export const setup2FA = async (
  userId: number,
  email: string,
  locale: ServerLocale = "he-IL",
): Promise<{ secret: string; qrCode: string; backupCodes: string[] }> => {
  try {
    // Check if 2FA is already enabled
    const [rows] = (await pool.query(
      "SELECT two_factor_enabled FROM users WHERE id = ?",
      [userId],
    )) as any[];

    if (rows[0]?.two_factor_enabled) {
      throw new AppError(400, tServer(locale, "twoFactor.enabled"));
    }

    // Generate secret
    const secret = speakeasy.generateSecret({
      name: `${APP_NAME} (${email})`,
      length: 32,
    });

    // Generate QR code
    const qrCode = await QRCode.toDataURL(secret.otpauth_url!);

    // Generate backup codes (10 codes)
    const backupCodes = await generateBackupCodes(userId);

    // Store encrypted secret temporarily (will be confirmed after verification)
    const encryptedSecret = encrypt(secret.base32);
    await pool.query("UPDATE users SET two_factor_secret = ? WHERE id = ?", [
      encryptedSecret,
      userId,
    ]);

    logger.info("2FA setup initiated", { userId, email });

    return {
      secret: secret.base32,
      qrCode,
      backupCodes,
    };
  } catch (error: any) {
    if (error instanceof AppError) {
      throw error;
    }
    logger.error("Failed to setup 2FA", { userId, error: error.message });
    throw error;
  }
};

/**
 * Verify 2FA token and enable 2FA
 * @param userId - User ID
 * @param token - 6-digit TOTP code
 * @returns True if verification successful
 */
export const verify2FASetup = async (
  userId: number,
  token: string,
  locale: ServerLocale = "he-IL",
): Promise<boolean> => {
  try {
    // Get the secret from database
    const [rows] = (await pool.query(
      "SELECT two_factor_secret, two_factor_enabled FROM users WHERE id = ?",
      [userId],
    )) as any[];

    if (!rows[0] || !rows[0].two_factor_secret) {
      throw new AppError(400, tServer(locale, "twoFactor.setupInitiated"));
    }

    if (rows[0].two_factor_enabled) {
      throw new AppError(400, tServer(locale, "twoFactor.enabled"));
    }

    // Decrypt secret
    const secret = decrypt(rows[0].two_factor_secret);

    // Verify token
    const verified = speakeasy.totp.verify({
      secret,
      encoding: "base32",
      token,
      window: 2, // Allow 2 time steps tolerance
    });

    if (!verified) {
      throw new AppError(401, tServer(locale, "twoFactor.invalidCode"));
    }

    // Enable 2FA
    await pool.query("UPDATE users SET two_factor_enabled = 1 WHERE id = ?", [
      userId,
    ]);

    logger.info("2FA enabled", { userId });

    // Log 2FA enabled event
    await logAuthEvent("2FA_ENABLED", userId, undefined, undefined, {});

    return true;
  } catch (error: any) {
    if (error instanceof AppError) {
      throw error;
    }
    logger.error("Failed to verify 2FA setup", {
      userId,
      error: error.message,
    });
    throw error;
  }
};

/**
 * Verify 2FA token during login
 * @param userId - User ID
 * @param token - 6-digit TOTP code or backup code
 * @returns True if verification successful
 */
export const verify2FA = async (
  userId: number,
  token: string,
  locale: ServerLocale = "he-IL",
): Promise<boolean> => {
  try {
    // Get user 2FA data
    const [rows] = (await pool.query(
      "SELECT two_factor_secret, two_factor_enabled FROM users WHERE id = ?",
      [userId],
    )) as any[];

    if (!rows[0] || !rows[0].two_factor_enabled || !rows[0].two_factor_secret) {
      throw new AppError(400, tServer(locale, "twoFactor.disabled"));
    }

    // Try backup code first
    if (token.length > 6) {
      const backupValid = await verifyBackupCode(userId, token);
      if (backupValid) {
        logger.info("2FA verified with backup code", { userId });
        return true;
      }
    }

    // Decrypt secret
    const secret = decrypt(rows[0].two_factor_secret);

    // Verify TOTP token
    const verified = speakeasy.totp.verify({
      secret,
      encoding: "base32",
      token,
      window: 2,
    });

    if (!verified) {
      throw new AppError(401, tServer(locale, "twoFactor.invalidCode"));
    }

    logger.debug("2FA verified", { userId });

    return true;
  } catch (error: any) {
    if (error instanceof AppError) {
      throw error;
    }
    logger.error("Failed to verify 2FA", { userId, error: error.message });
    throw error;
  }
};

/**
 * Disable 2FA for a user
 * @param userId - User ID
 * @param password - User password for confirmation
 * @param token - Optional 2FA token
 */
export const disable2FA = async (
  userId: number,
  password: string,
  token?: string,
  locale: ServerLocale = "he-IL",
): Promise<void> => {
  try {
    // Verify password
    const [rows] = (await pool.query(
      "SELECT password_hash, two_factor_enabled, two_factor_secret FROM users WHERE id = ?",
      [userId],
    )) as any[];

    if (!rows[0]) {
      throw new AppError(404, tServer(locale, "auth.userNotFound"));
    }

    const isPasswordValid = await bcrypt.compare(
      password,
      rows[0].password_hash,
    );
    if (!isPasswordValid) {
      throw new AppError(401, tServer(locale, "auth.invalidPassword"));
    }

    // If 2FA is enabled and token provided, verify it
    if (rows[0].two_factor_enabled && token) {
      await verify2FA(userId, token, locale);
    }

    // Disable 2FA
    await pool.query(
      "UPDATE users SET two_factor_enabled = 0, two_factor_secret = NULL WHERE id = ?",
      [userId],
    );

    // Delete backup codes
    await pool.query("DELETE FROM backup_codes WHERE user_id = ?", [userId]);

    logger.info("2FA disabled", { userId });

    // Log 2FA disabled event
    await logAuthEvent("2FA_DISABLED", userId, undefined, undefined, {});
  } catch (error: any) {
    if (error instanceof AppError) {
      throw error;
    }
    logger.error("Failed to disable 2FA", { userId, error: error.message });
    throw error;
  }
};

/**
 * Generate backup codes for 2FA recovery
 * @param userId - User ID
 * @returns Array of backup codes
 */
const generateBackupCodes = async (userId: number): Promise<string[]> => {
  const codes: string[] = [];
  const codeCount = 10;

  // Delete existing backup codes
  await pool.query("DELETE FROM backup_codes WHERE user_id = ?", [userId]);

  for (let i = 0; i < codeCount; i++) {
    // Generate random 8-character code
    const code = crypto.randomBytes(4).toString("hex").toUpperCase();
    codes.push(code);

    // Hash and store the code
    const codeHash = await bcrypt.hash(code, 10);
    await pool.query(
      "INSERT INTO backup_codes (user_id, code_hash) VALUES (?, ?)",
      [userId, codeHash],
    );
  }

  return codes;
};

/**
 * Verify a backup code
 * @param userId - User ID
 * @param code - Backup code
 * @returns True if valid
 */
const verifyBackupCode = async (
  userId: number,
  code: string,
): Promise<boolean> => {
  try {
    // Get all unused backup codes for user
    const [rows] = (await pool.query(
      "SELECT id, code_hash FROM backup_codes WHERE user_id = ? AND used_at IS NULL",
      [userId],
    )) as any[];

    if (!Array.isArray(rows) || rows.length === 0) {
      return false;
    }

    // Check each code
    for (const row of rows) {
      const isMatch = await bcrypt.compare(code.toUpperCase(), row.code_hash);
      if (isMatch) {
        // Mark code as used
        await pool.query(
          "UPDATE backup_codes SET used_at = NOW() WHERE id = ?",
          [row.id],
        );
        logger.info("Backup code used", { userId, codeId: row.id });
        return true;
      }
    }

    return false;
  } catch (error: any) {
    logger.error("Failed to verify backup code", {
      userId,
      error: error.message,
    });
    return false;
  }
};

/**
 * Check if user has 2FA enabled
 * @param userId - User ID
 * @returns True if 2FA is enabled
 */
export const is2FAEnabled = async (userId: number): Promise<boolean> => {
  try {
    const [rows] = (await pool.query(
      "SELECT two_factor_enabled FROM users WHERE id = ?",
      [userId],
    )) as any[];

    return rows[0]?.two_factor_enabled === 1;
  } catch (error: any) {
    logger.error("Failed to check 2FA status", {
      userId,
      error: error.message,
    });
    return false;
  }
};

/**
 * Get remaining backup codes count
 * @param userId - User ID
 * @returns Number of unused backup codes
 */
export const getRemainingBackupCodes = async (
  userId: number,
): Promise<number> => {
  try {
    const [rows] = (await pool.query(
      "SELECT COUNT(*) as count FROM backup_codes WHERE user_id = ? AND used_at IS NULL",
      [userId],
    )) as any[];

    return rows[0]?.count || 0;
  } catch (error: any) {
    logger.error("Failed to get backup codes count", {
      userId,
      error: error.message,
    });
    return 0;
  }
};
