import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createLocalDriver } from '../src/storage/localDriver.js';
import { validarImagenReal } from '../src/storage/validateImage.js';

const PNG = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
]);
const JPG = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46]);
const WEBP = Buffer.concat([
  Buffer.from('RIFF'),
  Buffer.from([0x24, 0x00, 0x00, 0x00]),
  Buffer.from('WEBP'),
  Buffer.from('VP8 '),
]);
const GIF = Buffer.from('GIF89a', 'ascii');
const TEXTO = Buffer.from('esto no es una imagen', 'utf8');

describe('validarImagenReal', () => {
  it('acepta PNG, JPG y WEBP por su firma binaria', async () => {
    const max = 5 * 1024 * 1024;

    await expect(validarImagenReal(PNG, max)).resolves.toMatchObject({ valido: true, extension: 'png' });
    await expect(validarImagenReal(JPG, max)).resolves.toMatchObject({ valido: true, extension: 'jpg' });
    await expect(validarImagenReal(WEBP, max)).resolves.toMatchObject({ valido: true, extension: 'webp' });
  });

  it('rechaza formatos de imagen no permitidos', async () => {
    const resultado = await validarImagenReal(GIF, 5 * 1024 * 1024);
    expect(resultado.valido).toBe(false);
    expect(resultado.motivo).toContain('no permitido');
  });

  it('rechaza contenido que no es imagen', async () => {
    const resultado = await validarImagenReal(TEXTO, 5 * 1024 * 1024);
    expect(resultado.valido).toBe(false);
  });

  it('rechaza archivos vacios o que exceden el maximo', async () => {
    await expect(validarImagenReal(Buffer.alloc(0), 1000)).resolves.toMatchObject({ valido: false });
    await expect(validarImagenReal(PNG, 4)).resolves.toMatchObject({ valido: false });
  });
});

describe('createLocalDriver', () => {
  let dir: string;

  beforeEach(async () => {
    dir = await mkdtemp(path.join(tmpdir(), 'pawfinder-'));
  });

  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  it('genera el nombre del archivo y lo puede volver a leer', async () => {
    const driver = createLocalDriver(dir);

    const { ruta } = await driver.guardar(PNG, 'png');

    expect(ruta).toMatch(/^[0-9a-f-]{36}\.png$/);
    const leido = await driver.leer(ruta);
    expect(leido.equals(PNG)).toBe(true);
  });

  it('ignora el path traversal al leer (usa solo el nombre base)', async () => {
    const driver = createLocalDriver(dir);

    await expect(driver.leer('../fuera-del-directorio.png')).rejects.toThrow();
  });
});
