import { z } from "zod";

export const updateUserSchema = z.object({
  body: z.object({
    name: z.string().min(2).optional(),
    email: z.string().email().optional(),
  }),
});

export const userIdParamSchema = z.object({
  params: z.object({
    id: z.string().uuid("Invalid user ID"),
  }),
});

export type UpdateUserInput = z.infer<typeof updateUserSchema>["body"];