export interface ArchivoGuardado {
  // Identificador interno (clave / nombre de archivo). NUNCA una URL
  // pública ni una ruta absoluta del sistema de archivos: eso es lo que
  // permite que local y s3 sean intercambiables y que el frontend jamás
  // vea dónde vive realmente la imagen.
  ruta: string;
}

export interface StorageDriver {
  guardar(buffer: Buffer, extension: 'jpg' | 'png' | 'webp'): Promise<ArchivoGuardado>;
  leer(ruta: string): Promise<Buffer>;
}

import { localDriver } from './localDriver';
import { s3Driver } from './s3Driver';

function seleccionarDriver(): StorageDriver {
  const driver = process.env.STORAGE_DRIVER ?? 'local';
  switch (driver) {
    case 'local':
      return localDriver;
    case 's3':
      return s3Driver;
    default:
      throw new Error(`STORAGE_DRIVER desconocido: "${driver}" (usa "local" o "s3")`);
  }
}

export const storage: StorageDriver = seleccionarDriver();
