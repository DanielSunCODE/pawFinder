import { randomUUID } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { ArchivoGuardado, StorageDriver } from './index.js';

/**
 * Guarda las imágenes en un directorio del sistema de archivos fuera del
 * proyecto (RUTA_IMAGENES). El directorio se crea de forma perezosa en el
 * primer guardado, para no tener efectos secundarios al construir la app.
 */
export function createLocalDriver(rutaImagenes: string): StorageDriver {
  const base = path.resolve(rutaImagenes);

  return {
    async guardar(buffer, extension): Promise<ArchivoGuardado> {
      await mkdir(base, { recursive: true });
      // El backend genera el nombre; nunca se usa el que mandó el usuario.
      const nombre = `${randomUUID()}.${extension}`;
      await writeFile(path.join(base, nombre), buffer);
      return { ruta: nombre };
    },

    async leer(ruta): Promise<Buffer> {
      // path.basename descarta cualquier "../" aunque la ruta venga de la BD.
      const segura = path.basename(ruta);
      return readFile(path.join(base, segura));
    },
  };
}
