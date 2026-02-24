import { z } from "zod";

export const CreateLabelSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Invalid color format")
    .optional(),
});

export const UpdateLabelSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Invalid color format")
    .optional(),
});

export type CreateLabelInput = z.infer<typeof CreateLabelSchema>;
export type UpdateLabelInput = z.infer<typeof UpdateLabelSchema>;
