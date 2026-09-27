// Formato de fechas y coordenadas para mostrar en pantalla.

const LOCALE = 'es-MX'

const formatoFecha = new Intl.DateTimeFormat(LOCALE, { dateStyle: 'medium', timeStyle: 'short' })
const formatoRelativo = new Intl.RelativeTimeFormat(LOCALE, { numeric: 'auto' })

/** "22 sept 2026, 18:40" */
export function formatearFecha(iso: string): string {
  return formatoFecha.format(new Date(iso))
}

const UNIDADES: [Intl.RelativeTimeFormatUnit, number][] = [
  ['year', 365 * 24 * 3600],
  ['month', 30 * 24 * 3600],
  ['week', 7 * 24 * 3600],
  ['day', 24 * 3600],
  ['hour', 3600],
  ['minute', 60],
]

/** "hace 3 días", "hace 5 minutos", "ahora" */
export function tiempoRelativo(iso: string, ahora = Date.now()): string {
  const segundos = Math.round((new Date(iso).getTime() - ahora) / 1000)
  const unidad = UNIDADES.find(([, tamaño]) => Math.abs(segundos) >= tamaño)
  if (!unidad) return 'ahora'
  const [nombre, tamaño] = unidad
  return formatoRelativo.format(Math.round(segundos / tamaño), nombre)
}

/** "19.43260, -99.13320" */
export function formatearCoordenadas(latitud: number, longitud: number): string {
  return `${latitud.toFixed(5)}, ${longitud.toFixed(5)}`
}
