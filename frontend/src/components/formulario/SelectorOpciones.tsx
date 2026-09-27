// Grupo de opciones como "chips" (botones redondos): se elige una sola.
// Se usa para sexo, etapa de vida, tamaño, largo del pelo y color de ojos.
// Si el campo es opcional, agrega la opción "No sé", que manda null.
import { clases } from '../../utils/clases'
import { Muestra } from '../Colores'
import { estilos } from './estilos'

export interface OpcionChip<T extends string | number> {
  valor: T
  etiqueta: string
  /** Texto de ayuda que aparece debajo cuando la opción está elegida. */
  ayuda?: string
  /** Si viene, se pinta una muestra de color junto a la etiqueta. */
  hex?: string | null
}

interface Props<T extends string | number> {
  /** Se usa para el id del bloque (campo-<campo>) y el name de los radios. */
  campo: string
  titulo: string
  opciones: OpcionChip<T>[]
  valor: T | null
  alCambiar: (valor: T | null) => void
  /** true = agrega "No sé" (valor null). */
  opcional?: boolean
  error?: string
}

export function SelectorOpciones<T extends string | number>({
  campo,
  titulo,
  opciones,
  valor,
  alCambiar,
  opcional = true,
  error,
}: Props<T>) {
  const elegida = opciones.find((opcion) => opcion.valor === valor)
  const todas: (OpcionChip<T> | null)[] = opcional ? [...opciones, null] : opciones

  return (
    <fieldset className={estilos.grupo} id={`campo-${campo}`}>
      <legend className={estilos.etiqueta}>
        {titulo} {!opcional && <span className={estilos.obligatorio}>*</span>}
      </legend>
      <div className={estilos.chips}>
        {todas.map((opcion) => {
          const esNoSe = opcion === null
          const marcada = esNoSe ? valor === null : opcion.valor === valor
          return (
            <label
              key={esNoSe ? 'no-se' : String(opcion.valor)}
              className={clases(
                estilos.chip,
                marcada ? estilos.chipElegido : estilos.chipNormal,
                esNoSe && !marcada && 'border-dashed text-texto-suave',
                (esNoSe || opcion.hex === undefined) && 'pl-3.5!',
              )}
            >
              <input
                type="radio"
                name={campo}
                className="sr-only"
                checked={marcada}
                onChange={() => alCambiar(esNoSe ? null : opcion.valor)}
              />
              {!esNoSe && opcion.hex !== undefined && <Muestra hex={opcion.hex} tamano={18} />}
              {esNoSe ? 'No sé' : opcion.etiqueta}
            </label>
          )
        })}
      </div>
      {elegida?.ayuda && <p className={estilos.ayudaOpcion}>{elegida.ayuda}</p>}
      {error && <p className={estilos.error}>{error}</p>}
    </fieldset>
  )
}
