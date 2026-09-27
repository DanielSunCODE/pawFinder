// Pantalla principal: todos los perritos en el mapa, un pin por perrito.
// Al tocar un pin se ve su foto, nombre y colores.
import { LoaderCircle, LocateFixed, PawPrint, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { CircleMarker, Marker, Popup, useMap } from 'react-leaflet'
import { Link } from 'react-router'
import { api, type Perrito } from '../api'
import { EtiquetasColores } from '../components/Colores'
import { MensajeError } from '../components/Estado'
import { MapaBase } from '../components/mapa/MapaBase'
import { iconoPerrito } from '../components/mapa/iconos'
import { useAsync } from '../hooks/useAsync'
import { coloresDe, coordenadasDe } from '../utils/transformaciones'
import { obtenerUbicacionActual, type UbicacionActual } from '../utils/ubicacion'

/** Encuadra el mapa para que se vean todos los perritos (sólo la primera vez). */
function EncuadrarPerritos({ perritos }: { perritos: Perrito[] }) {
  const mapa = useMap()
  const yaEncuadrado = useRef(false)
  useEffect(() => {
    if (yaEncuadrado.current || perritos.length === 0) return
    yaEncuadrado.current = true
    if (perritos.length === 1) mapa.setView([perritos[0].latitud, perritos[0].longitud], 16)
    else mapa.fitBounds(coordenadasDe(perritos), { padding: [40, 40], maxZoom: 16 })
  }, [mapa, perritos])
  return null
}

/** Mueve el mapa a la ubicación del usuario cuando la obtiene. */
function VolarA({ destino }: { destino: UbicacionActual | null }) {
  const mapa = useMap()
  useEffect(() => {
    if (destino) mapa.flyTo([destino.latitud, destino.longitud], 16, { duration: 0.8 })
  }, [mapa, destino])
  return null
}

function GloboPerrito({ perrito }: { perrito: Perrito }) {
  return (
    <Popup className="popup-perrito" minWidth={240} maxWidth={240} autoPanPaddingTopLeft={[16, 72]}>
      <img className="aspect-4/3 w-full bg-superficie-2 object-cover" src={perrito.fotoUrl} alt={`Foto de ${perrito.nombre}`} />
      <div className="flex flex-col gap-2.5 px-3.5 pt-3 pb-3.5">
        <strong className="text-lg font-extrabold">{perrito.nombre}</strong>
        <EtiquetasColores colores={coloresDe(perrito)} />
        <Link to={`/perritos/${perrito.id}`} className="boton boton--primario boton--chico boton--bloque">
          Ver detalle
        </Link>
      </div>
    </Popup>
  )
}

export function MapaPage() {
  const { datos: perritos, cargando, error, reintentar } = useAsync(() => api.listarPerritos(), [])
  const [miUbicacion, setMiUbicacion] = useState<UbicacionActual | null>(null)
  const [buscandoUbicacion, setBuscandoUbicacion] = useState(false)
  const [errorUbicacion, setErrorUbicacion] = useState<string | null>(null)

  // Creamos los íconos una sola vez por lista, no en cada render.
  const marcadores = useMemo(
    () => (perritos ?? []).map((perrito) => ({ perrito, icono: iconoPerrito(perrito) })),
    [perritos],
  )

  async function irAMiUbicacion() {
    setBuscandoUbicacion(true)
    setErrorUbicacion(null)
    try {
      setMiUbicacion(await obtenerUbicacionActual())
    } catch (e) {
      setErrorUbicacion(e instanceof Error ? e.message : 'No pudimos obtener tu ubicación.')
    } finally {
      setBuscandoUbicacion(false)
    }
  }

  const total = perritos?.length ?? 0

  return (
    <div className="relative h-full">
      <MapaBase className="size-full">
        {perritos && <EncuadrarPerritos perritos={perritos} />}
        <VolarA destino={miUbicacion} />

        {marcadores.map(({ perrito, icono }) => (
          <Marker key={perrito.id} position={[perrito.latitud, perrito.longitud]} icon={icono} alt={perrito.nombre}>
            <GloboPerrito perrito={perrito} />
          </Marker>
        ))}

        {miUbicacion && (
          <CircleMarker
            center={[miUbicacion.latitud, miUbicacion.longitud]}
            radius={9}
            pathOptions={{ color: '#fff', weight: 3, fillColor: '#2F6FDE', fillOpacity: 1 }}
          />
        )}
      </MapaBase>

      <div className="absolute z-1000 bg-superficie shadow-tarjeta top-3.5 left-1/2 inline-flex -translate-x-1/2 items-center gap-2 rounded-full px-4 py-2 text-sm font-bold whitespace-nowrap text-texto" role="status">
        {cargando && !perritos ? (
          <>
            <LoaderCircle className="animate-spin text-primario" size={16} aria-hidden="true" /> Cargando perritos…
          </>
        ) : (
          <>
            <PawPrint className="text-primario" size={16} aria-hidden="true" /> {total} {total === 1 ? 'perrito' : 'perritos'} en el mapa
          </>
        )}
      </div>

      <button
        type="button"
        className="absolute z-1000 bg-superficie shadow-tarjeta right-3 bottom-6 grid size-13 place-items-center rounded-2xl text-primario"
        onClick={irAMiUbicacion}
        disabled={buscandoUbicacion}
        aria-label="Ir a mi ubicación"
      >
        {buscandoUbicacion ? <LoaderCircle className="animate-spin" size={22} /> : <LocateFixed size={22} />}
      </button>

      {error && (
        <div className="absolute z-1000 bg-superficie shadow-tarjeta inset-x-4 bottom-6 mx-auto flex max-w-105 flex-col items-center gap-3 rounded-tarjeta p-5 text-center [&>div]:py-2">
          <MensajeError mensaje={error} alReintentar={reintentar} />
        </div>
      )}

      {!cargando && !error && total === 0 && (
        <div className="absolute z-1000 bg-superficie shadow-tarjeta inset-x-4 bottom-6 mx-auto flex max-w-105 flex-col items-center gap-3 rounded-tarjeta p-5 text-center [&>div]:py-2">
          <p className="text-lg font-extrabold">Aún no hay perritos registrados</p>
          <Link to="/registrar" className="boton boton--primario">
            Registrar el primero
          </Link>
        </div>
      )}

      {errorUbicacion && (
        <div className="absolute z-1000 bg-superficie shadow-tarjeta right-19 bottom-6 left-3 flex max-w-105 items-start gap-2 rounded-campo py-3 pr-2 pl-4 text-sm font-semibold" role="alert">
          <p>{errorUbicacion}</p>
          <button
            type="button"
            className="grid size-8 shrink-0 place-items-center rounded-full bg-superficie-2"
            onClick={() => setErrorUbicacion(null)}
            aria-label="Cerrar aviso"
          >
            <X size={18} />
          </button>
        </div>
      )}
    </div>
  )
}
