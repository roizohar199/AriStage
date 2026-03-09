/**
 * Account Lockout Service
 * Tracks failed login attempts and locks accounts to prevent brute-force attacks
 */

interface LoginAttempt {
  count: number;
  firstAttempt: Date;
  lockedUntil?: Date;
}

// In-memory store for failed login attempts
// In production, consider using Redis for distributed systems
const loginAttempts = new Map<string, LoginAttempt>();

// Configuration
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes
const ATTEMPT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

/**
 * Record a failed login attempt
 * @param identifier - Email or IP address
 * @returns True if account should be locked
 */
export const recordFailedAttempt = (identifier: string): boolean => {
  const key = identifier.toLowerCase();
  const now = new Date();
  const attempt = loginAttempts.get(key);

  if (!attempt) {
    // First failed attempt
    loginAttempts.set(key, {
      count: 1,
      firstAttempt: now,
    });
    return false;
  }

  // Check if attempt window has expired
  const timeSinceFirst = now.getTime() - attempt.firstAttempt.getTime();
  if (timeSinceFirst > ATTEMPT_WINDOW_MS) {
    // Reset the counter
    loginAttempts.set(key, {
      count: 1,
      firstAttempt: now,
    });
    return false;
  }

  // Increment failed attempts
  attempt.count++;

  // Check if we should lock the account
  if (attempt.count >= MAX_FAILED_ATTEMPTS) {
    attempt.lockedUntil = new Date(now.getTime() + LOCKOUT_DURATION_MS);
    return true;
  }

  return false;
};

/**
 * Check if an account is currently locked
 * @param identifier - Email or IP address
 * @returns Object with locked status and time remaining
 */
export const isAccountLocked = (
  identifier: string,
): {
  locked: boolean;
  remainingTime?: number;
  attemptsRemaining?: number;
} => {
  const key = identifier.toLowerCase();
  const attempt = loginAttempts.get(key);

  if (!attempt) {
    return { locked: false, attemptsRemaining: MAX_FAILED_ATTEMPTS };
  }

  const now = new Date();

  // Check if lockout period has expired
  if (attempt.lockedUntil) {
    if (now < attempt.lockedUntil) {
      const remainingTime = attempt.lockedUntil.getTime() - now.getTime();
      return {
        locked: true,
        remainingTime: Math.ceil(remainingTime / 1000), // seconds
      };
    } else {
      // Lockout expired, clear the entry
      loginAttempts.delete(key);
      return { locked: false, attemptsRemaining: MAX_FAILED_ATTEMPTS };
    }
  }

  // Check if attempt window has expired
  const timeSinceFirst = now.getTime() - attempt.firstAttempt.getTime();
  if (timeSinceFirst > ATTEMPT_WINDOW_MS) {
    // Reset the counter
    loginAttempts.delete(key);
    return { locked: false, attemptsRemaining: MAX_FAILED_ATTEMPTS };
  }

  // Return remaining attempts
  const attemptsRemaining = MAX_FAILED_ATTEMPTS - attempt.count;
  return {
    locked: false,
    attemptsRemaining: Math.max(0, attemptsRemaining),
  };
};

/**
 * Clear failed attempts for an account (called on successful login)
 * @param identifier - Email or IP address
 */
export const clearFailedAttempts = (identifier: string): void => {
  const key = identifier.toLowerCase();
  loginAttempts.delete(key);
};

/**
 * Get all currently locked accounts (for admin dashboard)
 * @returns Array of locked accounts with details
 */
export const getLockedAccounts = (): Array<{
  identifier: string;
  failedAttempts: number;
  lockedUntil: Date;
  remainingTime: number;
}> => {
  const now = new Date();
  const locked: Array<{
    identifier: string;
    failedAttempts: number;
    lockedUntil: Date;
    remainingTime: number;
  }> = [];

  loginAttempts.forEach((attempt, identifier) => {
    if (attempt.lockedUntil && now < attempt.lockedUntil) {
      locked.push({
        identifier,
        failedAttempts: attempt.count,
        lockedUntil: attempt.lockedUntil,
        remainingTime: Math.ceil(
          (attempt.lockedUntil.getTime() - now.getTime()) / 1000,
        ),
      });
    }
  });

  return locked;
};

/**
 * Manually unlock an account (admin function)
 * @param identifier - Email or IP address
 */
export const unlockAccount = (identifier: string): boolean => {
  const key = identifier.toLowerCase();
  const attempt = loginAttempts.get(key);

  if (attempt) {
    loginAttempts.delete(key);
    return true;
  }

  return false;
};

/**
 * Get lockout configuration (for display to users)
 */
export const getLockoutConfig = () => ({
  maxAttempts: MAX_FAILED_ATTEMPTS,
  lockoutDuration: LOCKOUT_DURATION_MS / 1000 / 60, // minutes
  attemptWindow: ATTEMPT_WINDOW_MS / 1000 / 60, // minutes
});

/**
 * Clean up expired entries (should be called periodically)
 */
export const cleanupExpiredEntries = (): number => {
  const now = new Date();
  let cleaned = 0;

  loginAttempts.forEach((attempt, identifier) => {
    // Remove if lockout expired or attempt window expired
    const lockoutExpired = attempt.lockedUntil && now > attempt.lockedUntil;
    const windowExpired =
      !attempt.lockedUntil &&
      now.getTime() - attempt.firstAttempt.getTime() > ATTEMPT_WINDOW_MS;

    if (lockoutExpired || windowExpired) {
      loginAttempts.delete(identifier);
      cleaned++;
    }
  });

  return cleaned;
};

// Run cleanup every 5 minutes
setInterval(cleanupExpiredEntries, 5 * 60 * 1000);
