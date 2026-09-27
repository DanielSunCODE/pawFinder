import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import type { AppConfig } from '../src/config/env.js';

const testConfig: AppConfig = {
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
  STORAGE_DRIVER: 'local',
  RUTA_IMAGENES: 'D:/pawfinder-imagenes',
  IMAGE_MAX_BYTES: 5 * 1024 * 1024,
  AWS_REGION: undefined,
  AWS_S3_BUCKET: undefined,
  AWS_ACCESS_KEY_ID: undefined,
  AWS_SECRET_ACCESS_KEY: undefined,
  PUBLIC_BASE_URL: 'http://localhost:3000',
};

describe('GET /api/health', () => {
  it('responde 200 con el contrato { data }', async () => {
    const app = createApp(testConfig);

    const response = await request(app).get('/api/health');

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ data: { status: 'ok' } });
    expect(typeof response.body.data.uptime).toBe('number');
  });
});

describe('Rutas desconocidas', () => {
  it('responde 404 con un mensaje entendible', async () => {
    const app = createApp(testConfig);

    const response = await request(app).get('/api/no-existe');

    expect(response.status).toBe(404);
    expect(typeof response.body.error.message).toBe('string');
    expect(response.body.error.message).not.toContain('404');
  });
});
