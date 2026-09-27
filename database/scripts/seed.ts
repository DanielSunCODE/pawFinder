import { readdirSync, readFileSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import type { Connection } from 'mysql2/promise';
import { loadDbEnv, type DbConfig } from '../../backend/src/config/env.js';
import { createScriptConnection } from '../../backend/src/db/pool.js';
import { cargarEnv } from './loadEnv.js';

const aqui = path.dirname(fileURLToPath(import.meta.url));
const SEEDS_DIR = path.resolve(aqui, '..', 'seeds');

// PNG 1x1 valido: foto de prueba sin versionar imagenes pesadas.
const FOTO_PRUEBA = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
);

export interface OpcionesSeed {
  rutaImagenes?: string;
  esLocal: boolean;
}

interface FilaFoto {
  ruta_imagen: string;
}

async function generarFotosDePrueba(conn: Connection, rutaImagenes: string): Promise<number> {
  const [filas] = await conn.query('SELECT ruta_imagen FROM perros');
  let generadas = 0;

  for (const fila of filas as FilaFoto[]) {
    const destino = path.join(rutaImagenes, path.basename(fila.ruta_imagen));
    await mkdir(path.dirname(destino), { recursive: true });
    await writeFile(destino, FOTO_PRUEBA);
    generadas += 1;
  }

  return generadas;
}

export async function runSeeds(config: DbConfig, opciones: OpcionesSeed): Promise<void> {
  const conn = await createScriptConnection(config);

  try {
    const archivos = readdirSync(SEEDS_DIR)
      .filter((f) => f.endsWith('.sql'))
      .sort();

    for (const archivo of archivos) {
      const sql = readFileSync(path.join(SEEDS_DIR, archivo), 'utf8');
      await conn.query(sql);
      console.log(`+ ${archivo} sembrado`);
    }

    if (opciones.rutaImagenes && opciones.esLocal) {
      const generadas = await generarFotosDePrueba(conn, opciones.rutaImagenes);
      console.log(`+ ${generadas} fotos de prueba generadas en ${opciones.rutaImagenes}`);
    } else {
      console.log(
        '= Fotos de prueba omitidas (usa STORAGE_DRIVER=local con RUTA_IMAGENES, o sube las fotos al bucket).',
      );
    }

    console.log('Seeds completos.');
  } finally {
    await conn.end();
  }
}

async function main(): Promise<void> {
  cargarEnv();
  await runSeeds(loadDbEnv(), {
    rutaImagenes: process.env.RUTA_IMAGENES,
    esLocal: (process.env.STORAGE_DRIVER ?? 'local') !== 's3',
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
}
