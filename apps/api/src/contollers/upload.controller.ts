import { Context } from "hono";
import { sanitizePathSegment, extFromType, modalityFromType } from "../utils/r2.utils";
import { nanoid } from "nanoid";
import type { Env, Variables } from "../types/env";
import { createDbClient, WorkspaceRepository, AssetRepository } from "@smara/database";

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
  /**
   * Helper to get or create workspace for user by name
   */
  private static async getOrCreateWorkspace(db: any, userId: string, workspaceName: string = 'My Workspace'): Promise<string> {
    const workspaceRepo = new WorkspaceRepository(db);
    
    // Try to find existing workspace by name
    const existingWorkspace = await workspaceRepo.findByUserIdAndName(userId, workspaceName);
    if (existingWorkspace) {
      return existingWorkspace.id;
    }
    
    // Create new workspace with specified name
    const workspace = await workspaceRepo.create({
      id: nanoid(),
      name: workspaceName,
      user_id: userId,
    });
    
    return workspace.id;
  }

  /**
   * Calculate SHA-256 hash from ReadableStream
   */
  private static async calculateHash(data: Uint8Array): Promise<string> {
    const hashBuffer = await crypto.subtle.digest('SHA-256', data as Uint8Array<ArrayBuffer>);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  static async upload(c: Context<{ Bindings: Env; Variables: Variables }>) {
    try {
      const userId = (c.req.header('X-User-Id') || 'anon').replace(/[^a-zA-Z0-9_-]/g, '');
      const workspaceName = c.req.header('X-Workspace') || 'My Workspace';
  
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
  
      // Read body as array buffer for hashing
      const body = c.req.raw.body;
      if (!body) {
        return c.json({ error: 'No request body' }, 400);
      }

      // Read stream to buffer (needed for hash calculation)
      const reader = body.getReader();
      const chunks: Uint8Array[] = [];
      let totalBytes = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
        totalBytes += value.length;
      }

      const fileData = new Uint8Array(totalBytes);
      let offset = 0;
      for (const chunk of chunks) {
        fileData.set(chunk, offset);
        offset += chunk.length;
      }

      // Calculate hash
      const sha256 = await UploadController.calculateHash(fileData);

      // Initialize database
      const db = createDbClient(c.env.DB);
      const assetRepo = new AssetRepository(db);

      // Get or create workspace by name
      const workspaceId = await UploadController.getOrCreateWorkspace(db, userId, workspaceName);

      // Check for duplicate (same hash for same user)
      const existingAsset = await assetRepo.findBySha256(sha256, userId);
      if (existingAsset) {
        const publicUrl = c.env.R2_PUBLIC_BASE_URL 
          ? `${c.env.R2_PUBLIC_BASE_URL}/${existingAsset.r2_key}` 
          : null;
        
        return c.json({
          success: true,
          duplicate: true,
          key: existingAsset.r2_key,
          assetId: existingAsset.id,
          size: existingAsset.bytes,
          contentType: existingAsset.mime,
          publicUrl
        }, 200);
      }
  
      // Upload to R2
      await c.env.R2.put(key, fileData, {
        httpMetadata: { contentType },
        customMetadata: { 
          userId,
          uploadedAt: now.toISOString(),
        },
      });
  
      const publicUrl = c.env.R2_PUBLIC_BASE_URL 
        ? `${c.env.R2_PUBLIC_BASE_URL}/${key}` 
        : null;

      const modality = modalityFromType(contentType) as 'image' | 'audio' | 'video' | 'text' | 'link';

      // Create asset record in D1
      await assetRepo.create({
        id,
        user_id: userId,
        workspace_id: workspaceId,
        r2_key: key,
        mime: contentType,
        modality,
        bytes: totalBytes,
        sha256,
        source: 'web',
        status: 'pending',
      });

      // Publish to queue with workspace_id
      await c.env.INGEST_QUEUE.send({ 
        r2_key: key, 
        user_id: userId, 
        workspace_id: workspaceId,
        mime: contentType, 
        modality: modality, 
        asset_id: id 
      });
      
      return c.json(
        { 
          success: true, 
          key, 
          assetId: id,
          size: totalBytes, 
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
      const workspaceName = c.req.header('X-Workspace') || 'My Workspace';
      
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

      const metadataStr = JSON.stringify(metadata);
      const metadataBytes = new TextEncoder().encode(metadataStr);
      
      // Calculate hash from URL (for deduplication)
      const sha256 = await UploadController.calculateHash(metadataBytes);

      // Initialize database
      const db = createDbClient(c.env.DB);
      const assetRepo = new AssetRepository(db);

      // Get or create workspace by name
      const workspaceId = await UploadController.getOrCreateWorkspace(db, userId, workspaceName);

      // Check for duplicate URL
      const existingAsset = await assetRepo.findBySha256(sha256, userId);
      if (existingAsset) {
        return c.json({
          success: true,
          duplicate: true,
          key: existingAsset.r2_key,
          assetId: existingAsset.id,
          size: existingAsset.bytes,
          contentType: existingAsset.mime,
          publicUrl: url
        }, 200);
      }

      // Store metadata in R2
      await c.env.R2.put(key, metadataStr, {
        httpMetadata: { 
          contentType: 'application/json' 
        },
        customMetadata: {
          userId,
          uploadedAt: now.toISOString(),
          videoId
        }
      });

      // Create asset record in D1
      await assetRepo.create({
        id,
        user_id: userId,
        workspace_id: workspaceId,
        r2_key: key,
        mime: 'application/json',
        modality: 'link',
        bytes: metadataBytes.length,
        sha256,
        source: 'web',
        source_url: url,
        status: 'pending',
      });

      // Publish to queue with link modality and workspace_id
      await c.env.INGEST_QUEUE.send({ 
        r2_key: key, 
        user_id: userId, 
        workspace_id: workspaceId,
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
          size: metadataBytes.length,
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