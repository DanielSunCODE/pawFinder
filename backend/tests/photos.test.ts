import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp, type AppDeps } from '../src/app.js';
import { testConfig } from './helpers/testConfig.js';

const pngBytes = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

function poolConFilas(rows: unknown[]): AppDeps['pool'] {
  return { query: async () => [rows, []] } as unknown as AppDeps['pool'];
}

function storageFalso(leer: () => Promise<Buffer>): AppDeps['storage'] {
  return {
    guardar: async () => ({ ruta: 'generado.png' }),
    leer,
  };
}

describe('GET /api/perritos/:id/foto', () => {
  it('entrega la imagen con el content-type correcto', async () => {
    const app = createApp(testConfig, {
      pool: poolConFilas([{ ruta_imagen: 'abc.png' }]),
      storage: storageFalso(async () => pngBytes),
    });

    const response = await request(app).get('/api/perritos/1/foto');

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('image/png');
  });

  it('responde 404 con mensaje entendible si el perrito no existe', async () => {
    const app = createApp(testConfig, {
      pool: poolConFilas([]),
      storage: storageFalso(async () => pngBytes),
    });

    const response = await request(app).get('/api/perritos/999/foto');

    expect(response.status).toBe(404);
    expect(typeof response.body.error.message).toBe('string');
  });

  it('responde 400 si el identificador no es valido', async () => {
    const app = createApp(testConfig, {
      pool: poolConFilas([]),
      storage: storageFalso(async () => pngBytes),
    });

    const response = await request(app).get('/api/perritos/abc/foto');

    expect(response.status).toBe(400);
    expect(typeof response.body.error.message).toBe('string');
  });

  it('responde 404 si el storage no puede leer la imagen', async () => {
    const app = createApp(testConfig, {
      pool: poolConFilas([{ ruta_imagen: 'abc.png' }]),
      storage: storageFalso(async () => {
        throw new Error('archivo ausente');
      }),
    });

    const response = await request(app).get('/api/perritos/1/foto');

    expect(response.status).toBe(404);
  });
});
