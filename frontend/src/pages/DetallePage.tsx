// Detalle de un registro: foto grande, datos y dónde se vio en el mapa.
import { ArrowLeft, CircleCheck, ExternalLink } from 'lucide-react'
import { Marker } from 'react-leaflet'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router'
import { api, ErrorApi } from '../api'
import { mensajePorEstado } from '../api/errores'
import { EtiquetasColores } from '../components/Colores'
import { Cargando, MensajeError } from '../components/Estado'
import { MapaBase } from '../components/mapa/MapaBase'
import { iconoUbicacion } from '../components/mapa/iconos'
import { useAsync } from '../hooks/useAsync'
import { formatearCoordenadas, formatearFecha, tiempoRelativo } from '../utils/formato'
import { coloresDe } from '../utils/transformaciones'

export function DetallePage() {
  const { id } = useParams()
  const [parametros] = useSearchParams()
  const navegar = useNavigate()
  const recienRegistrado = parametros.get('nuevo') === '1'
  const idNumerico = Number(id)

  const { datos: perrito, error, reintentar } = useAsync(
    () =>
      Number.isInteger(idNumerico)
        ? api.obtenerPerrito(idNumerico)
        : Promise.reject(new ErrorApi(mensajePorEstado(404), 404)),
    [idNumerico],
  )

  // Si llegamos desde otra pantalla de la app, "Volver" regresa ahí; si no, a la lista.
  const hayHistorial = (window.history.state?.idx ?? 0) > 0
  const volver = () => (hayHistorial && !recienRegistrado ? navegar(-1) : navegar('/perritos'))

  return (
    <div className="flex flex-col gap-4">
      <button type="button" className="inline-flex min-h-10 items-center gap-1.5 self-start rounded-full pr-3.5 pl-2 font-bold text-texto-suave hover:bg-superficie-2 hover:text-texto" onClick={volver}>
        <ArrowLeft size={20} aria-hidden="true" /> Volver
      </button>

      {error ? (
        <MensajeError mensaje={error} alReintentar={reintentar} />
      ) : !perrito ? (
        <Cargando texto="Cargando registro…" />
      ) : (
        <>
          {recienRegistrado && (
            <div className="flex items-center gap-2.5 rounded-campo bg-exito-suave px-4 py-3.5 text-exito [&>p]:text-texto" role="status">
              <CircleCheck size={22} aria-hidden="true" />
              <p>
                <strong>¡Listo!</strong> {perrito.nombre} quedó registrado.
              </p>
            </div>
          )}

          <article className="grid gap-5 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] md:items-start md:gap-8">
            <img className="aspect-4/3 w-full rounded-tarjeta bg-superficie-2 object-cover shadow-tarjeta md:sticky md:top-21 md:aspect-square" src={perrito.fotoUrl} alt={`Foto de ${perrito.nombre}`} />

            <div className="flex min-w-0 flex-col gap-4.5">
              <h1 className="text-[2rem] font-black">{perrito.nombre}</h1>

              <dl className="grid gap-3.5 rounded-tarjeta bg-superficie p-4.5 shadow-suave [&_dd]:font-bold [&_dt]:mb-1 [&_dt]:text-xs [&_dt]:font-extrabold [&_dt]:tracking-wider [&_dt]:text-texto-suave [&_dt]:uppercase">
                <div>
                  <dt>Raza</dt>
                  <dd>{perrito.raza?.nombre ?? 'Sin especificar'}</dd>
                </div>
                <div>
                  <dt>Colores</dt>
                  <dd>
                    <EtiquetasColores colores={coloresDe(perrito)} marcarPrincipal />
                  </dd>
                </div>
                <div>
                  <dt>Registrado</dt>
                  <dd>
                    <time dateTime={perrito.fechaRegistro}>{formatearFecha(perrito.fechaRegistro)}</time>
                    <span className="font-semibold text-texto-suave"> · {tiempoRelativo(perrito.fechaRegistro)}</span>
                  </dd>
                </div>
                <div>
                  <dt>Dónde se vio</dt>
                  <dd className="font-semibold text-texto-suave">{formatearCoordenadas(perrito.latitud, perrito.longitud)}</dd>
                </div>
              </dl>

              <MapaBase
                key={perrito.id}
                className="h-55 rounded-tarjeta"
                center={[perrito.latitud, perrito.longitud]}
                zoom={16}
                scrollWheelZoom={false}
              >
                <Marker position={[perrito.latitud, perrito.longitud]} icon={iconoUbicacion} />
              </MapaBase>

              <div className="flex flex-wrap gap-2.5 [&>*]:flex-[1_1_180px]">
                <a
                  className="boton boton--secundario"
                  href={`https://www.google.com/maps/search/?api=1&query=${perrito.latitud},${perrito.longitud}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Abrir en mapas <ExternalLink size={16} aria-hidden="true" />
                </a>
                <Link to="/" className="boton boton--secundario">
                  Ver todos en el mapa
                </Link>
              </div>
            </div>
          </article>
        </>
      )}
    </div>
  )
}
