// Muestras de color: el circulito de color y las etiquetas con nombre.
import type { Color } from '../api'
import { clases } from '../utils/clases'
import { colorCss } from '../utils/transformaciones'

export function Muestra({ hex, tamano = 16, className }: { hex?: string | null; tamano?: number; className?: string }) {
  return (
    <span
      // El borde interior hace que el blanco y el crema se distingan del fondo
      className={clases('inline-block shrink-0 rounded-full shadow-[inset_0_0_0_1.5px_rgb(42_33_27/0.18)]', className)}
      style={{ background: colorCss(hex), width: tamano, height: tamano }}
      aria-hidden="true"
    />
  )
}

/** Etiquetas "● Canela  ● Blanco". La primera es el color principal. */
export function EtiquetasColores({ colores, marcarPrincipal = false }: { colores: Color[]; marcarPrincipal?: boolean }) {
  return (
    <ul className="flex flex-wrap gap-1.5" aria-label="Colores">
      {colores.map((color, indice) => (
        <li
          key={color.id}
          className="inline-flex items-center gap-1.5 rounded-full bg-superficie-2 py-1 pr-2.5 pl-1.5 text-sm font-bold"
        >
          <Muestra hex={color.hex} />
          {color.nombre}
          {marcarPrincipal && indice === 0 && (
            <span className="rounded-full bg-superficie px-1.5 py-px text-[0.7rem] font-bold tracking-wide text-texto-suave uppercase">
              principal
            </span>
          )}
        </li>
      ))}
    </ul>
  )
}

/** Puntitos encimados, para espacios chicos como las tarjetas de la lista. */
export function PuntosColores({ colores }: { colores: Color[] }) {
  return (
    <span className="inline-flex" title={colores.map((c) => c.nombre).join(', ')}>
      {colores.map((color, indice) => (
        <Muestra
          key={color.id}
          hex={color.hex}
          tamano={14}
          className={indice > 0 ? '-ml-1 outline-2 outline-superficie' : undefined}
        />
      ))}
      <span className="sr-only">{colores.map((c) => c.nombre).join(', ')}</span>
    </span>
  )
}
