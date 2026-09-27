// Formulario para registrar un perrito. (Esqueleto: el formulario se agrega en otra entrega.)
import { Camera } from 'lucide-react'
import { Vacio } from '../components/Estado'

export function RegistrarPage() {
  return (
    <Vacio icono={<Camera size={32} />} titulo="Registrar perrito">
      <p>Aquí irá el formulario: foto, nombre, raza, colores y ubicación en el mapa.</p>
    </Vacio>
  )
}
