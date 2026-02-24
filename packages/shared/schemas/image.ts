import { z } from "zod";

export const CreateImageSchema = z.object({
  title: z.string().max(500).optional(),
  storage_key: z.string().min(1, "Storage key is required"),
  url: z.string().url("Invalid URL format"),
  mime_type: z.string().optional(),
  size_bytes: z.number().optional(),
  width: z.number().optional(),
  height: z.number().optional(),
  labels: z.array(z.number()).optional(),
});

export const UpdateImageSchema = z.object({
  title: z.string().max(500).optional(),
  is_pinned: z.boolean().optional(),
  is_archived: z.boolean().optional(),
  labels: z.array(z.number()).optional(),
});

export type CreateImageInput = z.infer<typeof CreateImageSchema>;
export type UpdateImageInput = z.infer<typeof UpdateImageSchema>;
