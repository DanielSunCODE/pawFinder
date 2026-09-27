import fs from 'fs';
import path from 'path';
import mysql from 'mysql2/promise';
import { dbConfig } from '../../src/db/pool';

const SEEDS_DIR = path.join(__dirname, '..', 'seeds');

// A diferencia de migrate.ts, los seeds no se marcan como "aplicados":
// están pensados para correr una sola vez sobre una base recién migrada.
// Si los corres dos veces vas a chocar con los UNIQUE (ruta_imagen, etc.).
// Para repetir, usa database/scripts/reset-local.sh.
async function main() {
  const conn = await mysql.createConnection({ ...dbConfig, multipleStatements: true });

  const archivos = fs
    .readdirSync(SEEDS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  for (const archivo of archivos) {
    const sql = fs.readFileSync(path.join(SEEDS_DIR, archivo), 'utf8');
    try {
      await conn.query(sql);
      console.log(`✅ ${archivo} sembrado`);
    } catch (err) {
      console.error(`❌ Error sembrando ${archivo}`);
      await conn.end();
      throw err;
    }
  }

  console.log('Seeds completos.');
  await conn.end();
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
