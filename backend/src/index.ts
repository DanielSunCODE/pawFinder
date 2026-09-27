import { existsSync } from 'node:fs';
import path from 'node:path';
import { createApp } from './app.js';
import { loadEnv } from './config/env.js';

/**
 * Carga backend/.env en local si existe. En producción las variables vienen
 * del entorno del servicio (Render), así que aquí no hay archivo que leer.
 */
function cargarEnvLocal(): void {
  const ruta = path.resolve(process.cwd(), '.env');
  if (existsSync(ruta)) {
    process.loadEnvFile(ruta);
  }
}

function main(): void {
  cargarEnvLocal();

  const config = loadEnv();
  const app = createApp(config);

  app.listen(config.PORT, () => {
    console.log(`Backend escuchando en http://localhost:${config.PORT}`);
    console.log(`Documentación: http://localhost:${config.PORT}/api/docs`);
  });
}

try {
  main();
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`No se pudo iniciar el backend: ${message}`);
  process.exit(1);
}
