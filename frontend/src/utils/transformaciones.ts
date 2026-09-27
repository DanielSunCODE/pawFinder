// Transformaciones de datos para mostrar en pantalla.
//
// PARADIGMA FUNCIONAL: funciones puras. No modifican lo que reciben (devuelven valores nuevos)
// y no usan ciclos for/while.
// Ojo: aquí NO se filtran ni se cuentan registros; eso lo hace PostgreSQL. Sólo se preparan
// datos que ya llegaron de la API para dibujarlos.
import type { Color, Perrito } from '../api'

const HEX_VALIDO = /^#[0-9a-f]{6}$/i
const COLOR_DE_RESPALDO = '#A39A92'

/** Devuelve un color seguro para usar en CSS (el hex puede venir null o mal escrito). */
export const colorCss = (hex: string | null | undefined): string =>
  hex && HEX_VALIDO.test(hex) ? hex : COLOR_DE_RESPALDO

/** Todos los colores de un perrito en orden: primero el principal. */
export const coloresDe = (perrito: Perrito): Color[] => [perrito.colorPrincipal, ...perrito.coloresAdicionales]

/** Lista de coordenadas [lat, lng] para encuadrar el mapa. */
export const coordenadasDe = (perritos: Perrito[]): [number, number][] =>
  perritos.map((p) => [p.latitud, p.longitud])
