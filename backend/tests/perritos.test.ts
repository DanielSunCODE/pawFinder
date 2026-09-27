import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';
import { createApp, type AppDeps } from '../src/app.js';
import type { PerritoRegistro, PerritosRepository } from '../src/repositories/perritosRepository.js';
import { testConfig } from './helpers/testConfig.js';

const PNG = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
]);

const perrito: PerritoRegistro = {
  id: 1,
  nombre: 'Luna',
  razaId: 2,
  razaNombre: 'Husky Siberiano',
  latitud: 25.1,
  longitud: -100.2,
  fechaRegistro: '2026-09-26T18:40:00.000Z',
  rutaImagen: 'luna.png',
  colores: [
    { id: 1, nombre: 'Negro', esDominante: true },
    { id: 2, nombre: 'Blanco', esDominante: false },
  ],
};

function repo(overrides: Partial<PerritosRepository> = {}): PerritosRepository {
  return {
    listar: async () => [perrito],
    obtener: async (id) => (id === 1 ? perrito : null),
    buscarPorIdempotencia: async () => null,
    crear: async (datos) => ({ perrito: { ...perrito, id: 7, nombre: datos.nombre }, replay: false }),
    listarRazas: async () => [{ id: 2, nombre: 'Husky Siberiano' }],
    listarColores: async () => [{ id: 1, nombre: 'Negro' }],
    estadisticasPorColor: async () => [{ id: 1, nombre: 'Negro', total: 3 }],
    contarPerritos: async () => 3,
    ...overrides,
  };
}

const almacen: AppDeps['storage'] = {
  guardar: async () => ({ ruta: 'generado.png' }),
  leer: async () => Buffer.from([0xff, 0xd8, 0xff, 0xe0]),
};

function appCon(repository: PerritosRepository = repo()) {
  return createApp(testConfig, { repository, storage: almacen });
}

const datosValidos = JSON.stringify({
  nombre: 'Luna',
  razaId: 2,
  colorPrincipalId: 1,
  coloresAdicionalesIds: [2],
  latitud: 25.1,
  longitud: -100.2,
});

describe('GET /api/perritos', () => {
  it('devuelve el listado con el formato de la API', async () => {
    const response = await request(appCon()).get('/api/perritos');

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0].nombre).toBe('Luna');
    expect(response.body.data[0].fotoUrl).toContain('/api/perritos/1/foto');
    expect(response.body.data[0].colorPrincipal.nombre).toBe('Negro');
    expect(response.body.data[0].coloresAdicionales).toHaveLength(1);
    expect(response.body.data[0].raza.nombre).toBe('Husky Siberiano');
  });

  it('rechaza filtros inválidos', async () => {
    const response = await request(appCon()).get('/api/perritos?colorId=abc');
    expect(response.status).toBe(400);
  });
});

describe('GET /api/perritos/:id', () => {
  it('devuelve el detalle', async () => {
    const response = await request(appCon()).get('/api/perritos/1');
    expect(response.status).toBe(200);
    expect(response.body.data.id).toBe(1);
  });

  it('404 con mensaje entendible si no existe', async () => {
    const response = await request(appCon()).get('/api/perritos/999');
    expect(response.status).toBe(404);
    expect(typeof response.body.error.message).toBe('string');
  });

  it('400 si el id no es numérico', async () => {
    const response = await request(appCon()).get('/api/perritos/abc');
    expect(response.status).toBe(400);
  });
});

describe('GET /api/razas y /api/colores', () => {
  it('devuelve los catálogos', async () => {
    const app = appCon();
    const razas = await request(app).get('/api/razas');
    const colores = await request(app).get('/api/colores');

    expect(razas.status).toBe(200);
    expect(razas.body.data[0]).toMatchObject({ id: 2, nombre: 'Husky Siberiano' });
    expect(colores.status).toBe(200);
    expect(colores.body.data[0]).toMatchObject({ id: 1, nombre: 'Negro', hex: null });
  });
});

