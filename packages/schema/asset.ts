import { z } from "zod";

export const assetSchema = z.object({
    id: z.string(),
    user_id: z.string(),
    workspace_id: z.string(),
    url: z.string(),
    r2_key: z.string(),
    mime: z.string(),
    modality: z.enum(['image', 'audio', 'video', 'text', 'link']),
    created_at: z.string(),
    updated_at: z.string(),
});

export type Asset = z.infer<typeof assetSchema>;