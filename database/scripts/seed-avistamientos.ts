import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import type { Connection, RowDataPacket } from 'mysql2/promise';
import { loadDbEnv, type DbConfig } from '../../backend/src/config/env.js';
import { createScriptConnection } from '../../backend/src/db/pool.js';
import { cargarEnv } from './loadEnv.js';

/**
 * Avistamientos de prueba para las estadísticas y las zonas del Proyecto 2.
 *
 * Deja la base con al menos `TOTAL_AVISTAMIENTOS` perritos "avistamiento-NNNN",
 * repartidos en los últimos `DIAS` días, con razas, colores y lugares variados
 * (varios grupos alrededor de Saltillo, para que las zonas de concentración tengan sentido).
 *
 * Es **determinista** (el mismo generador pseudoaleatorio con semilla fija) e
 * **idempotente**: sólo inserta los que faltan, así que correrlo dos veces no duplica nada.
 */
export const TOTAL_AVISTAMIENTOS = 100;
const DIAS = 30;
const SEMILLA = 20260511;

// PNG 1x1 válido: foto de prueba sin versionar imágenes pesadas (igual que seed.ts).
const FOTO_PRUEBA = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
);

// Centros de los grupos de avistamientos (Saltillo y alrededores) y su dispersión en grados.
const GRUPOS: ReadonlyArray<{ lat: number; lon: number }> = [
  { lat: 25.4232, lon: -101.0053 }, // centro
  { lat: 25.4385, lon: -100.9741 }, // oriente
  { lat: 25.4012, lon: -101.0307 }, // poniente
  { lat: 25.4561, lon: -101.0128 }, // norte
  { lat: 25.3894, lon: -100.9852 }, // sur
];
const DISPERSION = 0.006; // ≈ 650 m

const SEXOS = ['macho', 'hembra'] as const;
const TAMANOS = ['pequeño', 'mediano', 'grande', 'gigante'] as const;
const PELAJES = ['corto', 'mediano', 'largo'] as const;
const ETAPAS = ['cachorro', 'adulto', 'senior'] as const;
const NOMBRES = [
  'Max', 'Nala', 'Bruno', 'Coco', 'Lola', 'Simba', 'Kira', 'Thor', 'Maya', 'Chato',
  'Pepa', 'Duque', 'Mora', 'Tango', 'Frida', 'Osito', 'Perla', 'Sultán', 'Ámbar', 'Pinto',
];

