import { Context } from "hono";
import { nanoid } from "nanoid";
import type { Env, Variables } from "../types/env";
import { createDbClient, FolderRepository, AssetRepository } from "@smara/database";

class FolderController {
  /**
   * Get all folders for the authenticated user
   */
  static async getFolders(c: Context<{ Bindings: Env; Variables: Variables }>) {
    try {
      const userId = (c.req.header('X-User-Id') || 'anon').replace(/[^a-zA-Z0-9_-]/g, '');
      
      if (!userId || userId === 'anon') {
        return c.json({ error: 'User ID is required' }, 401);
      }

      // Initialize database
      const db = createDbClient(c.env.DB);
      const folderRepo = new FolderRepository(db);

      // Get all folders for the user
      const folders = await folderRepo.findByUserId(userId);

      return c.json({
        success: true,
        folders
      }, 200);
    } catch (err: any) {
      console.error('Get folders error:', err);
      return c.json({ error: err?.message || 'Failed to fetch folders' }, 500);
    }
  }

  /**
   * Create a new folder for the authenticated user
   */
  static async createFolder(c: Context<{ Bindings: Env; Variables: Variables }>) {
    try {
      const userId = (c.req.header('X-User-Id') || 'anon').replace(/[^a-zA-Z0-9_-]/g, '');
      
      if (!userId || userId === 'anon') {
        return c.json({ error: 'User ID is required' }, 401);
      }

      // Parse request body
      const body = await c.req.json();
      const { name } = body;

      if (!name || typeof name !== 'string' || name.trim().length === 0) {
        return c.json({ error: 'Folder name is required' }, 400);
      }

      const folderName = name.trim();
      
      if (folderName.length > 100) {
        return c.json({ error: 'Folder name must be 100 characters or less' }, 400);
      }

      // Initialize database
      const db = createDbClient(c.env.DB);
      const folderRepo = new FolderRepository(db);

      // Check if folder with this name already exists for the user
      const existingFolder = await folderRepo.findByUserIdAndName(userId, folderName);
      if (existingFolder) {
        return c.json({ error: 'A folder with this name already exists' }, 409);
      }

      // Create new folder
      const folder = await folderRepo.create({
        id: nanoid(),
        name: folderName,
        user_id: userId,
      });

      return c.json({
        success: true,
        folder
      }, 201);
    } catch (err: any) {
      console.error('Create folder error:', err);
      return c.json({ error: err?.message || 'Failed to create folder' }, 500);
    }
  }

  /**
   * Update a folder (rename)
   */
  static async updateFolder(c: Context<{ Bindings: Env; Variables: Variables }>) {
    try {
      const userId = (c.req.header('X-User-Id') || 'anon').replace(/[^a-zA-Z0-9_-]/g, '');
      const folderId = c.req.param('id');
      
      if (!userId || userId === 'anon') {
        return c.json({ error: 'User ID is required' }, 401);
      }

      if (!folderId) {
        return c.json({ error: 'Folder ID is required' }, 400);
      }

      // Parse request body
      const body = await c.req.json();
      const { name } = body;

      if (!name || typeof name !== 'string' || name.trim().length === 0) {
        return c.json({ error: 'Folder name is required' }, 400);
      }

      const folderName = name.trim();
      
      if (folderName.length > 100) {
        return c.json({ error: 'Folder name must be 100 characters or less' }, 400);
      }

      // Initialize database
      const db = createDbClient(c.env.DB);
      const folderRepo = new FolderRepository(db);

      // Check if folder exists and belongs to user
      const existingFolder = await folderRepo.findById(folderId);
      if (!existingFolder) {
        return c.json({ error: 'Folder not found' }, 404);
      }

      if (existingFolder.user_id !== userId) {
        return c.json({ error: 'Unauthorized' }, 403);
      }

      // Check if another folder with this name already exists for the user
      const duplicateFolder = await folderRepo.findByUserIdAndName(userId, folderName);
      if (duplicateFolder && duplicateFolder.id !== folderId) {
        return c.json({ error: 'A folder with this name already exists' }, 409);
      }

      // Update folder
      const updatedFolder = await folderRepo.update(folderId, {
        name: folderName,
      });

      return c.json({
        success: true,
        folder: updatedFolder
      }, 200);
    } catch (err: any) {
      console.error('Update folder error:', err);
      return c.json({ error: err?.message || 'Failed to update folder' }, 500);
    }
  }

