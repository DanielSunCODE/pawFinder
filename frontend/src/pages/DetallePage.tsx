// Detalle de un registro. (Esqueleto: los datos del perrito se agregan en otra entrega.)
import { Dog } from 'lucide-react'
import { useParams } from 'react-router'
import { Vacio } from '../components/Estado'

export function DetallePage() {
  const { id } = useParams()
  return (
    <Vacio icono={<Dog size={32} />} titulo={`Perrito #${id}`}>
      <p>Aquí irá la ficha del perrito: foto, raza, colores, fecha y dónde se vio.</p>
    </Vacio>
  )
}
