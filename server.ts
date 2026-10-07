import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';

// Load environment variables
dotenv.config();

// Route imports
import { authRouter } from './server/routes/authRoutes.js';
import { adminRouter } from './server/routes/adminRoutes.js';
import { projectRouter } from './server/routes/projectRoutes.js';
import { serviceRouter } from './server/routes/serviceRoutes.js';
import { blogRouter } from './server/routes/blogRoutes.js';
import { testimonialRouter } from './server/routes/testimonialRoutes.js';
import { messageRouter } from './server/routes/messageRoutes.js';
import { analyticsRouter } from './server/routes/analyticsRoutes.js';
import { auditRouter } from './server/routes/auditRoutes.js';
import { mediaRouter } from './server/routes/mediaRoutes.js';
import { publicRouter } from './server/routes/publicRoutes.js';
import { caseStudyRouter } from './server/routes/caseStudyRoutes.js';
import { dbManager } from './server/config/db.js';

async function startServer() {
  const app = express();
  const PORT = parseInt(process.env.PORT || '3000', 10);
  const isProduction = process.env.NODE_ENV === 'production';

  // Initialize MongoDB Atlas connection & sync
  await dbManager.init();

  app.set('trust proxy', true);

  // Security and parsing middleware
  app.use(cors({
    origin: true,
    credentials: true
  }));
  app.use(express.json({ limit: '25mb' }));
  app.use(express.text({ type: ['text/plain', 'text/*'], limit: '5mb' }));
  app.use(express.urlencoded({ extended: true, limit: '25mb' }));
  app.use(cookieParser());

  // Request logger
  app.use((req, _res, next) => {
    if (req.path.startsWith('/api')) {
      console.log(`[API ${req.method}] ${req.path}`);
    }
    next();
  });

  // REST API Routes
  app.use('/api/auth', authRouter);
  app.use('/api/admins', adminRouter);
  app.use('/api/projects', projectRouter);
  app.use('/api/services', serviceRouter);
  app.use('/api/blogs', blogRouter);
  app.use('/api/testimonials', testimonialRouter);
  app.use('/api/messages', messageRouter);
  app.use('/api/analytics', analyticsRouter);
  app.use('/api/audit-logs', auditRouter);
  app.use('/api/media', mediaRouter);
  app.use('/api/public', publicRouter);
  app.use('/api', caseStudyRouter);

  // Health check route
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'healthy',
      app: 'Regards Tech Admin Panel REST Server',
      timestamp: new Date().toISOString()
    });
  });

  // Vite integration or static file serving
  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);

    // Explicit fallback for client SPA routing in local dev
    app.use('*', async (req, res, next) => {
      const url = req.originalUrl;
      if (url.startsWith('/api')) {
        return next();
      }
      try {
        const indexPath = path.resolve(process.cwd(), 'index.html');
        let template = fs.readFileSync(indexPath, 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e) {
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Global error handler
  app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error('Unhandled server exception:', err);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  });

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Regards Tech Admin Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to initialize server:', err);
  process.exit(1);
});
