// Llamadas al servicio Elixir del Proyecto 2 (todo lo que empieza con /f).
//
// Base compartida por las tres funcionalidades: cada una agrega su propio archivo
// (por ejemplo zonas.ts) que usa `pedirFuncional`. Las respuestas llegan como
// { data: ... } y los errores como { error: { message } }, igual que en el backend del P1.
import { config } from '../config'
import { ErrorApi, SIN_CONEXION, mensajePorEstado } from './errores'

const TIEMPO_MAXIMO_MS = 15_000

/** Pide `ruta` al servicio Elixir y devuelve el contenido de { data }, o lanza ErrorApi. */
export async function pedirFuncional<T>(ruta: string, opciones: RequestInit = {}): Promise<T> {
  let respuesta: Response
  try {
    respuesta = await fetch(config.funcionalUrl + ruta, {
      ...opciones,
      headers: { Accept: 'application/json', ...opciones.headers },
      signal: AbortSignal.timeout(TIEMPO_MAXIMO_MS),
    })
  } catch {
    // Sin respuesta: sin red, servicio apagado o tiempo agotado.
    throw new ErrorApi(mensajePorEstado(SIN_CONEXION), SIN_CONEXION)
  }

  const cuerpo = (await respuesta.json().catch(() => null)) as { data?: T; error?: { message?: string } } | null
  if (!respuesta.ok) {
    throw new ErrorApi(cuerpo?.error?.message || mensajePorEstado(respuesta.status), respuesta.status)
  }
  return cuerpo?.data as T
}
