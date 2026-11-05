// Aviso "¿no será éste?": antes de guardar, muestra los perritos ya registrados que se parecen
// al que se está llenando. La comparación la hace el servicio Elixir (POST /f/duplicados);
// aquí sólo se pide cuando hay datos suficientes y se muestra el resultado.
//
// Es un aviso, no un bloqueo: si el servicio falla o no hay parecidos, no se muestra nada y
// la persona puede registrar igual.
import { TriangleAlert } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { buscarDuplicados, type ConsultaDuplicados, type PosibleDuplicado } from '../../api/duplicados'
import { config } from '../../config'
import { useValorRetrasado } from '../../hooks/useValorRetrasado'
import { estilos } from './estilos'

/** Espera a que la persona deje de mover el pin o cambiar colores antes de preguntar. */
const PAUSA_MS = 600

const porcentaje = (similitud: number) => `${Math.round(similitud * 100)} %`

interface Props {
  /** Datos del formulario; `null` mientras falte el color principal o la ubicación. */
  consulta: ConsultaDuplicados | null
}

export function AvisoDuplicados({ consulta }: Props) {
  // La consulta se serializa para que el efecto sólo se dispare cuando cambia su contenido.
  const clave = useValorRetrasado(consulta ? JSON.stringify(consulta) : null, PAUSA_MS)
  // La respuesta se guarda junto con la consulta que la originó: si la consulta cambia o se vacía,
  // la respuesta vieja deja de mostrarse sin tener que borrarla.
  const [respuesta, setRespuesta] = useState<{ clave: string; parecidos: PosibleDuplicado[] }>()

  useEffect(() => {
    if (clave === null) return
    // Si llega otra consulta antes de la respuesta, la vieja se descarta.
    let vigente = true
    buscarDuplicados(JSON.parse(clave) as ConsultaDuplicados)
      .then((resultado) => vigente && setRespuesta({ clave, parecidos: resultado.duplicados }))
      .catch(() => vigente && setRespuesta({ clave, parecidos: [] })) // es sólo un aviso: si falla, se registra sin él
    return () => {
      vigente = false
    }
  }, [clave])

  const parecidos = respuesta && respuesta.clave === clave ? respuesta.parecidos : []
  if (parecidos.length === 0) return null

  return (
    <section className={estilos.avisoDuplicados} role="status" aria-live="polite">
      <h2 className={estilos.avisoDuplicadosTitulo}>
        <TriangleAlert size={22} aria-hidden="true" /> ¿No será éste?
      </h2>
      <p>
        Ya hay {parecidos.length === 1 ? 'un perrito registrado muy parecido' : 'perritos registrados muy parecidos'}{' '}
        y cerca de ahí. Si es el mismo, no hace falta registrarlo otra vez.
      </p>
      <ul className={estilos.avisoDuplicadosLista}>
        {parecidos.map((perrito) => (
          <li key={perrito.id}>
            <img src={`${config.apiUrl}/perritos/${perrito.id}/foto`} alt="" loading="lazy" />
            <div>
              <strong>{perrito.nombre}</strong>
              <span>{perrito.raza.nombre ?? 'Sin raza definida'}</span>
              <span>{porcentaje(perrito.similitud)} de parecido</span>
            </div>
            {/* Se abre en otra pestaña para no perder lo que ya se llenó. */}
            <Link to={`/perritos/${perrito.id}`} target="_blank" rel="noopener" className="boton boton--secundario boton--chico">
              Ver
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
