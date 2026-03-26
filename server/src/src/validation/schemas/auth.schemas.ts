import { z } from "zod";

/**
 * Zod Validation Schemas for Authentication
 */

// Email validation schema
export const emailSchema = z
  .string()
  .min(1, "validation.emailRequired")
  .email("validation.invalidEmailFormat")
  .max(255, "validation.emailTooLong")
  .toLowerCase()
  .trim();

// Password validation schema (basic - detailed validation in passwordPolicy.ts)
export const passwordSchema = z
  .string()
  .min(8, "validation.passwordMinLength")
  .max(128, "validation.passwordMaxLength");

// Locale validation schema
export const localeSchema = z
  .string()
  .regex(/^[a-z]{2}(-[A-Z]{2})?$/, "validation.invalidLocaleFormat")
  .optional();

// Registration schema
export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  fullName: z
    .string()
    .min(2, "validation.fullNameMinLength")
    .max(100, "validation.fullNameTooLong")
    .trim(),
  artistRole: z.string().trim().max(100, "validation.roleTooLong").optional(),
  agreed: z
    .preprocess((value) => {
      if (typeof value === "boolean") return value;
      if (typeof value === "string") {
        const normalized = value.trim().toLowerCase();
        if (normalized === "true") return true;
        if (normalized === "false") return false;
      }
      return value;
    }, z.boolean())
    .optional(),
  preferredLocale: localeSchema,
});

export type RegisterInput = z.infer<typeof registerSchema>;

// Login schema
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "validation.passwordRequired"),
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
  token: z.string().min(1, "validation.resetTokenRequired"),
  newPassword: passwordSchema,
});

export type PasswordResetInput = z.infer<typeof passwordResetSchema>;

// Change password schema
export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "validation.currentPasswordRequired"),
    newPassword: passwordSchema,
    confirmPassword: z
      .string()
      .min(1, "validation.passwordConfirmationRequired"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "validation.passwordsDoNotMatch",
    path: ["confirmPassword"],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: "validation.newPasswordMustDiffer",
    path: ["newPassword"],
  });

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

// 2FA setup verification schema
export const verify2FASchema = z.object({
  token: z
    .string()
    .length(6, "validation.twoFactorCodeLength")
    .regex(/^\d{6}$/, "validation.twoFactorCodeDigits"),
});

export type Verify2FAInput = z.infer<typeof verify2FASchema>;

// 2FA authentication schema
export const authenticate2FASchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "validation.passwordRequired"),
  token: z
    .string()
    .length(6, "validation.twoFactorCodeLength")
    .regex(/^\d{6}$/, "validation.twoFactorCodeDigits"),
});

export type Authenticate2FAInput = z.infer<typeof authenticate2FASchema>;

// 2FA disable schema
export const disable2FASchema = z.object({
  password: z.string().min(1, "validation.passwordRequiredForVerification"),
  token: z
    .string()
    .length(6, "validation.twoFactorCodeLength")
    .regex(/^\d{6}$/, "validation.twoFactorCodeDigits")
    .optional(),
});

export type Disable2FAInput = z.infer<typeof disable2FASchema>;

// Token refresh schema
export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, "auth.refreshTokenRequired"),
});

export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
