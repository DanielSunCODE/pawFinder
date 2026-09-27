import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { testConfig } from './helpers/testConfig.js';

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
