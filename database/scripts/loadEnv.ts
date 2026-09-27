import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const aqui = path.dirname(fileURLToPath(import.meta.url));

/**
 * Carga las variables de entorno del backend (`backend/.env`) en process.env,
 * con un `.env` en la raíz como respaldo. Los scripts comparten la misma
 * configuración que la API (un solo archivo, un solo esquema).
 */
export function cargarEnv(): void {
  const candidatos = [
    path.resolve(aqui, '..', '..', 'backend', '.env'),
    path.resolve(aqui, '..', '..', '.env'),
  ];

  for (const archivo of candidatos) {
    if (existsSync(archivo)) {
      process.loadEnvFile(archivo);
      return;
    }
  }
}
