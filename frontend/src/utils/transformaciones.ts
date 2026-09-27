// Transformaciones de datos para mostrar en pantalla.
//
// PARADIGMA FUNCIONAL: funciones puras. No modifican lo que reciben (devuelven valores nuevos)
// y no usan ciclos for/while.
// Ojo: aquí NO se filtran ni se cuentan registros; eso lo hace MySQL. Sólo se preparan
// datos que ya llegaron de la API para dibujarlos.
import type { Color, ElementoCatalogo, Perrito } from '../api'

const HEX_VALIDO = /^#[0-9a-f]{6}$/i
const COLOR_DE_RESPALDO = '#A39A92'

/** Devuelve un color seguro para usar en CSS (el hex puede venir null o mal escrito). */
export const colorCss = (hex: string | null | undefined): string =>
  hex && HEX_VALIDO.test(hex) ? hex : COLOR_DE_RESPALDO

/** "Gris lobo" → "gris lobo", "Sólido" → "solido": para comparar nombres sin acentos ni mayúsculas. */
export const normalizar = (texto: string): string =>
  texto.normalize('NFD').replace(/[̀-ͯ]/g, '').trim().toLowerCase()

/**
 * La tabla de colores de la base no guarda el tono, sólo el nombre.
 * Estos tonos aproximados sirven para pintar la muestrita junto al nombre.
 */
const HEX_POR_NOMBRE: Record<string, string> = {
  // Pelaje (database/seeds/002_colors.sql)
  negro: '#23201E',
  marron: '#6B4226',
  gris: '#8E8E8E',
  lilac: '#A89AA3',
  rojo: '#A5482A',
  leonado: '#C8924A',
  canela: '#B5652B',
  crema: '#EFDDB6',
  amarillo: '#E0B857',
  blanco: '#FAFAF7',
  'gris lobo': '#857D72',
  sable: '#8B6A45',
  // Ojos (database/migrations/001_catalogs.sql)
  cafe: '#6B4226',
  azul: '#6FA8DC',
  verde: '#6F9A52',
  ambar: '#D59A2B',
}

/** Completa el hex de un color con el tono conocido si el backend no lo manda. */
export const conHex = (color: Color): Color => ({
  ...color,
  hex: color.hex ?? HEX_POR_NOMBRE[normalizar(color.nombre)] ?? null,
})

/** ¿Es el patrón "Sólido"? Con ese patrón el perrito sólo lleva color principal. */
export const esSolido = (patron: ElementoCatalogo | null | undefined): boolean =>
  patron ? normalizar(patron.nombre) === 'solido' : false

/** Todos los colores de un perrito en orden: primero el principal. */
export const coloresDe = (perrito: Perrito): Color[] => [perrito.colorPrincipal, ...perrito.coloresAdicionales]

/** Lista de coordenadas [lat, lng] para encuadrar el mapa. */
export const coordenadasDe = (perritos: Perrito[]): [number, number][] =>
  perritos.map((p) => [p.latitud, p.longitud])
