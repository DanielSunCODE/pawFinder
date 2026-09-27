import cors from 'cors';
import express, { type Express } from 'express';
import type { Pool } from 'mysql2/promise';
import swaggerUi from 'swagger-ui-express';
import type { AppConfig } from './config/env.js';
import { createPool } from './db/pool.js';
import { createOpenApiDocument } from './docs/openapi.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import {
  createPerritosRepository,
  type PerritosRepository,
} from './repositories/perritosRepository.js';
import { createApiRouter } from './routes/index.js';
import { createStorage, type StorageDriver } from './storage/index.js';

export interface AppDeps {
  pool: Pool;
  storage: StorageDriver;
  repository: PerritosRepository;
}

/**
 * Construye la app. Las dependencias (pool, storage, repositorio) se pueden
 * inyectar en pruebas; por defecto se crean a partir de la configuración. Crear
 * el pool no abre conexiones hasta la primera consulta.
 */
export function createApp(config: AppConfig, deps: Partial<AppDeps> = {}): Express {
  const pool = deps.pool ?? createPool(config);
  const storage = deps.storage ?? createStorage(config);
  const repository = deps.repository ?? createPerritosRepository(pool);

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

  app.use('/api', createApiRouter({ repository, storage, config }));

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
