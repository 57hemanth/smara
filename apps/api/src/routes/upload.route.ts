import { Hono } from 'hono';
import { UploadController } from '../contollers/upload.controller';
import type { Env, Variables } from '../types/env';

const uploadRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

uploadRoutes.post('/', UploadController.upload);
uploadRoutes.post('/url', UploadController.uploadUrl);

export default uploadRoutes;