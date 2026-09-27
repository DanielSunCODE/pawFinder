import { describe, expect, it } from 'vitest';
import { aPerritoApi, aPerritosApi } from '../src/mappers/perritoMapper.js';
import type { PerritoRegistro } from '../src/repositories/perritosRepository.js';
import { testConfig } from './helpers/testConfig.js';

const registro: PerritoRegistro = {
  id: 42,
  nombre: 'Luna',
  razaId: 2,
  razaNombre: 'Husky Siberiano',
  sexo: 'hembra',
  etapaVida: 'adulto',
  tamano: 'mediano',
  longitudPelaje: 'corto',
  marcasDistintivas: 'Mancha blanca en el pecho',
  patronPelajeId: 4,
  patronPelajeNombre: 'Bicolor',
  colorOjosId: 3,
  colorOjosNombre: 'Azul',
  latitud: 25.686614,
  longitud: -100.313812,
  fechaRegistro: '2026-09-26T18:40:00.000Z',
  rutaImagen: 'luna.png',
  colores: [
    { id: 1, nombre: 'Negro', esDominante: true },
    { id: 2, nombre: 'Blanco', esDominante: false },
  ],
};

describe('aPerritoApi', () => {
  it('arma la respuesta con todos los campos del contrato', () => {
    const perrito = aPerritoApi(registro, testConfig);

    expect(perrito).toMatchObject({
      id: 42,
      nombre: 'Luna',
      fotoUrl: 'http://localhost:3000/api/perritos/42/foto',
      miniaturaUrl: 'http://localhost:3000/api/perritos/42/foto',
      raza: { id: 2, nombre: 'Husky Siberiano' },
      sexo: 'hembra',
      etapaVida: 'adulto',
      tamano: 'mediano',
      longitudPelaje: 'corto',
      patronPelaje: { id: 4, nombre: 'Bicolor' },
      colorOjos: { id: 3, nombre: 'Azul', hex: null },
      marcasDistintivas: 'Mancha blanca en el pecho',
      latitud: 25.686614,
      longitud: -100.313812,
      fechaRegistro: '2026-09-26T18:40:00.000Z',
    });
  });

  it('separa el color dominante del resto (funcional, sin mutar)', () => {
    const perrito = aPerritoApi(
      {
        ...registro,
        colores: [
          { id: 2, nombre: 'Blanco', esDominante: false },
          { id: 1, nombre: 'Negro', esDominante: true },
          { id: 5, nombre: 'Canela', esDominante: false },
        ],
      },
      testConfig,
    );

    expect(perrito.colorPrincipal).toMatchObject({ id: 1, nombre: 'Negro' });
    expect(perrito.coloresAdicionales.map((color) => color.nombre)).toEqual(['Blanco', 'Canela']);
    expect(registro.colores).toHaveLength(2); // no se mutó la entrada original
  });

  it('sin color dominante, toma el primero como principal', () => {
    const perrito = aPerritoApi(
      {
        ...registro,
        colores: [
          { id: 7, nombre: 'Gris', esDominante: false },
          { id: 8, nombre: 'Rojo', esDominante: false },
        ],
      },
      testConfig,
    );

    expect(perrito.colorPrincipal).toMatchObject({ id: 7, nombre: 'Gris' });
    expect(perrito.coloresAdicionales.map((color) => color.id)).toEqual([8]);
  });

  it('sin colores, devuelve el color de respaldo y lista vacía', () => {
    const perrito = aPerritoApi({ ...registro, colores: [] }, testConfig);

    expect(perrito.colorPrincipal).toEqual({ id: 0, nombre: 'Sin color', hex: null });
    expect(perrito.coloresAdicionales).toEqual([]);
  });

  it('no deja doble barra si PUBLIC_BASE_URL termina en /', () => {
    const perrito = aPerritoApi(registro, {
      ...testConfig,
      PUBLIC_BASE_URL: 'https://api.pawfinder.example.com/',
    });

    expect(perrito.fotoUrl).toBe('https://api.pawfinder.example.com/api/perritos/42/foto');
  });
});

describe('aPerritosApi', () => {
  it('mapea la lista completa', () => {
    const lista = aPerritosApi([registro, { ...registro, id: 43, nombre: 'Toby' }], testConfig);

    expect(lista).toHaveLength(2);
    expect(lista.map((perrito) => perrito.nombre)).toEqual(['Luna', 'Toby']);
  });
});
