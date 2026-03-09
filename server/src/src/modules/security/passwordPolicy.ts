/**
 * Password Policy Service
 * Enforces strong password requirements and validates against common passwords
 */

// Common passwords list (top 100 most common - in production, use full list of 10,000+)
const COMMON_PASSWORDS = new Set([
  "password",
  "123456",
  "123456789",
  "password123",
  "12345678",
  "12345",
  "1234567",
  "qwerty",
  "abc123",
  "111111",
  "123123",
  "admin",
  "letmein",
  "welcome",
  "monkey",
  "1234567890",
  "password1",
  "qwerty123",
  "1q2w3e4r",
  "123",
  "iloveyou",
  "sunshine",
  "princess",
  "admin123",
  "welcome123",
  "passw0rd",
  "password!",
  "12345678910",
  "dragon",
  "master",
  "football",
  "baseball",
  "shadow",
  "superman",
  "qazwsx",
  "trustno1",
  "000000",
  "starwars",
  "whatever",
  "batman",
  "zaq1zaq1",
  "qwertyuiop",
  "michael",
  "computer",
  "tigger",
  "password12",
  "hello123",
  "charlie",
  "ashley",
  "bailey",
  "freedom",
  "flower",
  "lovely",
  "hunter",
  "soccer",
  "harley",
  "ranger",
  "jordan",
  "george",
  "summer",
  "jessica",
  "pepper",
  "daniel",
  "orange",
  "killer",
  "aa123456",
  "zxcvbnm",
  "secret",
  "chocolate",
  "nicole",
  "hello",
  "buster",
  "guitar",
  "cheese",
  "access",
  "hockey",
  "angel",
  "ginger",
  "test123",
  "joshua",
  "maggie",
  "biteme",
  "mother",
  "andrew",
  "cookie",
  "thomas",
  "hannah",
  "lauren",
  "melissa",
  "dallas",
  "abcdef",
  "test",
  "qwerty1",
  "1234",
  "changeme",
]);

// Password policy configuration
export const PASSWORD_POLICY = {
  minLength: 8,
  maxLength: 128,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  requireSpecialChar: true,
  preventCommon: true,
  preventUserInfo: true,
};

export interface PasswordValidationResult {
  valid: boolean;
  errors: string[];
  strength: "weak" | "fair" | "good" | "strong" | "very-strong";
  score: number; // 0-100
}

/**
 * Validate password against policy
 * @param password - Password to validate
 * @param userInfo - Optional user information to prevent password reuse
 */
export const validatePassword = (
  password: string,
  userInfo?: { email?: string; fullName?: string },
): PasswordValidationResult => {
  const errors: string[] = [];
  let score = 0;

  // Check length
  if (!password || password.length < PASSWORD_POLICY.minLength) {
    errors.push(
      `Password must be at least ${PASSWORD_POLICY.minLength} characters long`,
    );
  } else {
    score += 10;
    // Bonus for longer passwords
    if (password.length >= 12) score += 10;
    if (password.length >= 16) score += 10;
  }

  if (password.length > PASSWORD_POLICY.maxLength) {
    errors.push(
      `Password must not exceed ${PASSWORD_POLICY.maxLength} characters`,
    );
  }

  // Check for uppercase letters
  if (PASSWORD_POLICY.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  } else if (/[A-Z]/.test(password)) {
    score += 15;
  }

  // Check for lowercase letters
  if (PASSWORD_POLICY.requireLowercase && !/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter");
  } else if (/[a-z]/.test(password)) {
    score += 15;
  }

  // Check for numbers
  if (PASSWORD_POLICY.requireNumber && !/\d/.test(password)) {
    errors.push("Password must contain at least one number");
  } else if (/\d/.test(password)) {
    score += 15;
  }

  // Check for special characters
  if (
    PASSWORD_POLICY.requireSpecialChar &&
    !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
  ) {
    errors.push(
      "Password must contain at least one special character (!@#$%^&* etc.)",
    );
  } else if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    score += 15;
  }

  // Check against common passwords
  if (PASSWORD_POLICY.preventCommon) {
    const lowerPassword = password.toLowerCase();
    if (COMMON_PASSWORDS.has(lowerPassword)) {
      errors.push(
        "This password is too common. Please choose a more unique password",
      );
      score = Math.max(0, score - 30);
    }
  }

  // Check for sequential or repeated characters
  if (/(.)\1{2,}/.test(password)) {
    errors.push(
      'Password should not contain repeated characters (e.g., "aaa", "111")',
    );
    score = Math.max(0, score - 10);
  }

  if (
    /(?:abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz|012|123|234|345|456|567|678|789)/i.test(
      password,
    )
  ) {
    errors.push(
      'Password should not contain sequential characters (e.g., "abc", "123")',
    );
    score = Math.max(0, score - 10);
  }

  // Check if password contains user information
  if (PASSWORD_POLICY.preventUserInfo && userInfo) {
    const lowerPassword = password.toLowerCase();

    if (userInfo.email) {
      const emailParts = userInfo.email.toLowerCase().split("@")[0];
      if (emailParts.length > 3 && lowerPassword.includes(emailParts)) {
        errors.push("Password should not contain parts of your email address");
        score = Math.max(0, score - 15);
      }
    }

    if (userInfo.fullName) {
      const nameParts = userInfo.fullName.toLowerCase().split(" ");
      for (const part of nameParts) {
        if (part.length > 2 && lowerPassword.includes(part)) {
          errors.push("Password should not contain parts of your name");
          score = Math.max(0, score - 15);
          break;
        }
      }
    }
  }

  // Bonus for character variety
  const charTypes = [
    /[a-z]/.test(password),
    /[A-Z]/.test(password),
    /\d/.test(password),
    /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
  ].filter(Boolean).length;

  score += charTypes * 5;

  // Ensure score is within bounds
  score = Math.max(0, Math.min(100, score));

  // Determine strength
  let strength: "weak" | "fair" | "good" | "strong" | "very-strong";
  if (score < 30) strength = "weak";
  else if (score < 50) strength = "fair";
  else if (score < 70) strength = "good";
  else if (score < 85) strength = "strong";
  else strength = "very-strong";

  return {
    valid: errors.length === 0,
    errors,
    strength,
    score,
  };
};

/**
 * Get password strength only (without validation errors)
 * Useful for real-time feedback while typing
 */
export const getPasswordStrength = (
  password: string,
): {
  strength: "weak" | "fair" | "good" | "strong" | "very-strong";
  score: number;
} => {
  const result = validatePassword(password);
  return {
    strength: result.strength,
    score: result.score,
  };
};

/**
 * Get password policy description for display to users
 */
export const getPasswordPolicyDescription = (): string[] => {
  const requirements: string[] = [];

  requirements.push(`At least ${PASSWORD_POLICY.minLength} characters long`);

  if (PASSWORD_POLICY.requireUppercase) {
    requirements.push("At least one uppercase letter (A-Z)");
  }

  if (PASSWORD_POLICY.requireLowercase) {
    requirements.push("At least one lowercase letter (a-z)");
  }

  if (PASSWORD_POLICY.requireNumber) {
    requirements.push("At least one number (0-9)");
  }

  if (PASSWORD_POLICY.requireSpecialChar) {
    requirements.push("At least one special character (!@#$%^&* etc.)");
  }

  if (PASSWORD_POLICY.preventCommon) {
    requirements.push("Not a common password");
  }

  return requirements;
};

/**
 * Check if password meets minimum requirements (for backward compatibility)
 * @deprecated Use validatePassword instead
 */
export const isPasswordStrong = (password: string): boolean => {
  const result = validatePassword(password);
  return result.valid;
};
