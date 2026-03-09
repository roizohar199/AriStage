import { z } from "zod";

/**
 * Zod Validation Schemas for Authentication
 */

// Email validation schema
export const emailSchema = z
  .string()
  .min(1, "Email is required")
  .email("Invalid email format")
  .max(255, "Email is too long")
  .toLowerCase()
  .trim();

// Password validation schema (basic - detailed validation in passwordPolicy.ts)
export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128, "Password must not exceed 128 characters");

// Locale validation schema
export const localeSchema = z
  .string()
  .regex(
    /^[a-z]{2}(-[A-Z]{2})?$/,
    "Invalid locale format (expected: en, he, en-US, he-IL)",
  )
  .optional();

// Registration schema
export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  fullName: z
    .string()
    .min(2, "Full name must be at least 2 characters")
    .max(100, "Full name is too long")
    .trim(),
  preferredLocale: localeSchema,
});

export type RegisterInput = z.infer<typeof registerSchema>;

// Login schema
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
});

export type LoginInput = z.infer<typeof loginSchema>;

// Password reset request schema
export const passwordResetRequestSchema = z.object({
  email: emailSchema,
});

export type PasswordResetRequestInput = z.infer<
  typeof passwordResetRequestSchema
>;

// Password reset schema
export const passwordResetSchema = z.object({
  token: z.string().min(1, "Reset token is required"),
  newPassword: passwordSchema,
});

export type PasswordResetInput = z.infer<typeof passwordResetSchema>;

// Change password schema
export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: passwordSchema,
    confirmPassword: z.string().min(1, "Password confirmation is required"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: "New password must be different from current password",
    path: ["newPassword"],
  });

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

// 2FA setup verification schema
export const verify2FASchema = z.object({
  token: z
    .string()
    .length(6, "2FA code must be 6 digits")
    .regex(/^\d{6}$/, "2FA code must contain only digits"),
});

export type Verify2FAInput = z.infer<typeof verify2FASchema>;

// 2FA authentication schema
export const authenticate2FASchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
  token: z
    .string()
    .length(6, "2FA code must be 6 digits")
    .regex(/^\d{6}$/, "2FA code must contain only digits"),
});

export type Authenticate2FAInput = z.infer<typeof authenticate2FASchema>;

// 2FA disable schema
export const disable2FASchema = z.object({
  password: z.string().min(1, "Password is required for verification"),
  token: z
    .string()
    .length(6, "2FA code must be 6 digits")
    .regex(/^\d{6}$/, "2FA code must contain only digits")
    .optional(),
});

export type Disable2FAInput = z.infer<typeof disable2FASchema>;

// Token refresh schema
export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token is required"),
});

export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
