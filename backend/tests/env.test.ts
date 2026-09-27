import { describe, expect, it } from 'vitest';
import { loadEnv } from '../src/config/env.js';

const baseEnv = {
  DB_HOST: '127.0.0.1',
  DB_USER: 'pawfinder',
  DB_PASSWORD: 'clave-super-secreta',
  DB_NAME: 'pawfinder',
  STORAGE_DRIVER: 'local',
  RUTA_IMAGENES: 'D:/pawfinder-imagenes',
};

describe('loadEnv', () => {
  it('aplica valores por defecto con configuracion valida', () => {
    const config = loadEnv(baseEnv as NodeJS.ProcessEnv);

    expect(config.PORT).toBe(3000);
    expect(config.NODE_ENV).toBe('development');
    expect(config.DB_SSL).toBe(false);
    expect(config.IMAGE_MAX_BYTES).toBe(5 * 1024 * 1024);
  });

  it('falla nombrando la variable faltante sin exponer su valor', () => {
    const { DB_HOST: _omit, ...incompleto } = baseEnv;

    expect(() => loadEnv(incompleto as NodeJS.ProcessEnv)).toThrowError(/DB_HOST/);
    expect(() => loadEnv(incompleto as NodeJS.ProcessEnv)).not.toThrowError(
      /clave-super-secreta/,
    );
  });

  it('exige RUTA_IMAGENES cuando el almacenamiento es local', () => {
    const { RUTA_IMAGENES: _omit, ...sinRuta } = baseEnv;

    expect(() => loadEnv(sinRuta as NodeJS.ProcessEnv)).toThrowError(/RUTA_IMAGENES/);
  });

  it('exige las variables de AWS cuando el almacenamiento es s3', () => {
    const envS3 = {
      ...baseEnv,
      STORAGE_DRIVER: 's3',
    };

    expect(() => loadEnv(envS3 as NodeJS.ProcessEnv)).toThrowError(/AWS_S3_BUCKET/);
  });
});
