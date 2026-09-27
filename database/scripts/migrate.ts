import fs from 'fs';
import path from 'path';
import mysql from 'mysql2/promise';
import { dbConfig } from '../../src/db/pool';

const MIGRATIONS_DIR = path.join(__dirname, '..', 'migrations');

async function main() {
  // Conexión propia (no el pool de la app) con multipleStatements: true,
  // necesaria para poder correr un archivo .sql con varios CREATE/INSERT
  // en una sola llamada. Se cierra al terminar.
  const conn = await mysql.createConnection({ ...dbConfig, multipleStatements: true });

  await conn.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      nombre_archivo VARCHAR(255) PRIMARY KEY,
      aplicado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  const [rows] = await conn.query('SELECT nombre_archivo FROM schema_migrations');
  const aplicadas = new Set((rows as any[]).map((r) => r.nombre_archivo));

  const archivos = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort(); // 001_, 002_, 003_... el orden alfabético = orden de ejecución

  for (const archivo of archivos) {
    if (aplicadas.has(archivo)) {
      console.log(`⏭  ${archivo} ya estaba aplicada, se omite`);
      continue;
    }
    const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, archivo), 'utf8');
    try {
      await conn.query(sql);
      await conn.query('INSERT INTO schema_migrations (nombre_archivo) VALUES (?)', [archivo]);
      console.log(`✅ ${archivo} aplicada`);
    } catch (err) {
      console.error(`❌ Error aplicando ${archivo}`);
      await conn.end();
      throw err;
    }
  }

  console.log('Migraciones completas.');
  await conn.end();
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
