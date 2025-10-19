import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { prettyJSON } from 'hono/pretty-json';
import type { Env, Variables } from './types/env';

// Routes
import uploadRoutes from './routes/upload.route';
import searchRoutes from './routes/search.route';
import userRoutes from './routes/user.route';

const app = new Hono<{ Bindings: Env; Variables: Variables }>();

// Middleware
app.use('*', logger());
app.use('*', prettyJSON());

// CORS - Allow web app and browser extension
app.use('*', (c, next) => {
  const allowedOrigins = c.env.ALLOWED_ORIGINS?.split(',').map(o => o.trim()) || [];
  
  return cors({
    origin: (origin) => {
      // Allow requests with no origin (like from Postman)
      if (!origin) return origin;
      
      // Allow any chrome extension
      if (origin.startsWith('chrome-extension://')) return origin;
      
      // Allow specific configured origins
      if (allowedOrigins.includes(origin)) return origin;
      
      // Allow localhost for development
      if (origin.includes('localhost') || origin.includes('127.0.0.1')) return origin;
      
      return null;
    },
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization', 'X-User-Id'],
    credentials: true,
  })(c, next);
});

// Health check
app.get('/', (c) => {
  return c.json({
    status: 'ok',
    service: 'SMARA API',
    version: '0.1.0',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.route('/upload', uploadRoutes);
app.route('/search', searchRoutes);
app.route('/user', userRoutes);

// 404 Handler
app.notFound((c) => {
  return c.json({ error: 'Not Found', path: c.req.path }, 404);
});

// Error Handler
app.onError((err, c) => {
  console.error('[Error]', err);
  return c.json({
    error: err.message || 'Internal Server Error',
  }, 500);
});

export default app;