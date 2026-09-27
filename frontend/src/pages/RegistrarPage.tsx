// Formulario para registrar un perrito.
//
// Idempotencia: la clave se genera UNA vez al abrir el formulario (useState con inicializador)
// y viaja en cada intento de envío. Doble clic o reintento por mala señal → misma clave →
// el backend devuelve el mismo perrito en vez de crear uno repetido.
import { CircleAlert, LoaderCircle, Send, X } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { api, ErrorApi, mensajeDeError, type Id, type NuevoPerrito } from '../api'
import { Cargando, MensajeError } from '../components/Estado'
import { SelectorColores } from '../components/formulario/SelectorColores'
import { SelectorFoto } from '../components/formulario/SelectorFoto'
import { SelectorUbicacion } from '../components/formulario/SelectorUbicacion'
import { estilos } from '../components/formulario/estilos'
import { useAsync } from '../hooks/useAsync'
import { clases } from '../utils/clases'
import { generarClaveIdempotencia } from '../utils/idempotencia'
import { conReintentos } from '../utils/reintentos'
import {
  MAX_COLORES_ADICIONALES,
  MAX_LARGO_NOMBRE,
  erroresDelServidor,
  hayErrores,
  validarRegistro,
  type CampoFormulario,
  type DatosFormulario,
  type ErroresFormulario,
} from '../utils/validacion'

const FORMULARIO_VACIO: DatosFormulario = {
  foto: null,
  nombre: '',
  razaId: null,
  colorPrincipalId: null,
  coloresAdicionalesIds: [],
  ubicacion: null,
}

/** Orden en que aparecen los campos, para llevar al usuario al primer error. */
const ORDEN_CAMPOS: CampoFormulario[] = ['foto', 'nombre', 'razaId', 'colorPrincipalId', 'coloresAdicionalesIds', 'ubicacion']

function irAlPrimerError(errores: ErroresFormulario) {
  const primero = ORDEN_CAMPOS.find((campo) => errores[campo])
  const elemento = primero && document.getElementById(`campo-${primero}`)
  if (!elemento) return
  elemento.scrollIntoView({ behavior: 'smooth', block: 'center' })
  elemento.querySelector<HTMLElement>('input:not([hidden]), select, button')?.focus({ preventScroll: true })
}

/** Convierte los datos del formulario (ya validados) al formato que espera la API. */
function aNuevoPerrito(datos: DatosFormulario): NuevoPerrito {
  return {
    nombre: datos.nombre.trim(),
    razaId: datos.razaId,
    colorPrincipalId: datos.colorPrincipalId as Id,
    coloresAdicionalesIds: datos.coloresAdicionalesIds,
    latitud: datos.ubicacion?.latitud as number,
    longitud: datos.ubicacion?.longitud as number,
  }
}