/** Generador pseudoaleatorio con semilla (mulberry32): mismos números en cada corrida. */
function crearAleatorio(semilla: number): () => number {
  let estado = semilla >>> 0;
  return () => {
    estado = (estado + 0x6d2b79f5) >>> 0;
    let t = estado;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface Catalogos {
  razas: number[];
  colores: number[];
  coloresOjos: number[];
  patrones: Array<{ id: number; nombre: string }>;
}

async function cargarCatalogos(conn: Connection): Promise<Catalogos> {
  const [razas] = await conn.query<RowDataPacket[]>('SELECT id_raza AS id FROM razas ORDER BY id_raza');
  const [colores] = await conn.query<RowDataPacket[]>('SELECT id_color AS id FROM colores ORDER BY id_color');
  const [ojos] = await conn.query<RowDataPacket[]>(
    'SELECT id_color_ojo AS id FROM colores_ojos ORDER BY id_color_ojo',
  );
  const [patrones] = await conn.query<RowDataPacket[]>(
    'SELECT id_patron AS id, patron AS nombre FROM patrones_pelaje ORDER BY id_patron',
  );

  return {
    razas: razas.map((fila) => Number(fila.id)),
    colores: colores.map((fila) => Number(fila.id)),
    coloresOjos: ojos.map((fila) => Number(fila.id)),
    patrones: patrones.map((fila) => ({ id: Number(fila.id), nombre: String(fila.nombre) })),
  };
}

export async function runSeedAvistamientos(
  config: DbConfig,
  rutaImagenes?: string,
  esLocal = true,
): Promise<void> {
  const conn = await createScriptConnection(config);

  try {
    const catalogos = await cargarCatalogos(conn);
    if (
      catalogos.razas.length === 0 ||
      catalogos.colores.length < 3 ||
      catalogos.coloresOjos.length === 0 ||
      catalogos.patrones.length === 0
    ) {
      throw new Error('Faltan catálogos: corre primero `npm run db:seed`.');
    }

    const [existentes] = await conn.query<RowDataPacket[]>(
      "SELECT ruta_imagen FROM perros WHERE ruta_imagen LIKE 'avistamiento-%'",
    );
    const yaCreados = new Set(existentes.map((fila) => String(fila.ruta_imagen)));

    const azar = crearAleatorio(SEMILLA);
    const elegir = <T>(lista: readonly T[]): T => lista[Math.floor(azar() * lista.length)] as T;

    let insertados = 0;

    for (let numero = 1; numero <= TOTAL_AVISTAMIENTOS; numero += 1) {
      const ruta = `avistamiento-${String(numero).padStart(4, '0')}.png`;

      // Se generan SIEMPRE los mismos valores para el mismo número (aunque el perrito ya exista),
      // para que lo que se inserte hoy sea igual a lo que se habría insertado en la primera corrida.
      const grupo = elegir(GRUPOS);
      const patron = elegir(catalogos.patrones);
      const principal = elegir(catalogos.colores);
      const adicionales =
        patron.nombre === 'Sólido'
          ? []
          : [...new Set([elegir(catalogos.colores), elegir(catalogos.colores)])]
              .filter((id) => id !== principal)
              .slice(0, Math.floor(azar() * 3));
      const perro = {
        nombre: elegir(NOMBRES),
        razaId: elegir(catalogos.razas),
        sexo: elegir(SEXOS),
        patronId: patron.id,
        ojosId: elegir(catalogos.coloresOjos),
        pelaje: elegir(PELAJES),
        tamano: elegir(TAMANOS),
        etapa: elegir(ETAPAS),
        latitud: Number((grupo.lat + (azar() - 0.5) * 2 * DISPERSION).toFixed(6)),
        longitud: Number((grupo.lon + (azar() - 0.5) * 2 * DISPERSION).toFixed(6)),
        // Hace entre 0 y DIAS días (incluidas las horas), para que haya registros en muchos días.
        minutosAtras: Math.floor(azar() * DIAS * 24 * 60),
      };

      if (yaCreados.has(ruta)) continue;

      const [resultado] = await conn.query(
        `INSERT INTO perros
           (nombre, id_raza, sexo, id_patron, id_color_ojo, longitud_pelaje, tamano, etapa_vida,
            marcas_distintivas, latitud, longitud, ruta_imagen, fecha_registro)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL, ?, ?, ?, NOW() - INTERVAL ? MINUTE)`,
        [
          perro.nombre,
          perro.razaId,
          perro.sexo,
          perro.patronId,
          perro.ojosId,
          perro.pelaje,
          perro.tamano,
          perro.etapa,
          perro.latitud,
          perro.longitud,
          ruta,
          perro.minutosAtras,
        ],
      );
      const idPerro = (resultado as { insertId: number }).insertId;

      await conn.query('INSERT INTO perro_colores (id_perro, id_color, es_dominante) VALUES ?', [
        [[idPerro, principal, 1], ...adicionales.map((id) => [idPerro, id, 0])],
      ]);

      if (rutaImagenes && esLocal) {
        await mkdir(rutaImagenes, { recursive: true });
        await writeFile(path.join(rutaImagenes, ruta), FOTO_PRUEBA);
      }
      insertados += 1;
    }

    console.log(
      `+ ${insertados} avistamientos de prueba nuevos (en total hay ${TOTAL_AVISTAMIENTOS} "avistamiento-NNNN").`,
    );
  } finally {
    await conn.end();
  }
}

async function main(): Promise<void> {
  cargarEnv();
  await runSeedAvistamientos(
    loadDbEnv(),
    process.env.RUTA_IMAGENES,
    (process.env.STORAGE_DRIVER ?? 'local') !== 's3',
  );
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
}
