import cors from 'cors';
import express, { type Express } from 'express';
import type { AppConfig } from './config/env.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { createApiRouter } from './routes/index.js';

export function createApp(config: AppConfig): Express {
  const app = express();

  const allowedOrigins = config.CORS_ORIGIN.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.use(
    cors({
      origin: allowedOrigins,
    }),
  );
  app.use(express.json({ limit: '1mb' }));

  app.use('/api', createApiRouter());

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
