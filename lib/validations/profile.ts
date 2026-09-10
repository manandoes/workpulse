import { z } from "zod";

/**
 * Profile photo upload.
 *
 * The client resizes and re-encodes the image to a small JPEG data URL before
 * sending it (see `components/dashboard/avatar-upload.tsx`), so the server
 * only needs to check the shape and cap the size — it never processes image
 * bytes itself.
 */
const MAX_AVATAR_DATA_URL_LENGTH = 700_000; // ~500KB of image data, base64-inflated

export const avatarUploadSchema = z.object({
  avatarUrl: z
    .string()
    .trim()
    .max(MAX_AVATAR_DATA_URL_LENGTH, "That image is too large.")
    .regex(/^data:image\/(png|jpeg|webp);base64,/, "Expected an image."),
});

export type AvatarUploadInput = z.infer<typeof avatarUploadSchema>;
