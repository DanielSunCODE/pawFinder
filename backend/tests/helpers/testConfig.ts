import type { AppConfig } from '../../src/config/env.js';

/** Configuración completa para pruebas que no tocan base de datos ni disco. */
export const testConfig: AppConfig = {
  NODE_ENV: 'test',
  PORT: 3000,
  CORS_ORIGIN: 'http://localhost:5173',
  DB_HOST: '127.0.0.1',
  DB_PORT: 3306,
  DB_USER: 'pawfinder',
  DB_PASSWORD: 'secreto-de-prueba',
  DB_NAME: 'pawfinder',
  DB_SSL: false,
  DB_SSL_CA: undefined,
  DB_CONNECTION_LIMIT: 10,
  STORAGE_DRIVER: 'local',
  RUTA_IMAGENES: 'D:/pawfinder-imagenes',
  IMAGE_MAX_BYTES: 5 * 1024 * 1024,
  AWS_REGION: undefined,
  AWS_S3_BUCKET: undefined,
  AWS_ACCESS_KEY_ID: undefined,
  AWS_SECRET_ACCESS_KEY: undefined,
  PUBLIC_BASE_URL: 'http://localhost:3000',
  OPENAPI_SERVER_URL: 'http://localhost:3000',
};
