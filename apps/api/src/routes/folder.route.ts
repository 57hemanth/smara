import { Hono } from 'hono';
import { FolderController } from '../contollers/folder.controller';
import type { Env, Variables } from '../types/env';

const folderRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

// GET /folders - Get all folders for user
folderRoutes.get('/', FolderController.getFolders);

// POST /folders - Create new folder
folderRoutes.post('/', FolderController.createFolder);

// PUT /folders/:id - Update folder (rename)
folderRoutes.put('/:id', FolderController.updateFolder);

// DELETE /folders/:id - Delete folder
folderRoutes.delete('/:id', FolderController.deleteFolder);

export default folderRoutes;
