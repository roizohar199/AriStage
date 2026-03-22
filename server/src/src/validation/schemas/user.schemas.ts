import { z } from "zod";

/**
 * Zod Validation Schemas for User Management
 */

// User ID validation
export const userIdSchema = z.coerce
  .number()
  .int()
  .positive("validation.userIdPositive");

// Full name validation
export const fullNameSchema = z
  .string()
  .min(2, "validation.fullNameMinLength")
  .max(100, "validation.fullNameTooLong")
  .trim();

// Email validation
export const emailSchema = z
  .string()
  .email("validation.invalidEmailFormat")
  .max(255, "validation.emailTooLong")
  .toLowerCase()
  .trim();

// Phone number validation (international format)
export const phoneSchema = z
  .string()
  .regex(/^\+?[1-9]\d{1,14}$/, "validation.invalidPhoneFormat")
  .optional();

// Artist role validation
export const artistRoleSchema = z
  .enum(["musician", "singer", "band_leader", "dj", "other"])
  .optional();

// Theme validation
export const themeSchema = z.enum(["light", "dark", "system"]).optional();

// Locale validation
export const localeSchema = z
  .string()
  .regex(/^[a-z]{2}(-[A-Z]{2})?$/, "validation.invalidLocaleFormat")
  .optional();

// Role validation (admin only)
export const roleSchema = z.enum(["user", "manager", "admin"]).optional();

// Profile update schema
export const updateProfileSchema = z.object({
  fullName: fullNameSchema.optional(),
  artistRole: artistRoleSchema,
  theme: themeSchema,
  preferredLocale: localeSchema,
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

// Admin user update schema (includes role)
export const adminUpdateUserSchema = z.object({
  fullName: fullNameSchema.optional(),
  email: emailSchema.optional(),
  role: roleSchema,
  artistRole: artistRoleSchema,
  theme: themeSchema,
  preferredLocale: localeSchema,
});

export type AdminUpdateUserInput = z.infer<typeof adminUpdateUserSchema>;

// Avatar upload validation
export const avatarFileSchema = z.object({
  mimetype: z
    .string()
    .refine(
      (type) =>
        [
          "image/jpeg",
          "image/jpg",
          "image/png",
          "image/gif",
          "image/webp",
        ].includes(type),
      "validation.avatarImageOnly",
    ),
  size: z.number().max(5 * 1024 * 1024, "validation.avatarFileTooLarge"),
});

// User search/filter schema
export const userSearchSchema = z.object({
  search: z.string().max(100).optional(),
  role: roleSchema,
  artistRole: artistRoleSchema,
  subscriptionStatus: z.enum(["trial", "active", "expired", "all"]).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z
    .enum(["created_at", "full_name", "email", "last_seen_at"])
    .optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
});

export type UserSearchInput = z.infer<typeof userSearchSchema>;

// User invitation schema
export const inviteUserSchema = z.object({
  email: emailSchema,
  role: z.enum(["user", "manager"]),
  artistRole: artistRoleSchema,
});

export type InviteUserInput = z.infer<typeof inviteUserSchema>;

// Bulk user action schema
export const bulkUserActionSchema = z.object({
  userIds: z
    .array(userIdSchema)
    .min(1, "validation.atLeastOneUserId")
    .max(100, "validation.tooManyUsersSelected"),
  action: z.enum(["delete", "activate", "deactivate", "change_role"]),
  role: roleSchema, // Only required for 'change_role' action
});

export type BulkUserActionInput = z.infer<typeof bulkUserActionSchema>;
