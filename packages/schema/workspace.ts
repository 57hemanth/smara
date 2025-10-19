import { z } from "zod";

export const workspaceSchema = z.object({
    id: z.string(),
    name: z.string(),
    user_id: z.string(),
    created_at: z.string(),
    updated_at: z.string(),
});

export type Workspace = z.infer<typeof workspaceSchema>;