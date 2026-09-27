// Ubicación: un pin en el mapa. Se puede usar la ubicación actual o mover el pin a mano
// (tocando el mapa o arrastrando el pin). Se guardan latitud y longitud.
import type { LeafletMouseEvent, Marker as MarcadorLeaflet } from 'leaflet'
import { LoaderCircle, LocateFixed, MapPin } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Marker, useMap, useMapEvents } from 'react-leaflet'
import { formatearCoordenadas } from '../../utils/formato'
import { obtenerUbicacionActual } from '../../utils/ubicacion'
import type { Ubicacion } from '../../utils/validacion'
import { MapaBase } from '../mapa/MapaBase'
import { iconoUbicacion } from '../mapa/iconos'
import { estilos } from './estilos'

/** Escucha los toques en el mapa. */
function AlTocarMapa({ alTocar }: { alTocar: (ubicacion: Ubicacion) => void }) {
  useMapEvents({
    click: (evento: LeafletMouseEvent) => alTocar({ latitud: evento.latlng.lat, longitud: evento.latlng.lng }),
  })
  return null
}

/** Centra el mapa en `destino` cada vez que cambia. */
function CentrarEn({ destino }: { destino: Ubicacion | null }) {
  const mapa = useMap()
  useEffect(() => {
    if (destino) mapa.flyTo([destino.latitud, destino.longitud], 17, { duration: 0.6 })
  }, [mapa, destino])
  return null
}

interface Props {
  ubicacion: Ubicacion | null
  alCambiar: (ubicacion: Ubicacion) => void
  error?: string
}

export function SelectorUbicacion({ ubicacion, alCambiar, error }: Props) {
  const [buscando, setBuscando] = useState(false)
  const [aviso, setAviso] = useState<string | null>(null)
  const [precision, setPrecision] = useState<number | null>(null)
  const [destino, setDestino] = useState<Ubicacion | null>(null)

  async function usarMiUbicacion() {
    setBuscando(true)
    setAviso(null)
    try {
      const actual = await obtenerUbicacionActual()
      const nueva = { latitud: actual.latitud, longitud: actual.longitud }
      alCambiar(nueva)
      setDestino(nueva)
      setPrecision(actual.precision)
    } catch (e) {
      setAviso(e instanceof Error ? e.message : 'No pudimos obtener tu ubicación.')
    } finally {
      setBuscando(false)
    }
  }

  function moverPin(nueva: Ubicacion) {
    alCambiar(nueva)
    setPrecision(null) // ya no es la del GPS, la puso el usuario
  }

  // Si el usuario ya había dado permiso de ubicación antes, la usamos de una vez al abrir.
  useEffect(() => {
    navigator.permissions
      ?.query({ name: 'geolocation' })
      .then((permiso) => {
        if (permiso.state === 'granted') void usarMiUbicacion()
      })
      .catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps -- sólo al abrir el formulario
  }, [])

  return (
    <div className={estilos.ubicacion} id="campo-ubicacion">
      <button type="button" className="boton boton--secundario boton--bloque" onClick={usarMiUbicacion} disabled={buscando}>
        {buscando ? <LoaderCircle className="animate-spin" size={18} aria-hidden="true" /> : <LocateFixed size={18} aria-hidden="true" />}
        {buscando ? 'Buscando tu ubicación…' : 'Usar mi ubicación actual'}
      </button>

      <div className={estilos.mapaMarco}>
        <MapaBase className={estilos.mapa} scrollWheelZoom={false}>
          <AlTocarMapa alTocar={moverPin} />
          <CentrarEn destino={destino} />
          {ubicacion && (
            <Marker
              position={[ubicacion.latitud, ubicacion.longitud]}
              icon={iconoUbicacion}
              draggable
              eventHandlers={{
                dragend: (evento) => {
                  const { lat, lng } = (evento.target as MarcadorLeaflet).getLatLng()
                  moverPin({ latitud: lat, longitud: lng })
                },
              }}
            />
          )}
        </MapaBase>
        {!ubicacion && <div className={estilos.mapaPista}>Toca el mapa donde viste al perrito</div>}
      </div>

      <p className={estilos.ayuda}>
        {ubicacion ? (
          <>
            <MapPin size={14} aria-hidden="true" /> {formatearCoordenadas(ubicacion.latitud, ubicacion.longitud)}
            {precision !== null && ` · precisión aprox. ${Math.round(precision)} m`}
            <span className={estilos.ayudaSuave}> · arrastra el pin para ajustar</span>
          </>
        ) : (
          'Usa tu ubicación o toca el mapa para marcar el punto.'
        )}
      </p>

      {aviso && (
        <p className={estilos.aviso} role="alert">
          {aviso}
        </p>
      )}
      {error && <p className={estilos.error}>{error}</p>}
    </div>
  )
}
