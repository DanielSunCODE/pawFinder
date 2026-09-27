// Lista de perritos registrados. (Esqueleto: la lista y los filtros se agregan en otra entrega.)
import { List } from 'lucide-react'
import { Vacio } from '../components/Estado'

export function ListaPage() {
  return (
    <Vacio icono={<List size={32} />} titulo="Perritos registrados">
      <p>Aquí irá la lista con foto en miniatura, con búsqueda y filtros por raza y color.</p>
    </Vacio>
  )
}
