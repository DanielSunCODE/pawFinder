import type { AppConfig } from '../config/env.js';
import { createLocalDriver } from './localDriver.js';
import { createS3Driver } from './s3Driver.js';

export type ImagenExtension = 'jpg' | 'png' | 'webp';

export interface ArchivoGuardado {
  /** Identificador interno (nombre de archivo). Nunca una URL ni una ruta absoluta. */
  ruta: string;
}

export interface StorageDriver {
  guardar(buffer: Buffer, extension: ImagenExtension): Promise<ArchivoGuardado>;
  leer(ruta: string): Promise<Buffer>;
}

/**
 * Devuelve el driver de almacenamiento según `STORAGE_DRIVER`.
 * La selección es en tiempo de ejecución: en modo `local` no se necesita nada
 * de AWS, y en modo `s3` no se toca el disco.
 */
export function createStorage(config: AppConfig): StorageDriver {
  switch (config.STORAGE_DRIVER) {
    case 'local':
      return createLocalDriver(config.RUTA_IMAGENES as string);
    case 's3':
      return createS3Driver({
        region: config.AWS_REGION as string,
        bucket: config.AWS_S3_BUCKET as string,
      });
    default: {
      const inesperado: never = config.STORAGE_DRIVER;
      throw new Error(`STORAGE_DRIVER desconocido: ${String(inesperado)}`);
    }
  }
}
