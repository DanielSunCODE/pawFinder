import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { buildDbConfig } from '../src/db/pool.js';
import { testConfig } from './helpers/testConfig.js';

const PEM = [
  '-----BEGIN CERTIFICATE-----',
  'MIIERDCCAqygAwIBAgIUDAUxMyStSp5aizGGCTgcANVoPQUwDQYJKoZIhvcNAQEM',
  '-----END CERTIFICATE-----',
].join('\n');

describe('buildDbConfig', () => {
  it('devuelve la configuracion base sin TLS cuando DB_SSL=false', () => {
    const config = buildDbConfig({ ...testConfig, DB_SSL: false });

    expect(config.ssl).toBeUndefined();
    expect(config.host).toBe('127.0.0.1');
    expect(config.database).toBe('pawfinder');
  });

  it('acepta el PEM pegado con saltos de linea escapados', () => {
    const config = buildDbConfig({
      ...testConfig,
      DB_SSL: true,
      DB_SSL_CA: PEM.replace(/\n/g, '\\n'),
    });

    const ssl = config.ssl as { ca: string };
    expect(ssl.ca).toContain('BEGIN CERTIFICATE');
    expect(ssl.ca).toContain('\n');
  });

  it('lee el certificado desde una ruta de archivo', async () => {
    const dir = await mkdtemp(path.join(tmpdir(), 'pawfinder-ca-'));
    const archivo = path.join(dir, 'aiven-ca.pem');
    await writeFile(archivo, PEM);

    try {
      const config = buildDbConfig({ ...testConfig, DB_SSL: true, DB_SSL_CA: archivo });
      expect((config.ssl as { ca: string }).ca).toContain('BEGIN CERTIFICATE');
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it('falla si DB_SSL=true y no hay DB_SSL_CA', () => {
    expect(() =>
      buildDbConfig({ ...testConfig, DB_SSL: true, DB_SSL_CA: undefined }),
    ).toThrowError(/DB_SSL_CA/);
  });
});
