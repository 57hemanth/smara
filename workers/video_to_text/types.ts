import { DurableObjectNamespace, Queue, R2Bucket, D1Database } from "@cloudflare/workers-types";

export interface Env {
    VIDEO_CONTAINER: DurableObjectNamespace;
    R2: R2Bucket;
    DB: D1Database;
    IMAGE_QUEUE: Queue;
    AUDIO_QUEUE: Queue;
}

export interface VideoProcessPayload {
    asset_id: string;
    user_id: string;
    folder_id: string;
    r2_key: string;
    mime: string;
}