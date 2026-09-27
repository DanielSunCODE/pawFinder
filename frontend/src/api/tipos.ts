// ─────────────────────────────────────────────────────────────────────────────
// CONTRATO DE LA API, visto desde el frontend.
// Debe coincidir con lo que acuerde el equipo (contrato-api.md / openspec).
// Si el backend cambia un nombre o un tipo, se cambia aquí y en ese documento.
// ─────────────────────────────────────────────────────────────────────────────

/** Identificador numérico que genera PostgreSQL. Si el backend usa UUID, cambiar a `string`. */
export type Id = number

export interface Raza {
  id: Id
  nombre: string
}

export interface Color {
  id: Id
  nombre: string
  /** Color para pintar la muestra, formato "#RRGGBB". Puede venir null. */
  hex: string | null
}

/** Un perrito tal como lo devuelve la API (lista y detalle usan la misma forma). */
export interface Perrito {
  id: Id
  nombre: string
  /** URL de la foto completa, servida por un endpoint del backend. */
  fotoUrl: string
  /** URL de la miniatura. Si el backend no genera miniaturas, manda la misma que fotoUrl. */
  miniaturaUrl: string
  /** null = no se especificó raza. "Sin raza definida / criollo" es una raza más del catálogo. */
  raza: Raza | null
  colorPrincipal: Color
  /** De 0 a 2 colores, sin repetir ni incluir el principal. */
  coloresAdicionales: Color[]
  latitud: number
  longitud: number
  /** Fecha y hora ISO 8601 que pone el servidor, por ejemplo "2026-09-22T18:40:00-06:00". */
  fechaRegistro: string
}

/** Filtros de la lista. Se mandan como query params y se resuelven en SQL, no en el navegador. */
export interface FiltrosPerritos {
  busqueda?: string
  colorId?: Id
  razaId?: Id
}

/** Datos que se envían al registrar (la foto va aparte, en el mismo multipart). */
export interface NuevoPerrito {
  nombre: string
  razaId: Id | null
  colorPrincipalId: Id
  coloresAdicionalesIds: Id[]
  latitud: number
  longitud: number
}

/** Forma de cualquier respuesta de error del backend. */
/**
 * Cuerpo de una respuesta con error. Se aceptan los dos formatos que hay en el equipo:
 * - el del backend actual (openspec):  { error: { message, details: [{ field, message }] } }
 * - el de docs/contrato-api.md:        { error: { mensaje, campos: { campo: mensaje } } }
 * Cuando el equipo fije uno solo, se puede quitar el otro.
 */
export interface RespuestaError {
  error: {
    /** Mensaje para humanos, en español. Nunca "Error 400". */
    message?: string
    mensaje?: string
    /** Errores por campo (formato del backend actual). */
    details?: { field?: string; message?: string }[]
    /** Errores por campo, con las mismas llaves que NuevoPerrito, más "foto". */
    campos?: Record<string, string>
  }
}

/** Todo lo que el frontend le puede pedir al backend (implementado en http.ts). */
export interface ApiPerritos {
  listarPerritos(filtros?: FiltrosPerritos): Promise<Perrito[]>
  obtenerPerrito(id: Id): Promise<Perrito>
  crearPerrito(datos: NuevoPerrito, foto: File, claveIdempotencia: string): Promise<Perrito>
  listarRazas(): Promise<Raza[]>
  listarColores(): Promise<Color[]>
}
