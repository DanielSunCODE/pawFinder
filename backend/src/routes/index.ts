import { Router } from 'express';
import { createHealthRouter } from './health.js';

export function createApiRouter(): Router {
  const router = Router();

  router.use(createHealthRouter());

  return router;
}
