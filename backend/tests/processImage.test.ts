import sharp from 'sharp';
import { describe, expect, it } from 'vitest';
import { comprimirImagen } from '../src/storage/processImage.js';
import { testConfig } from './helpers/testConfig.js';

async function fotoGrande(): Promise<Buffer> {
  return sharp({
    create: { width: 3000, height: 2000, channels: 3, background: { r: 200, g: 100, b: 50 } },
  })
    .jpeg({ quality: 100 })
    .toBuffer();
}

describe('comprimirImagen', () => {
  it('reduce las dimensiones y reencodea a webp', async () => {
    const original = await fotoGrande();

    const { buffer, extension } = await comprimirImagen(original, 'jpg', testConfig);

    expect(extension).toBe('webp');
    const meta = await sharp(buffer).metadata();
    expect(meta.format).toBe('webp');
    expect(Math.max(meta.width ?? 0, meta.height ?? 0)).toBeLessThanOrEqual(
      testConfig.IMAGE_MAX_DIMENSION,
    );
    expect(buffer.length).toBeLessThan(original.length);
  });

  it('respeta jpeg cuando se configura IMAGE_OUTPUT_FORMAT=jpeg', async () => {
    const original = await fotoGrande();

    const { extension } = await comprimirImagen(original, 'jpg', {
      ...testConfig,
      IMAGE_OUTPUT_FORMAT: 'jpeg',
    });

    expect(extension).toBe('jpg');
  });

  it('no amplía una imagen más chica que el máximo', async () => {
    const chica = await sharp({
      create: { width: 100, height: 80, channels: 3, background: { r: 0, g: 0, b: 0 } },
    })
      .png()
      .toBuffer();

    const { buffer } = await comprimirImagen(chica, 'png', testConfig);
    const meta = await sharp(buffer).metadata();

    expect(meta.width).toBe(100);
    expect(meta.height).toBe(80);
  });

  it('si no se puede procesar, devuelve el original con su extensión', async () => {
    const noProcesable = Buffer.from('contenido que sharp no puede decodificar');

    const { buffer, extension } = await comprimirImagen(noProcesable, 'png', testConfig);

    expect(extension).toBe('png');
    expect(buffer.equals(noProcesable)).toBe(true);
  });
});
