import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { testConfig } from './helpers/testConfig.js';

describe('GET /api/openapi.json', () => {
  it('responde 200 con un documento OpenAPI 3.1 y los endpoints del dominio', async () => {
    const response = await request(createApp(testConfig)).get('/api/openapi.json');

    expect(response.status).toBe(200);
    expect(response.body.openapi).toMatch(/^3\.1\./);
    expect(response.body.info.title).toBeTruthy();

    for (const ruta of [
      '/api/health',
      '/api/perritos',
      '/api/perritos/{id}',
      '/api/perritos/{id}/foto',
      '/api/razas',
      '/api/colores',
      '/api/colores-ojos',
      '/api/patrones-pelaje',
      '/api/estadisticas',
    ]) {
      expect(response.body.paths[ruta], `falta ${ruta}`).toBeDefined();
    }

    expect(response.body.components.schemas.Perrito).toBeDefined();
    expect(response.body.components.schemas.ErrorResponse).toBeDefined();
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
