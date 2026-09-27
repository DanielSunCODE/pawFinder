import sharp from 'sharp';
import type { AppConfig } from '../config/env.js';
import type { ImagenExtension } from './index.js';

export interface ImagenProcesada {
  buffer: Buffer;
  extension: ImagenExtension;
}

const EXTENSION_POR_FORMATO: Record<AppConfig['IMAGE_OUTPUT_FORMAT'], ImagenExtension> = {
  webp: 'webp',
  jpeg: 'jpg',
};

/**
 * Comprime y reescala una imagen ya validada:
 *   - corrige la orientación según el EXIF (`rotate`),
 *   - limita el lado mayor a `IMAGE_MAX_DIMENSION` sin ampliar imágenes chicas,
 *   - reencodea al formato configurado (`webp` o `jpeg`) con `IMAGE_QUALITY`,
 *   - descarta metadatos (incluido el GPS del EXIF) al reencodear.
 *
 * Si el archivo no se puede procesar (por ejemplo, una variante rara pero ya
 * validada como imagen), devuelve el original con su extensión para no perder
 * un registro válido.
 */
export async function comprimirImagen(
  buffer: Buffer,
  extensionOriginal: ImagenExtension,
  config: AppConfig,
): Promise<ImagenProcesada> {
  try {
    const redimensionada = sharp(buffer)
      .rotate()
      .resize({
        width: config.IMAGE_MAX_DIMENSION,
        height: config.IMAGE_MAX_DIMENSION,
        fit: 'inside',
        withoutEnlargement: true,
      });

    const comprimida =
      config.IMAGE_OUTPUT_FORMAT === 'webp'
        ? await redimensionada.webp({ quality: config.IMAGE_QUALITY }).toBuffer()
        : await redimensionada.jpeg({ quality: config.IMAGE_QUALITY }).toBuffer();

    return { buffer: comprimida, extension: EXTENSION_POR_FORMATO[config.IMAGE_OUTPUT_FORMAT] };
  } catch {
    return { buffer, extension: extensionOriginal };
  }
}
