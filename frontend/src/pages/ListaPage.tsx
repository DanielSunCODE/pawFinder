// Lista de perritos con foto en miniatura y filtros.
// Los filtros viajan a la API como query params: el filtrado lo hace PostgreSQL, no el navegador.
// También se guardan en la URL, así al volver del detalle siguen puestos.
import { LoaderCircle, Search, SearchX, X } from 'lucide-react'
import { Link, useSearchParams } from 'react-router'
import { api } from '../api'
import { Muestra } from '../components/Colores'
import { Cargando, MensajeError, Vacio } from '../components/Estado'
import { TarjetaPerrito } from '../components/TarjetaPerrito'
import { useAsync } from '../hooks/useAsync'
import { useValorRetrasado } from '../hooks/useValorRetrasado'
import { clases } from '../utils/clases'

/** "3" → 3; vacío o texto raro en la URL → undefined (sin filtro). */
const aNumero = (valor: string | null) => {
  const numero = Number(valor)
  return valor && Number.isInteger(numero) ? numero : undefined
}

export function ListaPage() {
  const [parametros, setParametros] = useSearchParams()
  const busqueda = parametros.get('busqueda') ?? ''
  const colorId = aNumero(parametros.get('color'))
  const razaId = aNumero(parametros.get('raza'))
  const hayFiltros = Boolean(busqueda || colorId || razaId)

  // Esperamos a que el usuario deje de escribir para no llamar a la API en cada letra.
  const busquedaRetrasada = useValorRetrasado(busqueda.trim())

  const perritos = useAsync(
    () => api.listarPerritos({ busqueda: busquedaRetrasada || undefined, colorId, razaId }),
    [busquedaRetrasada, colorId, razaId],
  )
  const catalogos = useAsync(() => Promise.all([api.listarRazas(), api.listarColores()]), [])
  const [razas, colores] = catalogos.datos ?? [[], []]

  function cambiarFiltro(llave: 'busqueda' | 'color' | 'raza', valor: string | null) {
    setParametros(
      (anteriores) => {
        const nuevos = new URLSearchParams(anteriores)
        if (valor) nuevos.set(llave, valor)
        else nuevos.delete(llave)
        return nuevos
      },
      { replace: true },
    )
  }

  const total = perritos.datos?.length ?? 0

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-[1.6rem] font-extrabold">Perritos registrados</h1>

      <section className="grid gap-2.5 md:grid-cols-[1fr_260px]" aria-label="Filtros">
        <div className="flex h-12.5 items-center gap-2.5 rounded-full border-[1.5px] border-borde bg-superficie pr-2 pl-4 text-texto-suave focus-within:border-primario-vivo">
          <Search size={20} aria-hidden="true" />
          <input
            type="search"
            className="h-full min-w-0 flex-1 bg-transparent text-texto outline-none [&::-webkit-search-cancel-button]:hidden"
            placeholder="Buscar por nombre"
            aria-label="Buscar por nombre"
            value={busqueda}
            onChange={(e) => cambiarFiltro('busqueda', e.target.value)}
            enterKeyHint="search"
          />
          {busqueda && (
            <button
              type="button"
              className="grid size-9 place-items-center rounded-full bg-superficie-2 text-texto"
              onClick={() => cambiarFiltro('busqueda', null)}
              aria-label="Borrar búsqueda"
            >
              <X size={18} />
            </button>
          )}
        </div>

        <select
          className="select-flecha h-12.5 rounded-full border-[1.5px] border-borde bg-superficie pr-10 pl-4 font-semibold"
          aria-label="Filtrar por raza"
          value={razaId ?? ''}
          onChange={(e) => cambiarFiltro('raza', e.target.value || null)}
        >
          <option value="">Todas las razas</option>
          {razas.map((raza) => (
            <option key={raza.id} value={raza.id}>
              {raza.nombre}
            </option>
          ))}
        </select>

        <div
          className="-mx-4 flex gap-2 overflow-x-auto px-4 pt-0.5 pb-1.5 [scrollbar-width:none] md:col-span-full md:mx-0 md:flex-wrap md:p-0"
          role="group"
          aria-label="Filtrar por color"
        >
          <button
            type="button"
            className={clases('inline-flex h-9.5 shrink-0 items-center gap-1.5 rounded-full border-[1.5px] pr-3.5 pl-2.5 text-sm font-bold pl-3.5', !colorId ? 'border-primario bg-primario-suave text-primario' : 'border-borde bg-superficie')}
            aria-pressed={!colorId}
            onClick={() => cambiarFiltro('color', null)}
          >
            Todos los colores
          </button>
          {colores.map((color) => (
            <button
              key={color.id}
              type="button"
              className={clases('inline-flex h-9.5 shrink-0 items-center gap-1.5 rounded-full border-[1.5px] pr-3.5 pl-2.5 text-sm font-bold', colorId === color.id ? 'border-primario bg-primario-suave text-primario' : 'border-borde bg-superficie')}
              aria-pressed={colorId === color.id}
              onClick={() => cambiarFiltro('color', colorId === color.id ? null : String(color.id))}
            >
              <Muestra hex={color.hex} />
              {color.nombre}
            </button>
          ))}
        </div>
      </section>

      <div className="flex min-h-6 items-center gap-2 text-sm font-bold text-texto-suave" aria-live="polite">
        {perritos.datos && (
          <span>
            {total} {total === 1 ? 'perrito' : 'perritos'}
            {hayFiltros && ' con esos filtros'}
          </span>
        )}
        {perritos.cargando && perritos.datos && <LoaderCircle className="animate-spin" size={16} aria-label="Actualizando" />}
        {hayFiltros && (
          <button type="button" className="ml-auto py-1 font-extrabold text-primario" onClick={() => setParametros({}, { replace: true })}>
            Quitar filtros
          </button>
        )}
      </div>

      {perritos.error ? (
        <MensajeError mensaje={perritos.error} alReintentar={perritos.reintentar} />
      ) : !perritos.datos ? (
        <Cargando texto="Cargando perritos…" />
      ) : total === 0 ? (
        <Vacio icono={<SearchX size={32} />} titulo={hayFiltros ? 'Ningún perrito coincide' : 'Aún no hay perritos'}>
          {hayFiltros ? (
            <button type="button" className="boton boton--secundario" onClick={() => setParametros({}, { replace: true })}>
              Quitar filtros
            </button>
          ) : (
            <Link to="/registrar" className="boton boton--primario">
              Registrar el primero
            </Link>
          )}
        </Vacio>
      ) : (
        <ul className={clases(
            'grid grid-cols-2 gap-3 transition-opacity duration-200 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 lg:gap-5',
            perritos.cargando && 'opacity-60',
          )}>
          {perritos.datos.map((perrito) => (
            <li key={perrito.id}>
              <TarjetaPerrito perrito={perrito} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
