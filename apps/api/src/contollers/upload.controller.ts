import { Context } from "hono";
import { sanitizePathSegment, extFromType } from "../utils/r2.utils";
import { nanoid } from "nanoid";
import type { Env, Variables } from "../types/env";

class UploadController {
  static async upload(c: Context<{ Bindings: Env; Variables: Variables }>) {
    try {
      const userId = (c.req.header('X-User-Id') || 'anon').replace(/[^a-zA-Z0-9_-]/g, '');
  
      const contentType = c.req.header('content-type') || 'application/octet-stream';
      const contentLengthStr = c.req.header('content-length');
      const contentLength = contentLengthStr ? parseInt(contentLengthStr, 10) : 0;
  
      const MAX_SIZE = 5 * 1024 * 1024 * 1024; // 5GB
      if (contentLength > MAX_SIZE) {
        return c.json({ error: `File too large. Max ${MAX_SIZE} bytes` }, 413);
      }

      const allowedTypes = [
        'image/', 'video/', 'audio/', 
        'application/pdf', 'text/plain', 
        'application/octet-stream'
      ];
      const isAllowed = allowedTypes.some(type => contentType.startsWith(type));
      if (!isAllowed) {
        return c.json({ error: 'Invalid file type' }, 400);
      }
  
      // Build safe key
      const now = new Date();
      const yyyy = now.getFullYear();
      const mm = String(now.getMonth() + 1).padStart(2, '0');
      const prefix = sanitizePathSegment(c.req.query('prefix')) || 'uploads';
      const id = nanoid();
      const ext = extFromType(contentType);
      const key = `${prefix}/${userId}/${yyyy}-${mm}/${id}.${ext}`;
  
      // Stream body → R2
      const body = c.req.raw.body;
      if (!body) {
        return c.json({ error: 'No request body' }, 400);
      }
  
      // R2 accepts ReadableStream directly
      await c.env.R2.put(key, body, {
        httpMetadata: { contentType },
        customMetadata: { 
          userId,
          uploadedAt: now.toISOString(),
        },
      });
  
      const publicUrl = c.env.R2_PUBLIC_BASE_URL 
        ? `${c.env.R2_PUBLIC_BASE_URL}/${key}` 
        : null;
  
      return c.json(
        { 
          success: true, 
          key, 
          assetId: id,
          size: contentLength, 
          contentType, 
          publicUrl 
        },
        200
      );
    } catch (err: any) {
      console.error('Upload error:', err);
      return c.json({ error: err?.message || 'Upload failed' }, 500);
    }
  }
}

export { UploadController };