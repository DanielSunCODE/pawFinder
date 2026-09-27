import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import type { StorageDriver } from './index';

const RUTA_IMAGENES = process.env.RUTA_IMAGENES;

if (!RUTA_IMAGENES) {
  throw new Error(
    'RUTA_IMAGENES no está definida. Debe apuntar a una carpeta FUERA del repo (p. ej. /home/usuario/perritos-uploads) para que no se suba código junto con las fotos.'
  );
}

if (!fs.existsSync(RUTA_IMAGENES)) {
  fs.mkdirSync(RUTA_IMAGENES, { recursive: true });
}

export const localDriver: StorageDriver = {
  async guardar(buffer, extension) {
    // El nombre lo genera el backend (nunca se usa el nombre original que
    // sube el usuario): evita colisiones y path traversal por nombre.
    const nombre = `${randomUUID()}.${extension}`;
    const rutaCompleta = path.join(RUTA_IMAGENES, nombre);
    await fs.promises.writeFile(rutaCompleta, buffer);
    return { ruta: nombre };
  },

  async leer(ruta) {
    // path.basename descarta cualquier "../" que venga en `ruta`, aunque
    // en teoría `ruta` siempre viene de la base de datos y no del usuario.
    const rutaSegura = path.basename(ruta);
    const rutaCompleta = path.join(RUTA_IMAGENES, rutaSegura);
    return fs.promises.readFile(rutaCompleta);
  },
};
