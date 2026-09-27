// Elección de colores: exactamente un color principal y de 0 a 2 adicionales.
// La interfaz no deja elegir un adicional igual al principal ni más de 2
// (y además validacion.ts lo revisa antes de enviar).
import type { Color, Id } from '../../api'
import { MAX_COLORES_ADICIONALES } from '../../utils/validacion'
import { clases } from '../../utils/clases'
import { Muestra } from '../Colores'
import { estilos } from './estilos'

interface Props {
  colores: Color[]
  principalId: Id | null
  adicionalesIds: Id[]
  alElegirPrincipal: (id: Id) => void
  alAlternarAdicional: (id: Id) => void
  errorPrincipal?: string
  errorAdicionales?: string
}

export function SelectorColores({
  colores,
  principalId,
  adicionalesIds,
  alElegirPrincipal,
  alAlternarAdicional,
  errorPrincipal,
  errorAdicionales,
}: Props) {
  const lleno = adicionalesIds.length >= MAX_COLORES_ADICIONALES

  return (
    <>
      <fieldset className={estilos.grupo} id="campo-colorPrincipalId">
        <legend className={estilos.etiqueta}>
          Color principal <span className={estilos.obligatorio}>*</span>
        </legend>
        <div className={estilos.chips}>
          {colores.map((color) => {
            const elegido = color.id === principalId
            return (
              <label key={color.id} className={clases(estilos.chip, elegido ? estilos.chipElegido : estilos.chipNormal)}>
                <input
                  type="radio"
                  name="colorPrincipal"
                  className="sr-only"
                  checked={elegido}
                  onChange={() => alElegirPrincipal(color.id)}
                />
                <Muestra hex={color.hex} tamano={18} />
                {color.nombre}
              </label>
            )
          })}
        </div>
        {errorPrincipal && <p className={estilos.error}>{errorPrincipal}</p>}
      </fieldset>

      <fieldset className={estilos.grupo} id="campo-coloresAdicionalesIds">
        <legend className={estilos.etiqueta}>
          Colores adicionales{' '}
          <span className={estilos.opcional}>
            opcional · {adicionalesIds.length} de {MAX_COLORES_ADICIONALES}
          </span>
        </legend>
        <div className={estilos.chips}>
          {colores.map((color) => {
            const elegido = adicionalesIds.includes(color.id)
            const esPrincipal = color.id === principalId
            const deshabilitado = esPrincipal || (lleno && !elegido)
            return (
              <label
                key={color.id}
                className={clases(
                  estilos.chip,
                  elegido ? estilos.chipElegido : estilos.chipNormal,
                  deshabilitado && estilos.chipDeshabilitado,
                )}
                title={esPrincipal ? 'Ya es el color principal' : undefined}
              >
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={elegido}
                  disabled={deshabilitado}
                  onChange={() => alAlternarAdicional(color.id)}
                />
                <Muestra hex={color.hex} tamano={18} />
                {color.nombre}
              </label>
            )
          })}
        </div>
        {errorAdicionales && <p className={estilos.error}>{errorAdicionales}</p>}
      </fieldset>
    </>
  )
}
