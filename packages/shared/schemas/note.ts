import { z } from "zod";

export const CreateNoteSchema = z.object({
  title: z.string().max(500).optional(),
  body: z.string().optional(),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Invalid color format")
    .optional(),
  labels: z.array(z.number()).optional(),
});

export const UpdateNoteSchema = z.object({
  title: z.string().max(500).optional(),
  body: z.string().optional(),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Invalid color format")
    .optional(),
  is_pinned: z.boolean().optional(),
  is_archived: z.boolean().optional(),
  labels: z.array(z.number()).optional(),
});

export type CreateNoteInput = z.infer<typeof CreateNoteSchema>;
export type UpdateNoteInput = z.infer<typeof UpdateNoteSchema>;
