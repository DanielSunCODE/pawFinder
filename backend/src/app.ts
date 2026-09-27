import cors from 'cors';
import express, { type Express } from 'express';
import swaggerUi from 'swagger-ui-express';
import type { AppConfig } from './config/env.js';
import { createOpenApiDocument } from './docs/openapi.js';
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

  const openApiDocument = createOpenApiDocument(
    config.OPENAPI_SERVER_URL ?? `http://localhost:${config.PORT}`,
  );

  app.get('/api/openapi.json', (_req, res) => {
    res.status(200).json(openApiDocument);
  });
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openApiDocument));

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
