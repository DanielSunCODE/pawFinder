// Posibles duplicados (Proyecto 2): al registrar un perrito se compara con los ya registrados.
// El cálculo lo hace el núcleo en Elixir (funcional/lib/perritos/duplicados.ex); aquí sólo se pide y se tipa.
import { pedirFuncional } from './funcional'
import type { Id } from './tipos'

/** Lo que se manda a POST /f/duplicados: los datos del formulario que sirven para comparar. */
export interface ConsultaDuplicados {
  razaId: Id | null
  /** El nombre permite al servicio saber si la raza es "Sin raza definida / Criollo" (desconocida). */
  razaNombre: string | null
  colorPrincipalId: Id
  coloresAdicionalesIds: Id[]
  latitud: number
  longitud: number
}

export interface PosibleDuplicado {
  id: Id
  nombre: string
  raza: { id: Id | null; nombre: string | null }
  /** De 0 a 1: qué tanto se parece al perrito que se está registrando. */
  similitud: number
  latitud: number
  longitud: number
}

export interface ResultadoDuplicados {
  /** Similitud mínima para avisar. */
  umbral: number
  /** Del más al menos parecido. */
  duplicados: PosibleDuplicado[]
}

/** POST /f/duplicados */
export const buscarDuplicados = (consulta: ConsultaDuplicados) =>
  pedirFuncional<ResultadoDuplicados>('/duplicados', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(consulta),
  })
