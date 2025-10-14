// Cloudflare Worker Environment Bindings
export interface Env {
  // R2 Storage
  R2: R2Bucket;
  INGEST_QUEUE: Queue;
  
  // Environment Variables (from wrangler.jsonc vars)
  ALLOWED_ORIGINS?: string;
  R2_PUBLIC_BASE_URL?: string;
}

// Hono Context Variables (for middleware to pass data)
export interface Variables {
  user_id?: string;
  request_id: string;
}