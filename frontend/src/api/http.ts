// Implementación REAL de la API: habla con el backend usando fetch.
import { ahoraIsoConOffset } from '../utils/fecha'
import { conHex } from '../utils/transformaciones'
import { ErrorApi, SIN_CONEXION, mensajePorEstado } from './errores'
import type { ApiPerritos, Color, FiltrosPerritos, Id, PatronPelaje, Perrito, Raza, RespuestaError } from './tipos'

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
    const mensaje = error?.message || mensajePorEstado(respuesta.status)
    return new ErrorApi(mensaje, respuesta.status, camposDesdeDetalles(error?.details))
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
  /** Hace la petición y devuelve el contenido de { data }, o lanza ErrorApi si algo falla. */
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
    const cuerpo = (await respuesta.json()) as { data: T }
    return cuerpo.data
  }

  /**
   * Completa lo que el backend puede no mandar:
   * - la foto: si no viene fotoUrl, se usa el endpoint que ya existe (GET /perritos/{id}/foto);
   * - el tono de cada color, para pintar las muestras;
   * - los campos opcionales ausentes quedan en null ("no se sabe").
   */
  function normalizarPerrito(crudo: Partial<Perrito> & Pick<Perrito, 'id'>): Perrito {
    const fotoUrl = crudo.fotoUrl || `${urlBase}/perritos/${encodeURIComponent(crudo.id)}/foto`
    return {
      ...crudo,
      nombre: crudo.nombre ?? '',
      fotoUrl,
      miniaturaUrl: crudo.miniaturaUrl || fotoUrl,
      raza: crudo.raza ?? null,
      colorPrincipal: conHex(crudo.colorPrincipal ?? { id: 0, nombre: 'Sin color' }),
      coloresAdicionales: (crudo.coloresAdicionales ?? []).map(conHex),
      sexo: crudo.sexo ?? null,
      etapaVida: crudo.etapaVida ?? null,
      tamano: crudo.tamano ?? null,
      longitudPelaje: crudo.longitudPelaje ?? null,
      patronPelaje: crudo.patronPelaje ?? null,
      colorOjos: crudo.colorOjos ? conHex(crudo.colorOjos) : null,
      marcasDistintivas: crudo.marcasDistintivas || null,
      latitud: Number(crudo.latitud), // DECIMAL de MySQL puede llegar como texto
      longitud: Number(crudo.longitud),
      fechaRegistro: crudo.fechaRegistro ?? new Date().toISOString(),
    }
  }

  const listarColores = async () => (await pedir<Color[]>('/colores')).map(conHex)
  const listarColoresOjos = async () => (await pedir<Color[]>('/colores-ojos')).map(conHex)
  const listarRazas = () => pedir<Raza[]>('/razas')
  const listarPatronesPelaje = () => pedir<PatronPelaje[]>('/patrones-pelaje')

  return {
    listarPerritos: async (filtros = {}) =>
      (await pedir<Perrito[]>(`/perritos${aQueryString(filtros)}`)).map(normalizarPerrito),

    obtenerPerrito: async (id: Id) => normalizarPerrito(await pedir<Perrito>(`/perritos/${encodeURIComponent(id)}`)),

    async crearPerrito(datos, foto, claveIdempotencia) {
      // multipart/form-data: un campo "datos" con JSON y un campo "foto" con el archivo.
      // No ponemos Content-Type a mano: el navegador lo agrega con el "boundary" correcto.
      const formulario = new FormData()
      // Momento del registro con la zona horaria del dispositivo.
      formulario.append('fechaRegistro', ahoraIsoConOffset())
      formulario.append('nombre', datos.nombre)
      if (datos.razaId !== null) formulario.append('razaId', String(datos.razaId))
      if (datos.sexo !== null) formulario.append('sexo', datos.sexo)
      if (datos.etapaVida !== null) formulario.append('etapaVida', datos.etapaVida)
      if (datos.tamano !== null) formulario.append('tamano', datos.tamano)
      if (datos.longitudPelaje !== null) formulario.append('longitudPelaje', datos.longitudPelaje)
      if (datos.patronPelajeId !== null) formulario.append('patronPelajeId', String(datos.patronPelajeId))
      if (datos.colorOjosId !== null) formulario.append('colorOjosId', String(datos.colorOjosId))
      if (datos.marcasDistintivas !== null) formulario.append('marcasDistintivas', datos.marcasDistintivas)
      formulario.append('colorPrincipalId', String(datos.colorPrincipalId))
      for (const id of datos.coloresAdicionalesIds) {
        formulario.append('coloresAdicionalesIds', String(id))
      }
      formulario.append('latitud', String(datos.latitud))
      formulario.append('longitud', String(datos.longitud))
      formulario.append('foto', foto, `foto.${extensionDe(foto.type)}`)
      const creado = await pedir<Perrito>(
        '/perritos',
        {
          method: 'POST',
          body: formulario,
          // La misma clave en cada reintento: el backend devuelve el mismo perrito, no crea otro.
          headers: { 'Idempotency-Key': claveIdempotencia },
        },
        TIEMPO_MAXIMO_ENVIO_MS,
      )
      return normalizarPerrito(creado)
    },

    listarRazas,
    listarColores,
    listarColoresOjos,
    listarPatronesPelaje,

    async cargarCatalogos() {
      const [razas, colores, coloresOjos, patronesPelaje] = await Promise.all([
        listarRazas(),
        listarColores(),
        listarColoresOjos(),
        listarPatronesPelaje(),
      ])
      return { razas, colores, coloresOjos, patronesPelaje }
    },
  }
}
