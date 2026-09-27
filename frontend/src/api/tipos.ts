// ─────────────────────────────────────────────────────────────────────────────
// Datos que el frontend recibe y envía, con los campos de la base de datos
// (database/migrations/001_catalogs.sql y 002_dogs.sql).
// Si el backend cambia un nombre o un tipo, se ajusta aquí y en http.ts.
// ─────────────────────────────────────────────────────────────────────────────

/** Identificador numérico que genera MySQL (AUTO_INCREMENT). */
export type Id = number

/** Un elemento de catálogo: razas, patrones de pelaje… */
export interface ElementoCatalogo {
  id: Id
  nombre: string
}

export type Raza = ElementoCatalogo
export type PatronPelaje = ElementoCatalogo

/** Colores de pelo y de ojos. `hex` sirve para pintar la muestra; si no viene, el frontend usa uno propio. */
export interface Color extends ElementoCatalogo {
  hex?: string | null
}

// Valores fijos que acepta la base (CHECK en 002_dogs.sql). Se envían tal cual, con ñ incluida.
export const SEXOS = ['macho', 'hembra'] as const
export const TAMANOS = ['pequeño', 'mediano', 'grande', 'gigante'] as const
export const LONGITUDES_PELAJE = ['corto', 'mediano', 'largo'] as const
export const ETAPAS_VIDA = ['cachorro', 'adulto', 'senior'] as const

export type Sexo = (typeof SEXOS)[number]
export type Tamano = (typeof TAMANOS)[number]
export type LongitudPelaje = (typeof LONGITUDES_PELAJE)[number]
export type EtapaVida = (typeof ETAPAS_VIDA)[number]

/** Un perrito tal como lo devuelve la API (lista y detalle usan la misma forma). */
export interface Perrito {
  id: Id
  nombre: string
  /** URL de la foto. Si el backend no la manda, se usa GET /api/perritos/{id}/foto. */
  fotoUrl: string
  /** URL de la miniatura. Si no viene, se usa la misma foto. */
  miniaturaUrl: string
  /** Obligatoria en la base; "Sin raza definida / Criollo" es una raza más del catálogo. */
  raza: Raza | null
  colorPrincipal: Color
  /** De 0 a 2 colores, sin repetir ni incluir el principal. */
  coloresAdicionales: Color[]
  // Obligatorios en la base y en la API. Se tipan como `| null` solo para
  // tolerar respuestas viejas o incompletas; el formulario los exige.
  sexo: Sexo | null
  etapaVida: EtapaVida | null
  tamano: Tamano | null
  longitudPelaje: LongitudPelaje | null
  patronPelaje: PatronPelaje | null
  colorOjos: Color | null
  marcasDistintivas: string | null
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
  razaId: Id
  colorPrincipalId: Id
  coloresAdicionalesIds: Id[]
  sexo: Sexo | null
  etapaVida: EtapaVida | null
  tamano: Tamano | null
  longitudPelaje: LongitudPelaje | null
  patronPelajeId: Id | null
  colorOjosId: Id | null
  marcasDistintivas: string | null
  latitud: number
  longitud: number
}

/** Todos los catálogos que usa el formulario, cargados de una vez. */
export interface Catalogos {
  razas: Raza[]
  colores: Color[]
  coloresOjos: Color[]
  patronesPelaje: PatronPelaje[]
}

/** Cuerpo de una respuesta con error del backend: { error: { message, details: [{ field, message }] } }. */
export interface RespuestaError {
  error: {
    /** Mensaje para humanos, en español. Nunca "Error 400". */
    message?: string
    /** Errores por campo. */
    details?: { field?: string; message?: string }[]
  }
}

/** Todo lo que el frontend le puede pedir al backend (implementado en http.ts). */
export interface ApiPerritos {
  listarPerritos(filtros?: FiltrosPerritos): Promise<Perrito[]>
  obtenerPerrito(id: Id): Promise<Perrito>
  crearPerrito(datos: NuevoPerrito, foto: File, claveIdempotencia: string): Promise<Perrito>
  listarRazas(): Promise<Raza[]>
  listarColores(): Promise<Color[]>
  listarColoresOjos(): Promise<Color[]>
  listarPatronesPelaje(): Promise<PatronPelaje[]>
  /** Los cuatro catálogos en paralelo. */
  cargarCatalogos(): Promise<Catalogos>
}
