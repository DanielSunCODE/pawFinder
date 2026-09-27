import type { Pool, ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { HttpError } from '../middleware/errorHandler.js';
import type { FiltrosPerritos } from '../schemas/perrito.js';

export interface ColorRegistro {
  id: number;
  nombre: string;
  esDominante: boolean;
}

export interface PerritoRegistro {
  id: number;
  nombre: string;
  razaId: number | null;
  razaNombre: string | null;
  latitud: number;
  longitud: number;
  fechaRegistro: string;
  rutaImagen: string;
  colores: ColorRegistro[];
}

export interface NuevoPerritoGuardado {
  nombre: string;
  razaId: number | null;
  colorPrincipalId: number;
  coloresAdicionalesIds: number[];
  latitud: number;
  longitud: number;
  rutaImagen: string;
}

export interface CatalogoItem {
  id: number;
  nombre: string;
}

export interface ConteoPorColor {
  id: number;
  nombre: string;
  total: number;
}

export interface ResultadoCreacion {
  perrito: PerritoRegistro;
  replay: boolean;
}

export interface PerritosRepository {
  listar(filtros: FiltrosPerritos): Promise<PerritoRegistro[]>;
  obtener(id: number): Promise<PerritoRegistro | null>;
  buscarPorIdempotencia(clave: string): Promise<PerritoRegistro | null>;
  crear(datos: NuevoPerritoGuardado, clave: string): Promise<ResultadoCreacion>;
  listarRazas(): Promise<CatalogoItem[]>;
  listarColores(): Promise<CatalogoItem[]>;
  estadisticasPorColor(): Promise<ConteoPorColor[]>;
  contarPerritos(): Promise<number>;
}

interface FilaPerrito extends RowDataPacket {
  id_perro: number;
  nombre: string;
  latitud: string | number;
  longitud: string | number;
  fecha_registro: Date | string;
  ruta_imagen: string;
  id_raza: number | null;
  raza: string | null;
  id_color: number | null;
  color: string | null;
  es_dominante: number | null;
}

/**
 * JOIN declarativo: un perrito con su raza (LEFT) y sus colores (LEFT). Las
 * filas se agrupan en memoria solo para dar forma a la respuesta; el filtrado,
 * el orden y la agregación ocurren en SQL.
 */
const SELECT_PERRITO = `
  SELECT
    p.id_perro, p.nombre, p.latitud, p.longitud, p.fecha_registro, p.ruta_imagen,
    r.id_raza, r.raza,
    c.id_color, c.color, pc.es_dominante
  FROM perros p
  LEFT JOIN razas r ON r.id_raza = p.id_raza
  LEFT JOIN perro_colores pc ON pc.id_perro = p.id_perro
  LEFT JOIN colores c ON c.id_color = pc.id_color
`;

function aColor(fila: FilaPerrito): ColorRegistro | null {
  if (fila.id_color === null || fila.color === null) return null;
  return { id: fila.id_color, nombre: fila.color, esDominante: fila.es_dominante === 1 };
}

/** Agrupa filas del JOIN en perritos con sus colores, sin mutar la entrada. */
function agrupar(filas: FilaPerrito[]): PerritoRegistro[] {
  const porId = filas.reduce<Map<number, PerritoRegistro>>((acc, fila) => {
    const color = aColor(fila);
    const existente = acc.get(fila.id_perro);

    if (existente) {
      acc.set(fila.id_perro, {
        ...existente,
        colores: color ? [...existente.colores, color] : existente.colores,
      });
      return acc;
    }

    acc.set(fila.id_perro, {
      id: fila.id_perro,
      nombre: fila.nombre,
      razaId: fila.id_raza,
      razaNombre: fila.raza,
      latitud: Number(fila.latitud),
      longitud: Number(fila.longitud),
      fechaRegistro: new Date(fila.fecha_registro).toISOString(),
      rutaImagen: fila.ruta_imagen,
      colores: color ? [color] : [],
    });
    return acc;
  }, new Map());

  return [...porId.values()];
}

function esCodigo(error: unknown, codigo: string): boolean {
  return (
    typeof error === 'object' && error !== null && (error as { code?: string }).code === codigo
  );
}

export function createPerritosRepository(pool: Pool): PerritosRepository {
  async function obtener(id: number): Promise<PerritoRegistro | null> {
    const [filas] = await pool.query<FilaPerrito[]>(`${SELECT_PERRITO} WHERE p.id_perro = ?`, [id]);
    const [perrito] = agrupar(filas);
    return perrito ?? null;
  }

  async function buscarPorIdempotencia(clave: string): Promise<PerritoRegistro | null> {
    const [filas] = await pool.query<FilaPerrito[]>(
      `${SELECT_PERRITO} WHERE p.id_perro = (SELECT id_perro FROM idempotencia WHERE idempotency_key = ?)`,
      [clave],
    );
    const [perrito] = agrupar(filas);
    return perrito ?? null;
  }

  return {
    obtener,
    buscarPorIdempotencia,

    async listar(filtros) {
      const condiciones: string[] = [];
      const valores: unknown[] = [];

      if (filtros.busqueda) {
        condiciones.push('p.nombre LIKE ?');
        valores.push(`%${filtros.busqueda}%`);
      }
      if (filtros.colorId) {
        condiciones.push(
          'EXISTS (SELECT 1 FROM perro_colores x WHERE x.id_perro = p.id_perro AND x.id_color = ?)',
        );
        valores.push(filtros.colorId);
      }
      if (filtros.razaId) {
        condiciones.push('p.id_raza = ?');
        valores.push(filtros.razaId);
      }

      const where = condiciones.length > 0 ? `WHERE ${condiciones.join(' AND ')}` : '';
      const [filas] = await pool.query<FilaPerrito[]>(
        `${SELECT_PERRITO} ${where} ORDER BY p.fecha_registro DESC, p.id_perro DESC`,
        valores,
      );
      return agrupar(filas);
    },

    async crear(datos, clave) {
      const conn = await pool.getConnection();
      try {
        await conn.beginTransaction();

        const [resultado] = await conn.query<ResultSetHeader>(
          'INSERT INTO perros (nombre, id_raza, latitud, longitud, ruta_imagen) VALUES (?, ?, ?, ?, ?)',
          [datos.nombre, datos.razaId, datos.latitud, datos.longitud, datos.rutaImagen],
        );
        const id = resultado.insertId;

        const colores = [
          { id: datos.colorPrincipalId, dominante: 1 },
          ...datos.coloresAdicionalesIds.map((idColor) => ({ id: idColor, dominante: 0 })),
        ];
        for (const color of colores) {
          await conn.query(
            'INSERT INTO perro_colores (id_perro, id_color, es_dominante) VALUES (?, ?, ?)',
            [id, color.id, color.dominante],
          );
        }

        await conn.query('INSERT INTO idempotencia (idempotency_key, id_perro) VALUES (?, ?)', [
          clave,
          id,
        ]);
        await conn.commit();

        const perrito = await obtener(id);
        if (!perrito) throw new HttpError(500, 'No se pudo leer el perrito recién creado.');
        return { perrito, replay: false };
      } catch (error) {
        await conn.rollback();

        if (esCodigo(error, 'ER_DUP_ENTRY')) {
          const existente = await buscarPorIdempotencia(clave);
          if (existente) return { perrito: existente, replay: true };
        }
        if (esCodigo(error, 'ER_NO_REFERENCED_ROW_2')) {
          throw new HttpError(400, 'La raza o el color indicado no existe.');
        }
        throw error;
      } finally {
        conn.release();
      }
    },

    async listarRazas() {
      const [filas] = await pool.query<RowDataPacket[]>(
        'SELECT id_raza AS id, raza AS nombre FROM razas ORDER BY raza ASC',
      );
      return filas.map((fila) => ({ id: fila.id as number, nombre: fila.nombre as string }));
    },

    async listarColores() {
      const [filas] = await pool.query<RowDataPacket[]>(
        'SELECT id_color AS id, color AS nombre FROM colores ORDER BY color ASC',
      );
      return filas.map((fila) => ({ id: fila.id as number, nombre: fila.nombre as string }));
    },

    async estadisticasPorColor() {
      const [filas] = await pool.query<RowDataPacket[]>(
        `SELECT c.id_color AS id, c.color AS nombre, COUNT(*) AS total
         FROM perro_colores pc
         JOIN colores c ON c.id_color = pc.id_color
         GROUP BY c.id_color, c.color
         ORDER BY total DESC, c.color ASC`,
      );
      return filas.map((fila) => ({
        id: fila.id as number,
        nombre: fila.nombre as string,
        total: Number(fila.total),
      }));
    },

    async contarPerritos() {
      const [filas] = await pool.query<RowDataPacket[]>('SELECT COUNT(*) AS total FROM perros');
      return Number(filas[0]?.total ?? 0);
    },
  };
}
