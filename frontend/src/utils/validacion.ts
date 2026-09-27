// Validación del formulario de registro, del lado del cliente.
// Las reglas salen de la tabla de campos del enunciado. El backend repite estas mismas
// validaciones: si alguien se salta el formulario y llama a la API directo, el backend rechaza.
//
// PARADIGMA FUNCIONAL: cada regla es una función pura (no modifica nada, sólo recibe datos y
// devuelve un resultado) y los errores se arman con map → filter → reduce, sin ciclos explícitos
// y sin mutar la estructura original.
import type { Id } from '../api'

export const TIPOS_FOTO_PERMITIDOS = ['image/jpeg', 'image/png', 'image/webp'] as const
export const MAX_COLORES_ADICIONALES = 2
export const MAX_LARGO_NOMBRE = 60

export interface Ubicacion {
  latitud: number
  longitud: number
}

export interface DatosFormulario {
  foto: File | null
  nombre: string
  razaId: Id | null
  colorPrincipalId: Id | null
  coloresAdicionalesIds: Id[]
  ubicacion: Ubicacion | null
}

export type CampoFormulario = keyof DatosFormulario
export type ErroresFormulario = Partial<Record<CampoFormulario, string>>

/** Una regla revisa los datos y devuelve [campo, mensaje] si hay error, o null si todo bien. */
type Regla = (datos: DatosFormulario) => [CampoFormulario, string] | null

const esTipoPermitido = (tipo: string) => (TIPOS_FOTO_PERMITIDOS as readonly string[]).includes(tipo)

const REGLAS: Regla[] = [
  // Foto: obligatoria, JPG / PNG / WEBP
  ({ foto }) => (foto ? null : ['foto', 'Falta la foto del perrito.']),
  ({ foto }) => (foto && !esTipoPermitido(foto.type) ? ['foto', 'La foto debe ser JPG, PNG o WEBP.'] : null),

  // Nombre: texto no vacío; un nombre de puros espacios no cuenta
  ({ nombre }) => (nombre.trim() ? null : ['nombre', 'Falta el nombre (sólo espacios no cuenta).']),
  ({ nombre }) =>
    nombre.trim().length > MAX_LARGO_NOMBRE ? ['nombre', `El nombre puede tener máximo ${MAX_LARGO_NOMBRE} letras.`] : null,

  // Color principal: exactamente uno
  ({ colorPrincipalId }) => (colorPrincipalId !== null ? null : ['colorPrincipalId', 'Elige el color principal.']),

  // Colores adicionales: de 0 a 2, sin repetir el principal ni repetirse entre sí
  ({ coloresAdicionalesIds }) =>
    coloresAdicionalesIds.length > MAX_COLORES_ADICIONALES
      ? ['coloresAdicionalesIds', `Puedes elegir máximo ${MAX_COLORES_ADICIONALES} colores adicionales.`]
      : null,
  ({ colorPrincipalId, coloresAdicionalesIds }) =>
    colorPrincipalId !== null && coloresAdicionalesIds.includes(colorPrincipalId)
      ? ['coloresAdicionalesIds', 'Un color adicional no puede ser el mismo que el principal.']
      : null,
  ({ coloresAdicionalesIds }) =>
    new Set(coloresAdicionalesIds).size !== coloresAdicionalesIds.length
      ? ['coloresAdicionalesIds', 'No repitas colores.']
      : null,

  // Ubicación: obligatoria y con coordenadas válidas
  ({ ubicacion }) => (ubicacion ? null : ['ubicacion', 'Marca en el mapa dónde viste al perrito.']),
  ({ ubicacion }) =>
    ubicacion && (Math.abs(ubicacion.latitud) > 90 || Math.abs(ubicacion.longitud) > 180)
      ? ['ubicacion', 'La ubicación no es válida. Vuelve a marcarla en el mapa.']
      : null,
]

/**
 * Devuelve un objeto con el primer error de cada campo, por ejemplo:
 * { foto: 'Falta la foto del perrito.', nombre: 'Falta el nombre…' }
 * Si no hay errores devuelve {}.
 */
export function validarRegistro(datos: DatosFormulario): ErroresFormulario {
  return REGLAS.map((regla) => regla(datos))
    .filter((resultado): resultado is [CampoFormulario, string] => resultado !== null)
    .reduce<ErroresFormulario>(
      (errores, [campo, mensaje]) => (errores[campo] ? errores : { ...errores, [campo]: mensaje }),
      {},
    )
}

export const hayErrores = (errores: ErroresFormulario) => Object.keys(errores).length > 0

/**
 * El backend manda errores con las llaves de la API (latitud, longitud, …).
 * Esta función los pasa a los nombres de campo del formulario.
 */
export function erroresDelServidor(campos: Record<string, string>): ErroresFormulario {
  const equivalencias: Record<string, CampoFormulario> = {
    foto: 'foto',
    nombre: 'nombre',
    razaId: 'razaId',
    colorPrincipalId: 'colorPrincipalId',
    coloresAdicionalesIds: 'coloresAdicionalesIds',
    latitud: 'ubicacion',
    longitud: 'ubicacion',
  }
  return Object.entries(campos)
    .filter(([llave]) => llave in equivalencias)
    .reduce<ErroresFormulario>((errores, [llave, mensaje]) => ({ ...errores, [equivalencias[llave]]: mensaje }), {})
}
