// Gráficas de barras sencillas, hechas con HTML y CSS (sin librería de gráficas).
// Sólo dibujan: los conteos ya vienen calculados por el servicio de estadísticas.
import { Muestra } from './Colores'

interface Barra {
  nombre: string
  total: number
  /** Color de la barra; si falta se usa el color del tema. */
  color?: string
  /** Muestra de color antes del nombre (para la gráfica de colores). */
  hex?: string | null
}

/** Barras horizontales: una fila por elemento, en el orden en que llegan. */
export function BarrasHorizontales({ datos, vacio }: { datos: Barra[]; vacio: string }) {
  if (datos.length === 0) return <p className="py-4 text-texto-suave">{vacio}</p>
  const maximo = Math.max(...datos.map((d) => d.total))

  return (
    <ul className="flex flex-col gap-2.5">
      {datos.map((dato) => (
        <li
          key={dato.nombre}
          className="grid grid-cols-[minmax(0,9rem)_1fr_auto] items-center gap-3 text-sm sm:grid-cols-[12rem_1fr_auto]"
        >
          <span className="flex min-w-0 items-center gap-2 font-bold">
            {dato.hex !== undefined && <Muestra hex={dato.hex} />}
            <span className="truncate" title={dato.nombre}>
              {dato.nombre}
            </span>
          </span>
          <span className="h-4.5 overflow-hidden rounded-full bg-superficie-2" aria-hidden="true">
            <span
              className="block h-full rounded-full bg-primario-vivo shadow-[inset_0_0_0_1.5px_rgb(42_33_27/0.18)]"
              style={{ width: `${(dato.total / maximo) * 100}%`, ...(dato.color ? { background: dato.color } : {}) }}
            />
          </span>
          <span className="min-w-6 text-right font-extrabold tabular-nums">{dato.total}</span>
        </li>
      ))}
    </ul>
  )
}

interface BarraVertical {
  etiqueta: string
  total: number
  /** Texto completo para el tooltip y los lectores de pantalla. */
  detalle: string
}

/** Barras verticales (una por día). Cada barra mide su total frente al máximo. */
export function BarrasVerticales({ datos, vacio }: { datos: BarraVertical[]; vacio: string }) {
  if (datos.length === 0) return <p className="py-4 text-texto-suave">{vacio}</p>
  const maximo = Math.max(...datos.map((d) => d.total))
  // Con muchos días no caben todas las etiquetas: se muestran algunas y la última.
  const cadaCuanto = Math.ceil(datos.length / 6)

  return (
    <div>
      <ul className="flex h-48 items-end gap-1">
        {datos.map((dato) => (
          <li key={dato.detalle} className="group flex h-full min-w-0 flex-1 flex-col justify-end" title={dato.detalle}>
            <span className="mb-1 text-center text-xs font-bold text-texto-suave tabular-nums">{dato.total}</span>
            <span
              className="block w-full rounded-t-md bg-primario-vivo transition-colors group-hover:bg-primario"
              style={{ height: `${Math.max((dato.total / maximo) * 85, 3)}%` }}
              role="img"
              aria-label={dato.detalle}
            />
          </li>
        ))}
      </ul>
      <ul className="mt-1.5 flex gap-1 border-t border-borde pt-1.5 text-[0.7rem] font-bold text-texto-suave" aria-hidden="true">
        {datos.map((dato, indice) => (
          <li key={dato.detalle} className="min-w-0 flex-1 text-center whitespace-nowrap">
            {indice % cadaCuanto === 0 || indice === datos.length - 1 ? dato.etiqueta : ''}
          </li>
        ))}
      </ul>
    </div>
  )
}
