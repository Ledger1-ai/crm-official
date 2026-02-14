import { z } from "zod";

// We're keeping a simple non-relational schema here.
// IRL, you will have a schema for your data models.
export const taskSchema = z.object({
    id: z.string(),
    document_name: z.string(),
    document_file_url: z.string().nullable().optional(),
    document_file_mimeType: z.string().nullable().optional(),
    createdAt: z.date().nullable().optional(),
    description: z.string().nullable().optional(),
    assigned_to_user: z.object({
        name: z.string().nullable().optional(),
    }).nullable().optional(),
    assigned_to_board: z.object({
        id: z.string(),
        title: z.string(),
    }).nullable().optional(),
});

export type Task = z.infer<typeof taskSchema>;
