import { z } from "zod";

export const CreateFileSchema = z.object({
  title: z.string().max(500).optional(),
  original_name: z.string().min(1, "Original name is required"),
  storage_key: z.string().min(1, "Storage key is required"),
  url: z.string().url("Invalid URL format"),
  mime_type: z.string().optional(),
  size_bytes: z.number().optional(),
  extension: z.string().max(20).optional(),
  labels: z.array(z.number()).optional(),
});

export const UpdateFileSchema = z.object({
  title: z.string().max(500).optional(),
  is_pinned: z.boolean().optional(),
  is_archived: z.boolean().optional(),
  labels: z.array(z.number()).optional(),
});

export type CreateFileInput = z.infer<typeof CreateFileSchema>;
export type UpdateFileInput = z.infer<typeof UpdateFileSchema>;
