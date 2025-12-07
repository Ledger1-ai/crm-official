import { z } from "zod";

// We're keeping a simple non-relational schema here.
// IRL, you will have a schema for your data models.
export const adminUserSchema = z.object({
  //TODO: fix all the types and nullable
  id: z.string(),
  created_on: z.union([z.string(), z.date()]),
  lastLoginAt: z.union([z.string(), z.date()]).nullable().optional(),
  is_admin: z.boolean(),
  name: z.string().nullable().optional(),
  email: z.string(),
  userStatus: z.string().optional(),
  userLanguage: z.string().optional(),
  team_role: z.string().nullable().optional(),
});

export type AdminUser = z.infer<typeof adminUserSchema>;
