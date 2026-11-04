// Zonas de concentración en el mapa: un cuadro por zona, más intenso entre más perritos.
// Los cuadros y su intensidad los calcula el núcleo en Elixir; aquí sólo se pintan.
import { LoaderCircle } from 'lucide-react'
import { Rectangle, Tooltip } from 'react-leaflet'
import type { ResultadoZonas, Zona } from '../../api/zonas'
import { clases } from '../../utils/clases'
import { MensajeError } from '../Estado'

/** Del nivel 0 (pocos perritos) al 3 (muchos), en el naranja del tema. */
export const COLORES_NIVEL = ['#F0B98E', '#E2864A', '#C4531D', '#8A330F'] as const

/** Tamaños de cuadro que se pueden elegir, en metros. */
export const TAMANOS_ZONA = [250, 500, 1000] as const

const colorDe = (zona: Zona) => COLORES_NIVEL[Math.min(zona.nivel, COLORES_NIVEL.length - 1)]

/** Va dentro de <MapaBase>: dibuja los cuadros con el número de perritos al centro. */
export function CapaZonas({ resultado }: { resultado: ResultadoZonas }) {
  return (
    <>
      {resultado.zonas.map((zona) => {
        const { sur, oeste, norte, este } = zona.limites
        const color = colorDe(zona)
        return (
          <Rectangle
            // El tamaño va en la llave: fila y columna se repiten entre tamaños, y si React reutiliza
            // el cuadro, Leaflet lo mueve pero deja la etiqueta en su lugar viejo.
            key={`${resultado.tamano}:${zona.fila}:${zona.columna}`}
            bounds={[
              [sur, oeste],
              [norte, este],
            ]}
            pathOptions={{ color, weight: 1.5, fillColor: color, fillOpacity: 0.32 + zona.nivel * 0.12 }}
            interactive={false}
          >
            <Tooltip permanent direction="center" className="etiqueta-zona" opacity={1}>
              {zona.total}
            </Tooltip>
          </Rectangle>
        )
      })}
    </>
  )
}

const etiquetaTamano = (metros: number) => (metros >= 1000 ? `${metros / 1000} km` : `${metros} m`)

interface PropsLeyenda {
  resultado: ResultadoZonas | null | undefined
  cargando: boolean
  error: string | null
  alReintentar: () => void
  tamano: number
  alCambiarTamano: (metros: number) => void
}

/** Recuadro sobre el mapa: tamaño de los cuadros, escala de colores y resumen. */
export function LeyendaZonas({ resultado, cargando, error, alReintentar, tamano, alCambiarTamano }: PropsLeyenda) {
  return (
    <section
      className="absolute bottom-6 left-3 z-1000 flex w-[min(17rem,calc(100%-5.5rem))] flex-col gap-2.5 rounded-tarjeta bg-superficie p-3.5 text-sm shadow-tarjeta"
      aria-label="Zonas de concentración"
    >
      <div className="flex items-center justify-between gap-2">
        <strong className="font-extrabold">Zonas de concentración</strong>
        {cargando && <LoaderCircle className="animate-spin text-primario" size={16} aria-label="Calculando zonas" />}
      </div>

      <div className="grid grid-cols-3 gap-1 rounded-full bg-superficie-2 p-1" role="radiogroup" aria-label="Tamaño de cada cuadro">
        {TAMANOS_ZONA.map((metros) => (
          <button
            key={metros}
            type="button"
            role="radio"
            aria-checked={tamano === metros}
            onClick={() => alCambiarTamano(metros)}
            className={clases(
              'rounded-full py-1.5 text-xs font-bold',
              tamano === metros ? 'bg-superficie text-primario shadow-suave' : 'text-texto-suave',
            )}
          >
            {etiquetaTamano(metros)}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2 text-xs font-semibold text-texto-suave">
        <span>Pocos</span>
        <span className="flex h-2.5 flex-1 overflow-hidden rounded-full" aria-hidden="true">
          {COLORES_NIVEL.map((color) => (
            <span key={color} className="flex-1" style={{ background: color }} />
          ))}
        </span>
        <span>Muchos</span>
      </div>

      {error ? (
        <div className="[&>div]:gap-2 [&>div]:py-0">
          <MensajeError mensaje={error} alReintentar={alReintentar} />
        </div>
      ) : (
        resultado && (
          <p className="text-xs font-semibold text-texto-suave">
            {resultado.resumen.perritos} perritos en {resultado.resumen.celdas}{' '}
            {resultado.resumen.celdas === 1 ? 'cuadro' : 'cuadros'} de {etiquetaTamano(resultado.tamano)}
            {resultado.resumen.maximo > 0 && ` · máximo ${resultado.resumen.maximo} en uno`}
          </p>
        )
      )}
    </section>
  )
}
