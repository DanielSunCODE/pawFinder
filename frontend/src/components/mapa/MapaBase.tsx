// Mapa de Leaflet con la configuración común (mosaicos, centro y zoom por defecto).
// Se usa en la pantalla del mapa, en el detalle y en el formulario.
//
// Si las imágenes del proveedor principal no cargan (servidor caído o una red que lo bloquea),
// cambia solo al proveedor de respaldo para que el mapa no se quede en gris.
import { useRef, useState, type ReactNode } from 'react'
import { AttributionControl, MapContainer, TileLayer } from 'react-leaflet'
import type { MapContainerProps } from 'react-leaflet'
import { config } from '../../config'

interface Props extends MapContainerProps {
  children?: ReactNode
}

/** Cuántas imágenes fallidas (sin que cargue ninguna) antes de pasar al respaldo. */
const FALLAS_ANTES_DE_RESPALDO = 4

export function MapaBase({ children, ...props }: Props) {
  const [usarRespaldo, setUsarRespaldo] = useState(false)
  // useRef: contadores que cambian sin necesidad de volver a dibujar el mapa.
  const conteo = useRef({ fallas: 0, cargadas: 0 })

  const respaldo = config.mapa.respaldo
  const proveedor = usarRespaldo && respaldo ? respaldo : config.mapa.principal

  function alFallarImagen() {
    conteo.current.fallas += 1
    const nuncaCargo = conteo.current.cargadas === 0
    if (respaldo && !usarRespaldo && nuncaCargo && conteo.current.fallas >= FALLAS_ANTES_DE_RESPALDO) {
      setUsarRespaldo(true)
    }
  }

  return (
    <MapContainer center={config.mapa.centro} zoom={config.mapa.zoom} attributionControl={false} {...props}>
      {/* Créditos de los mapas (obligatorios), sin el prefijo de Leaflet para que ocupen menos */}
      <AttributionControl prefix={false} />
      {/* referrerPolicy: los servidores de OpenStreetMap exigen saber desde qué sitio se piden las imágenes */}
      <TileLayer
        key={proveedor.url}
        url={proveedor.url}
        attribution={proveedor.creditos}
        maxZoom={19}
        referrerPolicy="strict-origin-when-cross-origin"
        eventHandlers={{
          tileerror: alFallarImagen,
          tileload: () => {
            conteo.current.cargadas += 1
          },
        }}
      />
      {children}
    </MapContainer>
  )
}
