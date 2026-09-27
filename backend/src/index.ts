import { createApp } from './app.js';
import { loadEnv } from './config/env.js';

function main(): void {
  const config = loadEnv();
  const app = createApp(config);

  app.listen(config.PORT, () => {
    console.log(`Backend escuchando en http://localhost:${config.PORT}`);
  });
}

try {
  main();
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`No se pudo iniciar el backend: ${message}`);
  process.exit(1);
}
