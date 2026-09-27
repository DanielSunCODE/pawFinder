import { MapPin } from 'lucide-react'
import { Link } from 'react-router'
import { Vacio } from '../components/Estado'

export function NoEncontradaPage() {
  return (
    <Vacio icono={<MapPin size={32} />} titulo="Esta página no existe">
      <p>Puede que el enlace esté mal escrito.</p>
      <Link to="/" className="boton boton--primario">
        Ir al mapa
      </Link>
    </Vacio>
  )
}