export function RegistrarPage() {
  const navegar = useNavigate()
  const catalogos = useAsync(() => Promise.all([api.listarRazas(), api.listarColores()]), [])

  const [datos, setDatos] = useState<DatosFormulario>(FORMULARIO_VACIO)
  const [claveIdempotencia] = useState(generarClaveIdempotencia) // se genera al abrir el formulario
  const [intentoEnviar, setIntentoEnviar] = useState(false)
  const [erroresServidor, setErroresServidor] = useState<ErroresFormulario>({})
  const [enviando, setEnviando] = useState(false)
  const [estadoEnvio, setEstadoEnvio] = useState<string | null>(null)
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null)

  // Los errores locales se muestran después del primer intento de envío y se recalculan en vivo.
  const errores: ErroresFormulario = { ...(intentoEnviar ? validarRegistro(datos) : {}), ...erroresServidor }

  function actualizar<C extends CampoFormulario>(campo: C, valor: DatosFormulario[C]) {
    setDatos((anteriores) => ({ ...anteriores, [campo]: valor }))
    // Si el servidor había marcado este campo, el mensaje ya no aplica.
    setErroresServidor((anteriores) =>
      Object.fromEntries(Object.entries(anteriores).filter(([llave]) => llave !== campo)),
    )
  }

  function elegirColorPrincipal(id: Id) {
    actualizar('colorPrincipalId', id)
    // Si ese color estaba como adicional, se quita (no se puede repetir).
    actualizar(
      'coloresAdicionalesIds',
      datos.coloresAdicionalesIds.filter((adicional) => adicional !== id),
    )
  }

  function alternarColorAdicional(id: Id) {
    const actuales = datos.coloresAdicionalesIds
    if (actuales.includes(id)) actualizar('coloresAdicionalesIds', actuales.filter((a) => a !== id))
    else if (actuales.length < MAX_COLORES_ADICIONALES) actualizar('coloresAdicionalesIds', [...actuales, id])
  }

  async function enviar(evento: FormEvent) {
    evento.preventDefault()
    if (enviando) return // el botón ya está deshabilitado; esto es una segunda barrera

    setIntentoEnviar(true)
    setErrorGeneral(null)
    const erroresLocales = validarRegistro(datos)
    if (hayErrores(erroresLocales)) {
      irAlPrimerError(erroresLocales)
      return
    }

    setEnviando(true)
    try {
      const perrito = await conReintentos(
        () => api.crearPerrito(aNuevoPerrito(datos), datos.foto as File, claveIdempotencia),
        { alReintentar: (intento, total) => setEstadoEnvio(`Conexión inestable. Reintentando (${intento} de ${total})…`) },
      )
      navegar(`/perritos/${perrito.id}?nuevo=1`, { replace: true })
    } catch (error) {
      if (error instanceof ErrorApi && hayErrores(error.campos)) {
        const porCampo = erroresDelServidor(error.campos)
        setErroresServidor(porCampo)
        irAlPrimerError(porCampo)
      }
      setErrorGeneral(mensajeDeError(error))
    } finally {
      setEnviando(false)
      setEstadoEnvio(null)
    }
  }

  function cancelar() {
    const hayHistorial = (window.history.state?.idx ?? 0) > 0
    if (hayHistorial) navegar(-1)
    else navegar('/')
  }

  if (catalogos.error) return <MensajeError mensaje={catalogos.error} alReintentar={catalogos.reintentar} />
  if (!catalogos.datos) return <Cargando texto="Preparando formulario…" />
  const [razas, colores] = catalogos.datos

  const listaErrores = ORDEN_CAMPOS.filter((campo) => errores[campo]).map((campo) => ({ campo, mensaje: errores[campo] }))

  return (
    <form className={estilos.formulario} onSubmit={enviar} noValidate>
      <div className={estilos.encabezado}>
        <button type="button" className={estilos.cerrar} onClick={cancelar} aria-label="Cancelar y salir">
          <X size={24} />
        </button>
        <h1>Registrar perrito</h1>
      </div>
      <p className={estilos.intro}>
        Los campos con <span className={estilos.obligatorio}>*</span> son obligatorios. La fecha se guarda sola.
      </p>

      <section className={estilos.seccion} id="campo-foto">
        <h2 className={estilos.seccionTitulo}>
          <span className={estilos.numero}>1</span> Foto <span className={estilos.obligatorio}>*</span>
        </h2>
        <SelectorFoto foto={datos.foto} alCambiar={(foto) => actualizar('foto', foto)} error={errores.foto} />
      </section>

      <section className={estilos.seccion}>
        <h2 className={estilos.seccionTitulo}>
          <span className={estilos.numero}>2</span> ¿Quién es?
        </h2>

        <div className={estilos.campo} id="campo-nombre">
          <label htmlFor="nombre" className={estilos.etiqueta}>
            Nombre <span className={estilos.obligatorio}>*</span>
          </label>
          <input
            id="nombre"
            className={clases(estilos.entrada, errores.nombre ? 'border-error' : 'border-borde-fuerte')}
            value={datos.nombre}
            onChange={(e) => actualizar('nombre', e.target.value)}
            maxLength={MAX_LARGO_NOMBRE}
            placeholder="Por ejemplo: Firulais"
            autoComplete="off"
            autoCapitalize="words"
            enterKeyHint="next"
            aria-invalid={Boolean(errores.nombre)}
            aria-describedby={errores.nombre ? 'error-nombre' : undefined}
          />
          {errores.nombre && (
            <p id="error-nombre" className={estilos.error}>
              {errores.nombre}
            </p>
          )}
        </div>

        <div className={estilos.campo} id="campo-razaId">
          <label htmlFor="raza" className={estilos.etiqueta}>
            Raza <span className={estilos.opcional}>opcional</span>
          </label>
          <select
            id="raza"
            className={clases(estilos.entrada, 'select-flecha border-borde-fuerte pr-10')}
            value={datos.razaId ?? ''}
            onChange={(e) => actualizar('razaId', e.target.value ? Number(e.target.value) : null)}
          >
            <option value="">Sin especificar</option>
            {razas.map((raza) => (
              <option key={raza.id} value={raza.id}>
                {raza.nombre}
              </option>
            ))}
          </select>
          {errores.razaId && <p className={estilos.error}>{errores.razaId}</p>}
        </div>
      </section>

      <section className={estilos.seccion}>
        <h2 className={estilos.seccionTitulo}>
          <span className={estilos.numero}>3</span> Colores
        </h2>
        <SelectorColores
          colores={colores}
          principalId={datos.colorPrincipalId}
          adicionalesIds={datos.coloresAdicionalesIds}
          alElegirPrincipal={elegirColorPrincipal}
          alAlternarAdicional={alternarColorAdicional}
          errorPrincipal={errores.colorPrincipalId}
          errorAdicionales={errores.coloresAdicionalesIds}
        />
      </section>

      <section className={estilos.seccion}>
        <h2 className={estilos.seccionTitulo}>
          <span className={estilos.numero}>4</span> ¿Dónde lo viste? <span className={estilos.obligatorio}>*</span>
        </h2>
        <SelectorUbicacion
          ubicacion={datos.ubicacion}
          alCambiar={(ubicacion) => actualizar('ubicacion', ubicacion)}
          error={errores.ubicacion}
        />
      </section>

      {listaErrores.length > 0 && (
        <div className={estilos.resumenErrores} role="alert">
          <p>Todavía no se puede guardar:</p>
          <ul>
            {listaErrores.map(({ campo, mensaje }) => (
              <li key={campo}>
                <button type="button" onClick={() => irAlPrimerError({ [campo]: mensaje })}>
                  {mensaje}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {errorGeneral && !hayErrores(errores) && (
        <div className={estilos.errorGeneral} role="alert">
          <CircleAlert size={22} aria-hidden="true" />
          <p>{errorGeneral}</p>
        </div>
      )}

      <div className={estilos.barraEnviar}>
        <button type="submit" className={clases('boton boton--primario boton--bloque', estilos.botonEnviar)} disabled={enviando}>
          {enviando ? <LoaderCircle className="animate-spin" size={20} aria-hidden="true" /> : <Send size={20} aria-hidden="true" />}
          {enviando ? 'Guardando…' : 'Registrar perrito'}
        </button>
        {estadoEnvio && (
          <p className={estilos.estadoEnvio} role="status">
            {estadoEnvio}
          </p>
        )}
      </div>
    </form>
  )
}
