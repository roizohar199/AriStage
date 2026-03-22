import { z } from "zod";
import { emailSchema, passwordSchema } from "./auth.schemas";

const optionalTrimmedString = (max: number) =>
  z.string().trim().max(max).optional().or(z.literal(""));

const positiveIdSchema = z.coerce
  .number()
  .int()
  .positive("validation.userIdPositive");

export const lineupMutationSchema = z.object({
  title: z.string().trim().min(1, "lineups.titleRequired").max(255),
  date: z.string().trim().max(64).optional().or(z.literal("")),
  time: z.string().trim().max(64).optional().or(z.literal("")),
  location: optionalTrimmedString(255),
  description: optionalTrimmedString(5000),
});

export const lineupDownloadChartsSchema = z.object({
  charts: z
    .array(
      z.object({
        songTitle: z.string().trim().max(255).optional(),
        artist: z.string().trim().max(255).optional(),
        key_sig: z.string().trim().max(64).optional(),
        bpm: z.union([z.string().trim().max(32), z.number()]).optional(),
        duration: z.string().trim().max(64).optional(),
        chartUrl: z.string().trim().max(2048).optional(),
      }),
    )
    .min(1, "lineups.noChartsToDownload"),
});

export const lineupSongCreateSchema = z.object({
  song_id: positiveIdSchema,
});

export const lineupSongReorderSchema = z.object({
  songs: z.array(positiveIdSchema).min(1, "lineupSongs.invalidSongsArray"),
});

export const userPasswordChangeSchema = z.object({
  newPass: passwordSchema,
});

export const supportContactSchema = z.object({
  full_name: z.string().trim().min(2, "validation.fullNameMinLength").max(100),
  email: emailSchema,
  phone: z.string().trim().min(5, "validation.invalidPhoneFormat").max(32),
  subject: z.string().trim().min(1, "validation.fieldRequired").max(200),
  message: z.string().trim().min(1, "validation.fieldRequired").max(5000),
});
