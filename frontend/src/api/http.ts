// Implementación REAL de la API: habla con el backend usando fetch.
import { ErrorApi, SIN_CONEXION, mensajePorEstado } from './errores'
import type { ApiPerritos, FiltrosPerritos, Id, RespuestaError } from './tipos'

const TIEMPO_MAXIMO_CONSULTA_MS = 15_000
const TIEMPO_MAXIMO_ENVIO_MS = 45_000 // subir una foto con mala señal puede tardar

/** Convierte [{ field, message }] (formato del backend) en { campo: mensaje }. */
function camposDesdeDetalles(detalles: RespuestaError['error']['details']): Record<string, string> {
  return (detalles ?? [])
    .filter((detalle) => detalle.field && detalle.message)
    .reduce<Record<string, string>>((campos, { field, message }) => ({ ...campos, [field as string]: message as string }), {})
}

/** Lee el cuerpo de una respuesta con error y arma un ErrorApi con mensaje entendible. */
async function errorDesdeRespuesta(respuesta: Response): Promise<ErrorApi> {
  try {
    const { error } = (await respuesta.json()) as Partial<RespuestaError>
    const mensaje = error?.mensaje || error?.message || mensajePorEstado(respuesta.status)
    const campos = error?.campos ?? camposDesdeDetalles(error?.details)
    return new ErrorApi(mensaje, respuesta.status, campos)
  } catch {
    // El backend no mandó JSON (por ejemplo, un 502 del proxy). Usamos el mensaje por estado.
    return new ErrorApi(mensajePorEstado(respuesta.status), respuesta.status)
  }
}

/** Arma "?busqueda=luna&colorId=3" ignorando los filtros vacíos. */
function aQueryString(filtros: FiltrosPerritos): string {
  const pares = Object.entries(filtros)
    .filter(([, valor]) => valor !== undefined && valor !== '')
    .map(([llave, valor]) => [llave, String(valor)])
  const query = new URLSearchParams(pares).toString()
  return query ? `?${query}` : ''
}

function extensionDe(tipo: string): string {
  if (tipo === 'image/png') return 'png'
  if (tipo === 'image/webp') return 'webp'
  return 'jpg'
}

export function crearApiHttp(urlBase: string): ApiPerritos {
  /** Hace la petición y devuelve el JSON, o lanza ErrorApi si algo falla. */
  async function pedir<T>(ruta: string, opciones: RequestInit = {}, tiempoMaximo = TIEMPO_MAXIMO_CONSULTA_MS): Promise<T> {
    let respuesta: Response
    try {
      respuesta = await fetch(urlBase + ruta, {
        ...opciones,
        headers: { Accept: 'application/json', ...opciones.headers },
        signal: AbortSignal.timeout(tiempoMaximo),
      })
    } catch {
      // fetch sólo falla así si no hubo respuesta: sin red, servidor caído o tiempo agotado.
      throw new ErrorApi(mensajePorEstado(SIN_CONEXION), SIN_CONEXION)
    }
    if (!respuesta.ok) throw await errorDesdeRespuesta(respuesta)
    const cuerpo: unknown = await respuesta.json()
    // El backend actual envuelve las respuestas en { data: ... } (openspec); el contrato viejo no.
    const envuelto = typeof cuerpo === 'object' && cuerpo !== null && !Array.isArray(cuerpo) && 'data' in cuerpo
    return (envuelto ? (cuerpo as { data: T }).data : cuerpo) as T
  }

  return {
    listarPerritos: (filtros = {}) => pedir(`/perritos${aQueryString(filtros)}`),

    obtenerPerrito: (id: Id) => pedir(`/perritos/${encodeURIComponent(id)}`),

    crearPerrito(datos, foto, claveIdempotencia) {
      // multipart/form-data con campos individuales + la foto. No ponemos
      // Content-Type a mano: el navegador lo agrega con el "boundary" correcto.
      const formulario = new FormData()
      formulario.append('nombre', datos.nombre)
      if (datos.razaId !== null) formulario.append('razaId', String(datos.razaId))
      formulario.append('colorPrincipalId', String(datos.colorPrincipalId))
      for (const id of datos.coloresAdicionalesIds) {
        formulario.append('coloresAdicionalesIds', String(id))
      }
      formulario.append('latitud', String(datos.latitud))
      formulario.append('longitud', String(datos.longitud))
      formulario.append('foto', foto, `foto.${extensionDe(foto.type)}`)
      return pedir(
        '/perritos',
        {
          method: 'POST',
          body: formulario,
          // La misma clave en cada reintento: el backend devuelve el mismo perrito, no crea otro.
          headers: { 'Idempotency-Key': claveIdempotencia },
        },
        TIEMPO_MAXIMO_ENVIO_MS,
      )
    },

    listarRazas: () => pedir('/razas'),
    listarColores: () => pedir('/colores'),
  }
}
