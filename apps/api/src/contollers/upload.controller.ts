import { Context } from "hono";
import { sanitizePathSegment, extFromType, modalityFromType } from "../utils/r2.utils";
import { nanoid } from "nanoid";
import type { Env, Variables } from "../types/env";

/**
 * YouTube URL validation utilities
 */
function isYoutubeUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.includes('youtube.com') || urlObj.hostname === 'youtu.be';
  } catch {
    return false;
  }
}

function getYoutubeVideoId(url: string): string | null {
  try {
    const urlObj = new URL(url);
    
    if (urlObj.hostname === 'youtu.be') {
      return urlObj.pathname.slice(1).split('?')[0];
    }
    
    if (urlObj.hostname.includes('youtube.com')) {
      const vParam = urlObj.searchParams.get('v');
      if (vParam) return vParam;
      
      const embedMatch = urlObj.pathname.match(/\/embed\/([^/?]+)/);
      if (embedMatch) return embedMatch[1];
      
      const vMatch = urlObj.pathname.match(/\/v\/([^/?]+)/);
      if (vMatch) return vMatch[1];
    }
    
    return null;
  } catch {
    return null;
  }
}

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

      const modality = modalityFromType(contentType);

      // Publish to queue
      await c.env.INGEST_QUEUE.send({ r2_key: key, user_id: userId, mime: contentType, modality: modality, asset_id: id });
      
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

  static async uploadUrl(c: Context<{ Bindings: Env; Variables: Variables }>) {
    try {
      const userId = (c.req.header('X-User-Id') || 'anon').replace(/[^a-zA-Z0-9_-]/g, '');
      
      // Parse request body
      const body = await c.req.json();
      const { url } = body;

      if (!url || typeof url !== 'string') {
        return c.json({ error: 'URL is required' }, 400);
      }

      // Validate YouTube URL
      if (!isYoutubeUrl(url)) {
        return c.json({ error: 'Only YouTube URLs are supported' }, 400);
      }

      const videoId = getYoutubeVideoId(url);
      if (!videoId) {
        return c.json({ error: 'Invalid YouTube URL format' }, 400);
      }

      // Build metadata
      const now = new Date();
      const yyyy = now.getFullYear();
      const mm = String(now.getMonth() + 1).padStart(2, '0');
      const id = nanoid();
      const key = `links/${userId}/${yyyy}-${mm}/${id}.json`;

      // Create minimal metadata object
      const metadata = {
        url,
        type: 'youtube',
        video_id: videoId,
        captured_at: now.toISOString()
      };

      // Store metadata in R2
      await c.env.R2.put(key, JSON.stringify(metadata), {
        httpMetadata: { 
          contentType: 'application/json' 
        },
        customMetadata: {
          userId,
          uploadedAt: now.toISOString(),
          videoId
        }
      });

      // Publish to queue with link modality
      await c.env.INGEST_QUEUE.send({ 
        r2_key: key, 
        user_id: userId, 
        mime: 'application/json', 
        modality: 'link',
        asset_id: id,
        url: url  // Pass URL to the queue message
      });

      return c.json(
        {
          success: true,
          key,
          assetId: id,
          size: JSON.stringify(metadata).length,
          contentType: 'application/json',
          publicUrl: url  // Return original YouTube URL as "public URL"
        },
        200
      );
    } catch (err: any) {
      console.error('URL upload error:', err);
      return c.json({ error: err?.message || 'URL upload failed' }, 500);
    }
  }
}

export { UploadController };