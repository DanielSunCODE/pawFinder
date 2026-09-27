// Implementación de PRUEBA de la API: guarda todo en memoria (se pierde al recargar).
// Imita lo que hará el backend, incluida la idempotencia y los errores por campo,
// para que el frontend se pueda probar completo antes de que exista el backend.
//
// Importante: aquí se filtra con JavaScript sólo porque no hay base de datos.
// En la app real eso lo resuelve PostgreSQL (WHERE, JOIN), no el navegador.
import { ErrorApi, mensajePorEstado } from '../errores'
import type { ApiPerritos, Color, FiltrosPerritos, NuevoPerrito, Perrito } from '../tipos'
import { COLORES, RAZAS, crearPerritosDePrueba } from './datos'

const esperar = (ms: number) => new Promise((resolver) => setTimeout(resolver, ms))
const latencia = () => esperar(250 + Math.random() * 350)

const sinAcentos = (texto: string) =>
  texto.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()

function coincide(perrito: Perrito, filtros: FiltrosPerritos): boolean {
  const { busqueda, colorId, razaId } = filtros
  const colores = [perrito.colorPrincipal, ...perrito.coloresAdicionales]
  return (
    (!busqueda || sinAcentos(perrito.nombre).includes(sinAcentos(busqueda))) &&
    (colorId === undefined || colores.some((c) => c.id === colorId)) &&
    (razaId === undefined || perrito.raza?.id === razaId)
  )
}

/** Misma validación que debe hacer el backend (el frontend nunca es la única defensa). */
function validarComoBackend(datos: NuevoPerrito, foto: File | null): Record<string, string> {
  const colorExiste = (id: number) => COLORES.some((c) => c.id === id)
  const adicionales = datos.coloresAdicionalesIds ?? []
  const errores: Record<string, string> = {}
  if (!foto) errores.foto = 'Falta la foto.'
  else if (!['image/jpeg', 'image/png', 'image/webp'].includes(foto.type)) errores.foto = 'La foto debe ser JPG, PNG o WEBP.'
  if (!datos.nombre?.trim()) errores.nombre = 'Falta el nombre.'
  if (!colorExiste(datos.colorPrincipalId)) errores.colorPrincipalId = 'Falta el color principal.'
  if (adicionales.length > 2) errores.coloresAdicionalesIds = 'Máximo 2 colores adicionales.'
  else if (new Set(adicionales).size !== adicionales.length || adicionales.includes(datos.colorPrincipalId))
    errores.coloresAdicionalesIds = 'Los colores no se pueden repetir.'
  else if (!adicionales.every(colorExiste)) errores.coloresAdicionalesIds = 'Hay un color que no existe.'
  if (!(Math.abs(datos.latitud) <= 90)) errores.latitud = 'Falta la ubicación.'
  if (!(Math.abs(datos.longitud) <= 180)) errores.longitud = 'Falta la ubicación.'
  return errores
}

export function crearApiMock(): ApiPerritos {
  let perritos = crearPerritosDePrueba()
  const respuestasPorClave = new Map<string, Perrito>()

  const buscarColor = (id: number) => COLORES.find((c) => c.id === id) as Color

  return {
    async listarPerritos(filtros = {}) {
      await latencia()
      return perritos.filter((p) => coincide(p, filtros))
    },

    async obtenerPerrito(id) {
      await latencia()
      const perrito = perritos.find((p) => p.id === id)
      if (!perrito) throw new ErrorApi('No encontramos ese perrito. Puede que el enlace esté mal.', 404)
      return perrito
    },

    async crearPerrito(datos, foto, claveIdempotencia) {
      await esperar(900) // simula una subida lenta

      // Idempotencia: si ya vimos esta clave, devolvemos exactamente el mismo perrito.
      const previo = respuestasPorClave.get(claveIdempotencia)
      if (previo) return previo

      const errores = validarComoBackend(datos, foto)
      if (Object.keys(errores).length > 0) throw new ErrorApi(mensajePorEstado(400), 400, errores)

      const nuevo: Perrito = {
        id: Math.max(0, ...perritos.map((p) => p.id)) + 1,
        nombre: datos.nombre.trim(),
        fotoUrl: URL.createObjectURL(foto),
        miniaturaUrl: URL.createObjectURL(foto),
        raza: RAZAS.find((r) => r.id === datos.razaId) ?? null,
        colorPrincipal: buscarColor(datos.colorPrincipalId),
        coloresAdicionales: datos.coloresAdicionalesIds.map(buscarColor),
        latitud: datos.latitud,
        longitud: datos.longitud,
        fechaRegistro: new Date().toISOString(),
      }
      perritos = [nuevo, ...perritos]
      respuestasPorClave.set(claveIdempotencia, nuevo)
      return nuevo
    },

    async listarRazas() {
      await latencia()
      return RAZAS
    },

    async listarColores() {
      await latencia()
      return COLORES
    },
  }
}
