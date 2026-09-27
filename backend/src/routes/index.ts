import { Router } from 'express';
import type { Pool } from 'mysql2/promise';
import type { StorageDriver } from '../storage/index.js';
import { createHealthRouter } from './health.js';
import { createPhotoRouter } from './photos.js';

export interface ApiDeps {
  pool: Pool;
  storage: StorageDriver;
}

export function createApiRouter(deps: ApiDeps): Router {
  const router = Router();

  router.use(createHealthRouter());
  router.use(createPhotoRouter(deps.pool, deps.storage));

  return router;
}
