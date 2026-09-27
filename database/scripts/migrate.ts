import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { loadDbEnv, type DbConfig } from '../../backend/src/config/env.js';
import { createScriptConnection } from '../../backend/src/db/pool.js';
import { cargarEnv } from './loadEnv.js';

const aqui = path.dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = path.resolve(aqui, '..', 'migrations');

export async function runMigrations(config: DbConfig): Promise<void> {
  const conn = await createScriptConnection(config);

  try {
    await conn.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        nombre_archivo VARCHAR(255) PRIMARY KEY,
        aplicado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    const [rows] = await conn.query('SELECT nombre_archivo FROM schema_migrations');
    const aplicadas = new Set(
      (rows as Array<{ nombre_archivo: string }>).map((r) => r.nombre_archivo),
    );

    const archivos = readdirSync(MIGRATIONS_DIR)
      .filter((f) => f.endsWith('.sql'))
      .sort();

    for (const archivo of archivos) {
      if (aplicadas.has(archivo)) {
        console.log(`= ${archivo} ya estaba aplicada, se omite`);
        continue;
      }
      const sql = readFileSync(path.join(MIGRATIONS_DIR, archivo), 'utf8');
      await conn.query(sql);
      await conn.query('INSERT INTO schema_migrations (nombre_archivo) VALUES (?)', [archivo]);
      console.log(`+ ${archivo} aplicada`);
    }

    console.log('Migraciones completas.');
  } finally {
    await conn.end();
  }
}

async function main(): Promise<void> {
  cargarEnv();
  await runMigrations(loadDbEnv());
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
}
