// Etiquetas en español para los valores fijos de la base (sexo, tamaño, pelo, etapa de vida).
// La base guarda 'pequeño', 'cachorro'…; aquí se decide cómo se ven en pantalla.
import {
  ETAPAS_VIDA,
  LONGITUDES_PELAJE,
  SEXOS,
  TAMANOS,
  type EtapaVida,
  type LongitudPelaje,
  type Sexo,
  type Tamano,
} from '../api'

export interface Opcion<T extends string> {
  valor: T
  etiqueta: string
  /** Texto corto de ayuda debajo de la etiqueta, opcional. */
  ayuda?: string
}

const ETIQUETAS_SEXO: Record<Sexo, string> = { macho: 'Macho', hembra: 'Hembra' }
const ETIQUETAS_TAMANO: Record<Tamano, [string, string]> = {
  pequeño: ['Pequeño', 'como un chihuahua'],
  mediano: ['Mediano', 'como un beagle'],
  grande: ['Grande', 'como un labrador'],
  gigante: ['Gigante', 'como un gran danés'],
}
const ETIQUETAS_PELAJE: Record<LongitudPelaje, string> = { corto: 'Corto', mediano: 'Mediano', largo: 'Largo' }
const ETIQUETAS_ETAPA: Record<EtapaVida, [string, string]> = {
  cachorro: ['Cachorro', 'menos de 1 año'],
  adulto: ['Adulto', ''],
  senior: ['Mayor', 'canas, se mueve lento'],
}

export const OPCIONES_SEXO: Opcion<Sexo>[] = SEXOS.map((valor) => ({ valor, etiqueta: ETIQUETAS_SEXO[valor] }))
export const OPCIONES_TAMANO: Opcion<Tamano>[] = TAMANOS.map((valor) => ({
  valor,
  etiqueta: ETIQUETAS_TAMANO[valor][0],
  ayuda: ETIQUETAS_TAMANO[valor][1],
}))
export const OPCIONES_PELAJE: Opcion<LongitudPelaje>[] = LONGITUDES_PELAJE.map((valor) => ({
  valor,
  etiqueta: ETIQUETAS_PELAJE[valor],
}))
export const OPCIONES_ETAPA: Opcion<EtapaVida>[] = ETAPAS_VIDA.map((valor) => ({
  valor,
  etiqueta: ETIQUETAS_ETAPA[valor][0],
  ayuda: ETIQUETAS_ETAPA[valor][1] || undefined,
}))

/** Texto para mostrar un valor fijo; null → null (no se sabe). */
export function etiquetaDe<T extends string>(opciones: Opcion<T>[], valor: T | null): string | null {
  return opciones.find((opcion) => opcion.valor === valor)?.etiqueta ?? null
}
