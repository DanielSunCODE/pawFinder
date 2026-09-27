import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { testConfig } from './helpers/testConfig.js';

describe('GET /api/openapi.json', () => {
  it('responde 200 con un documento OpenAPI 3.1 que incluye /api/health', async () => {
    const response = await request(createApp(testConfig)).get('/api/openapi.json');

    expect(response.status).toBe(200);
    expect(response.body.openapi).toMatch(/^3\.1\./);
    expect(response.body.paths['/api/health']).toBeDefined();
    expect(response.body.info.title).toBeTruthy();
    expect(response.body.components.schemas.HealthResponse).toBeDefined();
  });

  it('documenta el endpoint de la foto del perrito', async () => {
    const response = await request(createApp(testConfig)).get('/api/openapi.json');
    const ruta = response.body.paths['/api/perritos/{id}/foto'];

    expect(ruta).toBeDefined();
    expect(ruta.get.responses['200']).toBeDefined();
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