  /**
   * Delete a folder
   */
  static async deleteFolder(c: Context<{ Bindings: Env; Variables: Variables }>) {
    try {
      const userId = (c.req.header('X-User-Id') || 'anon').replace(/[^a-zA-Z0-9_-]/g, '');
      const folderId = c.req.param('id');
      
      if (!userId || userId === 'anon') {
        return c.json({ error: 'User ID is required' }, 401);
      }

      if (!folderId) {
        return c.json({ error: 'Folder ID is required' }, 400);
      }

      // Initialize database
      const db = createDbClient(c.env.DB);
      const folderRepo = new FolderRepository(db);

      // Check if folder exists and belongs to user
      const existingFolder = await folderRepo.findById(folderId);
      if (!existingFolder) {
        return c.json({ error: 'Folder not found' }, 404);
      }

      if (existingFolder.user_id !== userId) {
        return c.json({ error: 'Unauthorized' }, 403);
      }

      // Delete folder (cascade will handle assets)
      await folderRepo.delete(folderId);

      return c.json({
        success: true,
        message: 'Folder deleted successfully'
      }, 200);
    } catch (err: any) {
      console.error('Delete folder error:', err);
      return c.json({ error: err?.message || 'Failed to delete folder' }, 500);
    }
  }

  /**
   * Get all assets for a specific folder
   */
  static async getFolderAssets(c: Context<{ Bindings: Env; Variables: Variables }>) {
    try {
      const userId = (c.req.header('X-User-Id') || 'anon').replace(/[^a-zA-Z0-9_-]/g, '');
      const folderId = c.req.param('id');
      
      if (!userId || userId === 'anon') {
        return c.json({ error: 'User ID is required' }, 401);
      }

      if (!folderId) {
        return c.json({ error: 'Folder ID is required' }, 400);
      }

      // Parse query parameters
      const limit = parseInt(c.req.query('limit') || '100', 10);
      const offset = parseInt(c.req.query('offset') || '0', 10);

      // Initialize database
      const db = createDbClient(c.env.DB);
      const folderRepo = new FolderRepository(db);
      const assetRepo = new AssetRepository(db);

      // Check if folder exists and belongs to user
      const existingFolder = await folderRepo.findById(folderId);
      if (!existingFolder) {
        return c.json({ error: 'Folder not found' }, 404);
      }

      if (existingFolder.user_id !== userId) {
        return c.json({ error: 'Unauthorized' }, 403);
      }

      // Get assets for the folder
      const assets = await assetRepo.findByFolderId(folderId, limit, offset);

      // Add preview URLs to assets (same logic as search controller)
      const assetsWithPreviews = assets.map(asset => {
        let preview: string | undefined;

        // For link modality, use source_url (YouTube links)
        if (asset.modality === 'link' && asset.source_url) {
          preview = asset.source_url;
        }
        // For other modalities, generate R2 public URL
        else if (asset.r2_key && c.env.R2_PUBLIC_BASE_URL) {
          try {
            preview = `${c.env.R2_PUBLIC_BASE_URL}/${asset.r2_key}`;
          } catch (error) {
            console.error('Error generating R2 URL:', error);
            // Continue without preview URL
          }
        }

        return {
          ...asset,
          ...(preview && { preview })
        };
      });

      return c.json({
        success: true,
        assets: assetsWithPreviews
      }, 200);
    } catch (err: any) {
      console.error('Get folder assets error:', err);
      return c.json({ error: err?.message || 'Failed to fetch folder assets' }, 500);
    }
  }
}

export { FolderController };
