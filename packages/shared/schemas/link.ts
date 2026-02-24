import { z } from "zod";

export const CreateLinkSchema = z.object({
  url: z.string().url("Invalid URL format"),
  title: z.string().max(500).optional(),
  description: z.string().optional(),
  thumbnail_url: z.string().url().optional(),
  favicon_url: z.string().url().optional(),
  labels: z.array(z.number()).optional(),
});

export const UpdateLinkSchema = z.object({
  url: z.string().url("Invalid URL format").optional(),
  title: z.string().max(500).optional(),
  description: z.string().optional(),
  thumbnail_url: z.string().url().optional(),
  favicon_url: z.string().url().optional(),
  is_pinned: z.boolean().optional(),
  is_archived: z.boolean().optional(),
  labels: z.array(z.number()).optional(),
});

export type CreateLinkInput = z.infer<typeof CreateLinkSchema>;
export type UpdateLinkInput = z.infer<typeof UpdateLinkSchema>;
