// Estadísticas: cuántos perritos hay por color, por raza y por día.
// Los conteos los calcula el servicio Elixir (GET /f/estadisticas); aquí sólo se pintan.
import { PawPrint } from 'lucide-react'
import { useState } from 'react'
import { obtenerEstadisticas, type ModoColores } from '../api/estadisticas'
import { Cargando, MensajeError, Vacio } from '../components/Estado'
import { BarrasHorizontales, BarrasVerticales } from '../components/GraficaBarras'
import { useAsync } from '../hooks/useAsync'
import { clases } from '../utils/clases'
import { conHex } from '../utils/transformaciones'

const OPCIONES_TOP = [5, 10, 20] as const

const OPCIONES_COLORES: { valor: ModoColores; etiqueta: string; ayuda: string }[] = [
  { valor: 'principal', etiqueta: 'Sólo el principal', ayuda: 'Cada perrito cuenta una vez, por su color principal.' },
  {
    valor: 'todos',
    etiqueta: 'Todos sus colores',
    ayuda: 'Un perrito suma en cada uno de sus colores (principal y adicionales).',
  },
]

/** "2026-11-05" → "5 nov". Se arma con las partes para que la zona horaria del navegador no mueva el día. */
function formatearDia(dia: string, conAnio = false): string {
  const [anio, mes, diaDelMes] = dia.split('-').map(Number)
  return new Date(anio ?? 0, (mes ?? 1) - 1, diaDelMes ?? 1).toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'short',
    ...(conAnio ? { year: 'numeric' } : {}),
  })
}

function Selector<T extends string | number>({
  etiqueta,
  opciones,
  valor,
  alCambiar,
}: {
  etiqueta: string
  opciones: { valor: T; texto: string; ayuda?: string }[]
  valor: T
  alCambiar: (valor: T) => void
}) {
  return (
    <div role="radiogroup" aria-label={etiqueta} className="inline-flex rounded-full bg-superficie-2 p-1">
      {opciones.map((opcion) => (
        <button
          key={opcion.valor}
          type="button"
          role="radio"
          aria-checked={opcion.valor === valor}
          title={opcion.ayuda}
          onClick={() => alCambiar(opcion.valor)}
          className={clases(
            'rounded-full px-3.5 py-1.5 text-sm font-bold',
            opcion.valor === valor ? 'bg-superficie text-primario shadow-suave' : 'text-texto-suave hover:text-texto',
          )}
        >
          {opcion.texto}
        </button>
      ))}
    </div>
  )
}

const tarjeta = 'flex flex-col gap-4 rounded-tarjeta bg-superficie p-4.5 shadow-suave'

export function EstadisticasPage() {
  const [top, setTop] = useState<number>(5)
  const [colores, setColores] = useState<ModoColores>('principal')
  const estadisticas = useAsync(() => obtenerEstadisticas(top, colores), [top, colores])
  const datos = estadisticas.datos

  if (estadisticas.error && !datos) return <MensajeError mensaje={estadisticas.error} alReintentar={estadisticas.reintentar} />
  if (!datos) return <Cargando texto="Calculando estadísticas…" />

  if (datos.total === 0) {
    return (
      <Vacio icono={<PawPrint size={36} aria-hidden="true" />} titulo="Todavía no hay perritos">
        <p>En cuanto se registre el primero, aquí aparecerán las gráficas.</p>
      </Vacio>
    )
  }

  const razaMasComun = datos.masComunes.razas[0]
  const colorMasComun = datos.masComunes.colores[0]
  const ayudaColores = OPCIONES_COLORES.find((opcion) => opcion.valor === colores)?.ayuda

  return (
    <div className="mx-auto flex max-w-240 flex-col gap-5">
      <div>
        <h1 className="text-2xl font-extrabold">Estadísticas</h1>
        <p className="text-texto-suave">Cómo son los perritos registrados. Los días van en hora de Saltillo.</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Selector
          etiqueta="Mostrar los más comunes"
          valor={top}
          alCambiar={setTop}
          opciones={OPCIONES_TOP.map((n) => ({ valor: n, texto: `Top ${n}` }))}
        />
        <Selector
          etiqueta="Qué colores contar"
          valor={colores}
          alCambiar={setColores}
          opciones={OPCIONES_COLORES.map((o) => ({ valor: o.valor, texto: o.etiqueta, ayuda: o.ayuda }))}
        />
        {estadisticas.cargando && <span className="text-sm font-bold text-texto-suave">Actualizando…</span>}
      </div>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-3" aria-label="Resumen">
        <div className={tarjeta}>
          <span className="text-sm font-bold text-texto-suave">Perritos registrados</span>
          <strong className="text-3xl font-black">{datos.total}</strong>
        </div>
        <div className={tarjeta}>
          <span className="text-sm font-bold text-texto-suave">Raza más común</span>
          <strong className="text-xl font-black">{razaMasComun?.nombre ?? '—'}</strong>
          {razaMasComun && <span className="-mt-3 text-sm text-texto-suave">{razaMasComun.total} perritos</span>}
        </div>
        <div className={tarjeta}>
          <span className="text-sm font-bold text-texto-suave">Color más común</span>
          <strong className="text-xl font-black">{colorMasComun?.nombre ?? '—'}</strong>
          {colorMasComun && <span className="-mt-3 text-sm text-texto-suave">{colorMasComun.total} perritos</span>}
        </div>
      </section>

      <section className={tarjeta}>
        <h2 className="text-lg font-extrabold">Registros por día</h2>
        <BarrasVerticales
          vacio="Aún no hay registros con fecha."
          datos={datos.porDia.map((d) => ({
            etiqueta: formatearDia(d.dia),
            total: d.total,
            detalle: `${formatearDia(d.dia, true)}: ${d.total} ${d.total === 1 ? 'perrito' : 'perritos'}`,
          }))}
        />
      </section>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <section className={tarjeta}>
          <div>
            <h2 className="text-lg font-extrabold">Colores más comunes</h2>
            {ayudaColores && <p className="text-sm text-texto-suave">{ayudaColores}</p>}
          </div>
          <BarrasHorizontales
            vacio="Sin colores registrados."
            datos={datos.masComunes.colores.map((c) => {
              const hex = conHex({ id: 0, nombre: c.nombre }).hex ?? null
              return { nombre: c.nombre, total: c.total, hex, color: hex ?? undefined }
            })}
          />
        </section>

        <section className={tarjeta}>
          <h2 className="text-lg font-extrabold">Razas más comunes</h2>
          <BarrasHorizontales vacio="Sin razas registradas." datos={datos.masComunes.razas} />
        </section>
      </div>
    </div>
  )
}