describe('GET /api/estadisticas', () => {
  it('devuelve el total y el conteo por color', async () => {
    const response = await request(appCon()).get('/api/estadisticas');
    expect(response.status).toBe(200);
    expect(response.body.data.total).toBe(3);
    expect(response.body.data.porColor[0]).toMatchObject({ nombre: 'Negro', total: 3 });
  });
});

describe('GET /api/perritos/:id/foto', () => {
  it('entrega la imagen con su content-type', async () => {
    const response = await request(appCon()).get('/api/perritos/1/foto');
    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('image/png');
  });

  it('404 si el perrito no existe', async () => {
    const response = await request(appCon()).get('/api/perritos/999/foto');
    expect(response.status).toBe(404);
  });
});

describe('POST /api/perritos', () => {
  it('400 si falta la clave de idempotencia', async () => {
    const response = await request(appCon())
      .post('/api/perritos')
      .field('datos', datosValidos)
      .attach('foto', PNG, 'foto.png');

    expect(response.status).toBe(400);
    expect(response.body.error.message).toMatch(/idempotencia/i);
  });

  it('400 si falta la foto', async () => {
    const response = await request(appCon())
      .post('/api/perritos')
      .set('Idempotency-Key', 'clave-de-prueba-123')
      .field('datos', datosValidos);

    expect(response.status).toBe(400);
    expect(response.body.error.message).toMatch(/foto/i);
  });

  it('400 si los datos no cumplen las reglas (nombre vacío)', async () => {
    const response = await request(appCon())
      .post('/api/perritos')
      .set('Idempotency-Key', 'clave-de-prueba-123')
      .field('datos', JSON.stringify({ ...JSON.parse(datosValidos), nombre: '   ' }))
      .attach('foto', PNG, 'foto.png');

    expect(response.status).toBe(400);
  });

  it('400 si la foto no es una imagen real', async () => {
    const response = await request(appCon())
      .post('/api/perritos')
      .set('Idempotency-Key', 'clave-de-prueba-123')
      .field('datos', datosValidos)
      .attach('foto', Buffer.from('no soy una imagen'), 'foto.png');

    expect(response.status).toBe(400);
  });

  it('201 y crea el perrito con datos válidos', async () => {
    const response = await request(appCon())
      .post('/api/perritos')
      .set('Idempotency-Key', 'clave-de-prueba-123')
      .field('datos', datosValidos)
      .attach('foto', PNG, 'foto.png');

    expect(response.status).toBe(201);
    expect(response.body.data.id).toBe(7);
  });

  it('es idempotente: la misma clave devuelve el mismo perrito sin crear otro', async () => {
    const crear = vi.fn();
    const app = appCon(repo({ buscarPorIdempotencia: async () => perrito, crear }));

    const response = await request(app)
      .post('/api/perritos')
      .set('Idempotency-Key', 'clave-repetida-123')
      .field('datos', datosValidos)
      .attach('foto', PNG, 'foto.png');

    expect(response.status).toBe(201);
    expect(response.body.data.id).toBe(1);
    expect(crear).not.toHaveBeenCalled();
  });

  it('201 acepta los campos individuales de multipart (formato de Swagger)', async () => {
    const response = await request(appCon())
      .post('/api/perritos')
      .set('Idempotency-Key', 'clave-individual-123')
      .field('nombre', 'Luna')
      .field('razaId', '2')
      .field('colorPrincipalId', '1')
      .field('coloresAdicionalesIds', '2')
      .field('coloresAdicionalesIds', '3')
      .field('latitud', '25.1')
      .field('longitud', '-100.2')
      .attach('foto', PNG, 'foto.png');

    expect(response.status).toBe(201);
    expect(response.body.data.id).toBe(7);
  });

  it('400 si un color adicional repite el principal (campos individuales)', async () => {
    const response = await request(appCon())
      .post('/api/perritos')
      .set('Idempotency-Key', 'clave-color-repetido-1')
      .field('nombre', 'Luna')
      .field('colorPrincipalId', '1')
      .field('coloresAdicionalesIds', '1')
      .field('latitud', '25.1')
      .field('longitud', '-100.2')
      .attach('foto', PNG, 'foto.png');

    expect(response.status).toBe(400);
  });
});
