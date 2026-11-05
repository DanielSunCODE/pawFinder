// Estadísticas (Proyecto 2): conteos por color, raza y día.
// Los conteos los calcula el núcleo en Elixir (funcional/lib/perritos/estadisticas.ex); aquí sólo se pide y se tipa.
// Es distinto de GET /api/estadisticas del backend Express: ese es el conteo en SQL del Proyecto 1.
import { pedirFuncional } from './funcional'

export interface ConteoNombre {
  nombre: string
  total: number
}

export interface ConteoDia {
  /** Día en hora de Saltillo, "AAAA-MM-DD". */
  dia: string
  total: number
}

export type ModoColores = 'principal' | 'todos'

export interface ResultadoEstadisticas {
  /** Perritos contados. */
  total: number
  /** Del color más al menos común. Con modo "principal" suman `total`. */
  porColor: ConteoNombre[]
  porRaza: ConteoNombre[]
  /** Del día más antiguo al más reciente; los días sin registros no aparecen. */
  porDia: ConteoDia[]
  masComunes: { colores: ConteoNombre[]; razas: ConteoNombre[] }
}

/** GET /f/estadisticas?top=5&colores=principal */
export const obtenerEstadisticas = (top: number, colores: ModoColores) =>
  pedirFuncional<ResultadoEstadisticas>(`/estadisticas?top=${top}&colores=${colores}`)
