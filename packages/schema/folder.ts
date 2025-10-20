import { z } from "zod";

export const folderSchema = z.object({
    id: z.string(),
    name: z.string(),
    user_id: z.string(),
    created_at: z.string(),
    updated_at: z.string(),
});

export type Folder = z.infer<typeof folderSchema>;