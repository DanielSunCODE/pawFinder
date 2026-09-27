// Pantalla principal: mapa con un pin por perrito. (Esqueleto: el mapa se agrega en la siguiente entrega.)
import { Map as IconoMapa } from 'lucide-react'
import { Vacio } from '../components/Estado'

export function MapaPage() {
  return (
    <Vacio icono={<IconoMapa size={32} />} titulo="Mapa de perritos">
      <p>Aquí irá el mapa con un pin por perrito. Al tocar un pin se verá su foto, nombre y colores.</p>
    </Vacio>
  )
}
