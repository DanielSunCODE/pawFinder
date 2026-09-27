import { fileTypeFromBuffer } from 'file-type';
import type { ImagenExtension } from './index.js';

const EXTENSION_POR_MIME: Record<string, ImagenExtension> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

export interface ResultadoValidacion {
  valido: boolean;
  extension?: ImagenExtension;
  motivo?: string;
}

/**
 * Valida que el archivo sea REALMENTE una imagen JPG/PNG/WEBP mirando su
 * firma binaria (magic bytes), no la extensión ni el Content-Type, que el
 * cliente puede falsificar.
 */
export async function validarImagenReal(
  buffer: Buffer,
  maxBytes: number,
): Promise<ResultadoValidacion> {
  if (buffer.length === 0) {
    return { valido: false, motivo: 'El archivo está vacío.' };
  }

  if (buffer.length > maxBytes) {
    return {
      valido: false,
      motivo: `La imagen supera el tamaño máximo permitido (${maxBytes} bytes).`,
    };
  }

  const tipo = await fileTypeFromBuffer(buffer);
  if (!tipo) {
    return { valido: false, motivo: 'El archivo no es una imagen válida.' };
  }

  const extension = EXTENSION_POR_MIME[tipo.mime];
  if (!extension) {
    return { valido: false, motivo: `Formato no permitido: ${tipo.mime}. Usa JPG, PNG o WEBP.` };
  }

  return { valido: true, extension };
}
