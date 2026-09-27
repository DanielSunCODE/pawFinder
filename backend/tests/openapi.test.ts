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
  OPENAPI_SERVER_URL: 'http://localhost:3000',
};

describe('GET /api/openapi.json', () => {
  it('responde 200 con un documento OpenAPI 3.1 que incluye /api/health', async () => {
    const response = await request(createApp(testConfig)).get('/api/openapi.json');

    expect(response.status).toBe(200);
    expect(response.body.openapi).toMatch(/^3\.1\./);
    expect(response.body.paths['/api/health']).toBeDefined();
    expect(response.body.info.title).toBeTruthy();
    expect(response.body.components.schemas.HealthResponse).toBeDefined();
  });

  it('usa la URL de servidor configurada', async () => {
    const response = await request(createApp(testConfig)).get('/api/openapi.json');

    expect(response.body.servers[0].url).toBe('http://localhost:3000');
  });

  it('no expone valores de configuracion ni secretos', async () => {
    const response = await request(createApp(testConfig)).get('/api/openapi.json');
    const serialized = JSON.stringify(response.body);

    expect(serialized).not.toContain(testConfig.DB_PASSWORD);
    expect(serialized).not.toContain(testConfig.DB_HOST);
    expect(serialized).not.toContain(testConfig.RUTA_IMAGENES as string);
  });
});

describe('GET /api/docs', () => {
  it('responde 200 con la interfaz Swagger UI', async () => {
    const response = await request(createApp(testConfig)).get('/api/docs/');

    expect(response.status).toBe(200);
    expect(response.text).toContain('swagger');
  });
});
