import mysql from 'mysql2/promise';
import { loadEnv } from '../../backend/src/config/env.js';
import { buildDbConfig } from '../../backend/src/db/pool.js';
import { cargarEnv } from './loadEnv.js';
import { runMigrations } from './migrate.js';
import { runSeeds } from './seed.js';

async function main(): Promise<void> {
  cargarEnv();
  const config = loadEnv();

  if (config.DB_HOST !== 'localhost' && config.DB_HOST !== '127.0.0.1') {
    throw new Error(
      `db:reset solo debe correr contra MySQL local, pero DB_HOST=${config.DB_HOST}. Para no arriesgar la base de Aiven, se cancela.`,
    );
  }

  const conn = await mysql.createConnection({
    ...buildDbConfig(config),
    database: undefined,
    multipleStatements: true,
  });

  try {
    await conn.query(
      `DROP DATABASE IF EXISTS \`${config.DB_NAME}\`;
       CREATE DATABASE \`${config.DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;`,
    );
    console.log(`Base "${config.DB_NAME}" recreada en ${config.DB_HOST}.`);
  } finally {
    await conn.end();
  }

  await runMigrations(config);
  await runSeeds(config, {
    rutaImagenes: config.RUTA_IMAGENES,
    esLocal: config.STORAGE_DRIVER === 'local',
  });

  console.log('Base local recreada desde cero, migrada y sembrada.');
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
