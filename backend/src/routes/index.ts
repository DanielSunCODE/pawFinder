import { Router } from 'express';
import type { AppConfig } from '../config/env.js';
import type { PerritosRepository } from '../repositories/perritosRepository.js';
import type { StorageDriver } from '../storage/index.js';
import { createHealthRouter } from './health.js';
import { createPerritosRouter } from './perritos.js';

export interface ApiDeps {
  repository: PerritosRepository;
  storage: StorageDriver;
  config: AppConfig;
}

export function createApiRouter(deps: ApiDeps): Router {
  const router = Router();

  router.use(createHealthRouter());
  router.use(createPerritosRouter(deps));

  return router;
}
