// Errores de la API convertidos en mensajes que una persona entiende.
// Regla del proyecto: "Falta la foto" sí; "Error 400" no.

/** Estado 0 = no hubo respuesta del servidor (sin señal, servidor apagado, tiempo agotado). */
export const SIN_CONEXION = 0

const MENSAJES_POR_ESTADO: Record<number, string> = {
  [SIN_CONEXION]: 'No pudimos conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.',
  400: 'Hay datos que corregir antes de guardar.',
  404: 'No encontramos lo que buscabas. Puede que el enlace esté mal o que el registro ya no exista.',
  413: 'La foto pesa demasiado. Intenta con otra o vuelve a tomarla.',
  415: 'La foto debe ser JPG, PNG o WEBP.',
  422: 'Hay datos que corregir antes de guardar.',
  429: 'Hiciste demasiados intentos seguidos. Espera un momento y vuelve a intentar.',
}

const MENSAJE_ERROR_SERVIDOR = 'El servidor tuvo un problema. Inténtalo de nuevo en unos segundos.'
const MENSAJE_GENERICO = 'Algo salió mal. Inténtalo de nuevo.'

export function mensajePorEstado(estado: number): string {
  if (estado >= 500) return MENSAJE_ERROR_SERVIDOR
  return MENSAJES_POR_ESTADO[estado] ?? MENSAJE_GENERICO
}

export class ErrorApi extends Error {
  /** Código HTTP, o SIN_CONEXION si no hubo respuesta. */
  readonly estado: number
  /** Errores por campo que mandó el backend (por ejemplo { nombre: "Falta el nombre" }). */
  readonly campos: Record<string, string>

  constructor(mensaje: string, estado: number, campos: Record<string, string> = {}) {
    super(mensaje)
    this.name = 'ErrorApi'
    this.estado = estado
    this.campos = campos
  }
}

/** Convierte cualquier error en un texto para mostrar en pantalla. */
export function mensajeDeError(error: unknown): string {
  if (error instanceof ErrorApi) return error.message
  return MENSAJE_GENERICO
}

/** ¿Vale la pena reintentar? Sólo si no hubo respuesta o el servidor estaba saturado. */
export function esErrorReintentable(error: unknown): boolean {
  return error instanceof ErrorApi && [SIN_CONEXION, 502, 503, 504].includes(error.estado)
}
