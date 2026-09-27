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
  razaId: number;
  razaNombre: string;
  sexo: string;
  etapaVida: string;
  tamano: string;
  longitudPelaje: string;
  marcasDistintivas: string | null;
  patronPelajeId: number;
  patronPelajeNombre: string;
  colorOjosId: number;
  colorOjosNombre: string;
  latitud: number;
  longitud: number;
  fechaRegistro: string;
  rutaImagen: string;
  colores: ColorRegistro[];
}

export interface NuevoPerritoGuardado {
  nombre: string;
  razaId: number;
  sexo: string;
  etapaVida: string;
  tamano: string;
  longitudPelaje: string;
  marcasDistintivas: string | null;
  patronPelajeId: number;
  colorOjosId: number;
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
  listarColoresOjos(): Promise<CatalogoItem[]>;
  listarPatronesPelaje(): Promise<CatalogoItem[]>;
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
  id_raza: number;
  raza: string;
  sexo: string;
  etapa_vida: string;
  tamano: string;
  longitud_pelaje: string;
  marcas_distintivas: string | null;
  id_patron: number;
  patron: string;
  id_color_ojo: number;
  color_ojo: string;
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
    p.sexo, p.etapa_vida, p.tamano, p.longitud_pelaje, p.marcas_distintivas,
    r.id_raza, r.raza,
    pp.id_patron, pp.patron,
    co.id_color_ojo, co.color_ojo,
    c.id_color, c.color, pc.es_dominante
  FROM perros p
  LEFT JOIN razas r ON r.id_raza = p.id_raza
  LEFT JOIN patrones_pelaje pp ON pp.id_patron = p.id_patron
  LEFT JOIN colores_ojos co ON co.id_color_ojo = p.id_color_ojo
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
      sexo: fila.sexo,
      etapaVida: fila.etapa_vida,
      tamano: fila.tamano,
      longitudPelaje: fila.longitud_pelaje,
      marcasDistintivas: fila.marcas_distintivas,
      patronPelajeId: fila.id_patron,
      patronPelajeNombre: fila.patron,
      colorOjosId: fila.id_color_ojo,
      colorOjosNombre: fila.color_ojo,
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
          `INSERT INTO perros
             (nombre, id_raza, sexo, id_patron, id_color_ojo, longitud_pelaje, tamano, etapa_vida, marcas_distintivas, latitud, longitud, ruta_imagen)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            datos.nombre,
            datos.razaId,
            datos.sexo,
            datos.patronPelajeId,
            datos.colorOjosId,
            datos.longitudPelaje,
            datos.tamano,
            datos.etapaVida,
            datos.marcasDistintivas,
            datos.latitud,
            datos.longitud,
            datos.rutaImagen,
          ],
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
          throw new HttpError(
            400,
            'La raza, el color, el patrón de pelaje o el color de ojos indicado no existe.',
          );
        }
        if (esCodigo(error, 'ER_BAD_NULL_ERROR')) {
          throw new HttpError(400, 'Falta un dato obligatorio del registro.');
        }
        if (esCodigo(error, 'ER_DATA_TOO_LONG')) {
          throw new HttpError(400, 'Uno de los textos del registro es demasiado largo.');
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

    async listarColoresOjos() {
      const [filas] = await pool.query<RowDataPacket[]>(
        'SELECT id_color_ojo AS id, color_ojo AS nombre FROM colores_ojos ORDER BY color_ojo ASC',
      );
      return filas.map((fila) => ({ id: fila.id as number, nombre: fila.nombre as string }));
    },

    async listarPatronesPelaje() {
      const [filas] = await pool.query<RowDataPacket[]>(
        'SELECT id_patron AS id, patron AS nombre FROM patrones_pelaje ORDER BY patron ASC',
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
