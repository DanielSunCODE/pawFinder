// Zonas de concentración (Proyecto 2): la ciudad dividida en cuadros, con cuántos perritos hay en cada uno.
// El cálculo lo hace el núcleo en Elixir (funcional/lib/perritos/zonas.ex); aquí sólo se pide y se tipa.
import { pedirFuncional } from './funcional'

export interface Zona {
  fila: number
  columna: number
  /** Perritos vistos dentro del cuadro. */
  total: number
  /** Intensidad de 0 (pocos) a 3 (muchos). */
  nivel: number
  /** Rectángulo del cuadro, en grados. */
  limites: { sur: number; oeste: number; norte: number; este: number }
}

export interface ResultadoZonas {
  /** Lado del cuadro en metros. */
  tamano: number
  resumen: { celdas: number; perritos: number; maximo: number }
  /** De la zona con más perritos a la de menos. */
  zonas: Zona[]
}

/** GET /f/zonas?tamano=500 */
export const obtenerZonas = (tamano: number) => pedirFuncional<ResultadoZonas>(`/zonas?tamano=${tamano}`)
