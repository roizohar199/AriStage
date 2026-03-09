import crypto from "crypto";
import bcrypt from "bcryptjs";
import { pool } from "../../database/pool";
import { AppError } from "../../core/errors";
import { logger } from "../../core/logger";

/**
 * Refresh Token Service
 * Manages refresh tokens for JWT authentication
 */

interface RefreshToken {
  id: number;
  user_id: number;
  token_hash: string;
  expires_at: Date;
  created_at: Date;
  revoked_at: Date | null;
  ip_address: string | null;
  user_agent: string | null;
}

const REFRESH_TOKEN_EXPIRY_DAYS = 30;

/**
 * Generate a new refresh token
 * @param userId - User ID
 * @param ipAddress - Client IP address
 * @param userAgent - Client user agent
 * @returns Object with token and expiration date
 */
export const generateRefreshToken = async (
  userId: number,
  ipAddress?: string,
  userAgent?: string,
): Promise<{ token: string; expiresAt: Date }> => {
  // Generate a secure random token
  const token = crypto.randomBytes(64).toString("hex");

  // Hash the token before storing (never store plaintext tokens)
  const tokenHash = await bcrypt.hash(token, 10);

  // Calculate expiration
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRY_DAYS);

  try {
    // Store in database
    await pool.query(
      `INSERT INTO refresh_tokens (user_id, token_hash, expires_at, ip_address, user_agent)
       VALUES (?, ?, ?, ?, ?)`,
      [userId, tokenHash, expiresAt, ipAddress || null, userAgent || null],
    );

    logger.debug("Refresh token generated", { userId, expiresAt });

    return { token, expiresAt };
  } catch (error: any) {
    logger.error("Failed to generate refresh token", {
      userId,
      error: error.message,
    });
    throw new AppError(500, "Failed to generate refresh token");
  }
};

/**
 * Verify and consume a refresh token
 * @param token - The refresh token to verify
 * @returns User ID if valid
 */
export const verifyRefreshToken = async (token: string): Promise<number> => {
  if (!token) {
    throw new AppError(401, "Refresh token is required");
  }

  try {
    // Get all non-revoked, non-expired tokens
    const [rows] = (await pool.query(
      `SELECT * FROM refresh_tokens 
       WHERE revoked_at IS NULL 
       AND expires_at > NOW()
       ORDER BY created_at DESC`,
    )) as any[];

    if (!Array.isArray(rows) || rows.length === 0) {
      throw new AppError(401, "Invalid or expired refresh token");
    }

    // Check each token hash (bcrypt compare is slow, but secure)
    for (const row of rows) {
      const isMatch = await bcrypt.compare(token, row.token_hash);
      if (isMatch) {
        logger.debug("Refresh token verified", {
          userId: row.user_id,
          tokenId: row.id,
        });
        return row.user_id;
      }
    }

    throw new AppError(401, "Invalid or expired refresh token");
  } catch (error: any) {
    if (error instanceof AppError) {
      throw error;
    }
    logger.error("Failed to verify refresh token", { error: error.message });
    throw new AppError(500, "Failed to verify refresh token");
  }
};

/**
 * Revoke a specific refresh token
 * @param token - The refresh token to revoke
 */
export const revokeRefreshToken = async (token: string): Promise<void> => {
  if (!token) {
    return;
  }

  try {
    // Get all non-revoked tokens
    const [rows] = (await pool.query(
      `SELECT * FROM refresh_tokens WHERE revoked_at IS NULL`,
    )) as any[];

    if (!Array.isArray(rows) || rows.length === 0) {
      return;
    }

    // Find matching token
    for (const row of rows) {
      const isMatch = await bcrypt.compare(token, row.token_hash);
      if (isMatch) {
        await pool.query(
          `UPDATE refresh_tokens SET revoked_at = NOW() WHERE id = ?`,
          [row.id],
        );
        logger.info("Refresh token revoked", {
          userId: row.user_id,
          tokenId: row.id,
        });
        return;
      }
    }
  } catch (error: any) {
    logger.error("Failed to revoke refresh token", { error: error.message });
    // Don't throw - revocation failure shouldn't block other operations
  }
};

/**
 * Revoke all refresh tokens for a user
 * @param userId - User ID
 */
export const revokeAllUserTokens = async (userId: number): Promise<void> => {
  try {
    const [result] = await pool.query(
      `UPDATE refresh_tokens 
       SET revoked_at = NOW() 
       WHERE user_id = ? AND revoked_at IS NULL`,
      [userId],
    );

    logger.info("All user refresh tokens revoked", {
      userId,
      count: (result as any).affectedRows,
    });
  } catch (error: any) {
    logger.error("Failed to revoke user tokens", {
      userId,
      error: error.message,
    });
    throw new AppError(500, "Failed to revoke tokens");
  }
};

/**
 * Get all active sessions for a user
 * @param userId - User ID
 * @returns Array of active sessions
 */
export const getUserActiveSessions = async (
  userId: number,
): Promise<
  Array<{
    id: number;
    created_at: Date;
    expires_at: Date;
    ip_address: string | null;
    user_agent: string | null;
  }>
> => {
  try {
    const [rows] = (await pool.query(
      `SELECT id, created_at, expires_at, ip_address, user_agent
       FROM refresh_tokens
       WHERE user_id = ? AND revoked_at IS NULL AND expires_at > NOW()
       ORDER BY created_at DESC`,
      [userId],
    )) as any[];

    return rows || [];
  } catch (error: any) {
    logger.error("Failed to get user sessions", {
      userId,
      error: error.message,
    });
    throw new AppError(500, "Failed to retrieve sessions");
  }
};

/**
 * Revoke a specific session by ID
 * @param userId - User ID (for security check)
 * @param sessionId - Session (refresh token) ID
 */
export const revokeSession = async (
  userId: number,
  sessionId: number,
): Promise<void> => {
  try {
    const [result] = await pool.query(
      `UPDATE refresh_tokens 
       SET revoked_at = NOW() 
       WHERE id = ? AND user_id = ? AND revoked_at IS NULL`,
      [sessionId, userId],
    );

    if ((result as any).affectedRows === 0) {
      throw new AppError(404, "Session not found or already revoked");
    }

    logger.info("Session revoked", { userId, sessionId });
  } catch (error: any) {
    if (error instanceof AppError) {
      throw error;
    }
    logger.error("Failed to revoke session", {
      userId,
      sessionId,
      error: error.message,
    });
    throw new AppError(500, "Failed to revoke session");
  }
};

/**
 * Clean up expired and revoked tokens (run periodically)
 * @param daysOld - Delete revoked tokens older than this many days
 * @returns Number of deleted tokens
 */
export const cleanupExpiredTokens = async (
  daysOld: number = 30,
): Promise<number> => {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const [result] = await pool.query(
      `DELETE FROM refresh_tokens 
       WHERE (expires_at < NOW() OR revoked_at < ?)`,
      [cutoffDate],
    );

    const deletedCount = (result as any).affectedRows;
    logger.info("Cleaned up expired refresh tokens", { deletedCount });

    return deletedCount;
  } catch (error: any) {
    logger.error("Failed to cleanup expired tokens", { error: error.message });
    return 0;
  }
};

// Run cleanup every 24 hours
setInterval(
  () => {
    cleanupExpiredTokens().catch((error) => {
      logger.error("Refresh token cleanup failed", { error: error.message });
    });
  },
  24 * 60 * 60 * 1000,
);
