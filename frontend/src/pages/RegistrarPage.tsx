// Formulario para registrar un perrito.
//
// Sólo se escriben a mano el nombre y las marcas distintivas; todo lo demás se elige de listas
// que vienen de la base (razas, colores, ojos, patrones) o de valores fijos (sexo, tamaño…).
// Los datos de apariencia son opcionales: "No sé" manda null.
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
import { SelectorOpciones } from '../components/formulario/SelectorOpciones'
import { SelectorUbicacion } from '../components/formulario/SelectorUbicacion'
import { estilos } from '../components/formulario/estilos'
import { useAsync } from '../hooks/useAsync'
import { clases } from '../utils/clases'
import { generarClaveIdempotencia } from '../utils/idempotencia'
import { OPCIONES_ETAPA, OPCIONES_PELAJE, OPCIONES_SEXO, OPCIONES_TAMANO } from '../utils/opciones'
import { conReintentos } from '../utils/reintentos'
import { esSolido, normalizar } from '../utils/transformaciones'
import {
  MAX_COLORES_ADICIONALES,
  MAX_LARGO_MARCAS,
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
  sexo: null,
  etapaVida: null,
  tamano: null,
  longitudPelaje: null,
  patronPelajeId: null,
  colorPrincipalId: null,
  coloresAdicionalesIds: [],
  colorOjosId: null,
  marcasDistintivas: '',
  ubicacion: null,
}

/** Orden en que aparecen los campos, para llevar al usuario al primer error. */
const ORDEN_CAMPOS: CampoFormulario[] = [
  'foto',
  'nombre',
  'razaId',
  'sexo',
  'etapaVida',
  'tamano',
  'longitudPelaje',
  'patronPelajeId',
  'colorPrincipalId',
  'coloresAdicionalesIds',
  'colorOjosId',
  'marcasDistintivas',
  'ubicacion',
]

function irAlPrimerError(errores: ErroresFormulario) {
  const primero = ORDEN_CAMPOS.find((campo) => errores[campo])
  const elemento = primero && document.getElementById(`campo-${primero}`)
  if (!elemento) return
  elemento.scrollIntoView({ behavior: 'smooth', block: 'center' })
  elemento.querySelector<HTMLElement>('input:not([hidden]), select, textarea, button')?.focus({ preventScroll: true })
}

/** Convierte los datos del formulario (ya validados) al formato que se envía a la API. */
function aNuevoPerrito(datos: DatosFormulario): NuevoPerrito {
  return {
    nombre: datos.nombre.trim(),
    razaId: datos.razaId as Id,
    colorPrincipalId: datos.colorPrincipalId as Id,
    coloresAdicionalesIds: datos.coloresAdicionalesIds,
    sexo: datos.sexo,
    etapaVida: datos.etapaVida,
    tamano: datos.tamano,
    longitudPelaje: datos.longitudPelaje,
    patronPelajeId: datos.patronPelajeId,
    colorOjosId: datos.colorOjosId,
    marcasDistintivas: datos.marcasDistintivas.trim() || null,
    latitud: datos.ubicacion?.latitud as number,
    longitud: datos.ubicacion?.longitud as number,
  }
}

export function RegistrarPage() {
  const navegar = useNavigate()
  const catalogos = useAsync(() => api.cargarCatalogos(), [])

  const [datosEditados, setDatos] = useState<DatosFormulario>(FORMULARIO_VACIO)
  const [claveIdempotencia] = useState(generarClaveIdempotencia) // se genera al abrir el formulario
  const [intentoEnviar, setIntentoEnviar] = useState(false)
  const [erroresServidor, setErroresServidor] = useState<ErroresFormulario>({})
  const [enviando, setEnviando] = useState(false)
  const [estadoEnvio, setEstadoEnvio] = useState<string | null>(null)
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null)

  // Valores que dependen del catálogo: la raza por defecto y cuál patrón es "Sólido".
  const razas = catalogos.datos?.razas ?? []
  const patrones = catalogos.datos?.patronesPelaje ?? []
  const idSinRaza = razas.find((raza) => normalizar(raza.nombre).startsWith('sin raza'))?.id ?? null
  const idPatronSolido = patrones.find(esSolido)?.id ?? null

  // Si la persona no ha elegido raza, se usa "Sin raza definida / Criollo".
  const datos: DatosFormulario = { ...datosEditados, razaId: datosEditados.razaId ?? idSinRaza }
  const esPatronSolido = idPatronSolido !== null && datos.patronPelajeId === idPatronSolido

  // Los errores locales se muestran después del primer intento de envío y se recalculan en vivo.
  const errores: ErroresFormulario = {
    ...(intentoEnviar ? validarRegistro(datos, { idPatronSolido }) : {}),
    ...erroresServidor,
  }

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

  function elegirPatron(id: Id | null) {
    actualizar('patronPelajeId', id)
    // Pelaje sólido = un solo color: se quitan los adicionales.
    if (id !== null && id === idPatronSolido) actualizar('coloresAdicionalesIds', [])
  }

  async function enviar(evento: FormEvent) {
    evento.preventDefault()
    if (enviando) return // el botón ya está deshabilitado; esto es una segunda barrera

    setIntentoEnviar(true)
    setErrorGeneral(null)
    const erroresLocales = validarRegistro(datos, { idPatronSolido })
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
  const { colores, coloresOjos } = catalogos.datos

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
            Raza <span className={estilos.obligatorio}>*</span>
          </label>
          <select
            id="raza"
            className={clases(estilos.entrada, 'select-flecha pr-10', errores.razaId ? 'border-error' : 'border-borde-fuerte')}
            value={datos.razaId ?? ''}
            onChange={(e) => actualizar('razaId', e.target.value ? Number(e.target.value) : null)}
          >
            {datos.razaId === null && <option value="">Elige una raza</option>}
            {razas.map((raza) => (
              <option key={raza.id} value={raza.id}>
                {raza.nombre}
              </option>
            ))}
          </select>
          {errores.razaId && <p className={estilos.error}>{errores.razaId}</p>}
        </div>

        <SelectorOpciones
          campo="sexo"
          titulo="Sexo"
          opciones={OPCIONES_SEXO}
          valor={datos.sexo}
          alCambiar={(valor) => actualizar('sexo', valor)}
          opcional={false}
          error={errores.sexo}
        />

        <SelectorOpciones
          campo="etapaVida"
          titulo="Edad"
          opciones={OPCIONES_ETAPA}
          valor={datos.etapaVida}
          alCambiar={(valor) => actualizar('etapaVida', valor)}
          opcional={false}
          error={errores.etapaVida}
        />
      </section>

      <section className={estilos.seccion}>
        <h2 className={estilos.seccionTitulo}>
          <span className={estilos.numero}>3</span> ¿Cómo es?
        </h2>

        <SelectorOpciones
          campo="tamano"
          titulo="Tamaño"
          opciones={OPCIONES_TAMANO}
          valor={datos.tamano}
          alCambiar={(valor) => actualizar('tamano', valor)}
          opcional={false}
          error={errores.tamano}
        />

        <SelectorOpciones
          campo="longitudPelaje"
          titulo="Largo del pelo"
          opciones={OPCIONES_PELAJE}
          valor={datos.longitudPelaje}
          alCambiar={(valor) => actualizar('longitudPelaje', valor)}
          opcional={false}
          error={errores.longitudPelaje}
        />

        <div className={estilos.campo} id="campo-patronPelajeId">
          <label htmlFor="patron" className={estilos.etiqueta}>
            Patrón del pelaje <span className={estilos.obligatorio}>*</span>
          </label>
          <select
            id="patron"
            className={clases(
              estilos.entrada,
              'select-flecha pr-10',
              errores.patronPelajeId ? 'border-error' : 'border-borde-fuerte',
            )}
            value={datos.patronPelajeId ?? ''}
            onChange={(e) => elegirPatron(e.target.value ? Number(e.target.value) : null)}
          >
            {datos.patronPelajeId === null && <option value="">Elige un patrón</option>}
            {patrones.map((patron) => (
              <option key={patron.id} value={patron.id}>
                {patron.nombre}
              </option>
            ))}
          </select>
          {errores.patronPelajeId && <p className={estilos.error}>{errores.patronPelajeId}</p>}
        </div>

        <hr className={estilos.separador} />

        <SelectorColores
          colores={colores}
          principalId={datos.colorPrincipalId}
          adicionalesIds={datos.coloresAdicionalesIds}
          alElegirPrincipal={elegirColorPrincipal}
          alAlternarAdicional={alternarColorAdicional}
          errorPrincipal={errores.colorPrincipalId}
          errorAdicionales={errores.coloresAdicionalesIds}
          soloPrincipal={esPatronSolido}
        />

        <hr className={estilos.separador} />

        <SelectorOpciones
          campo="colorOjosId"
          titulo="Color de ojos"
          opciones={coloresOjos.map((color) => ({ valor: color.id, etiqueta: color.nombre, hex: color.hex ?? null }))}
          valor={datos.colorOjosId}
          alCambiar={(valor) => actualizar('colorOjosId', valor)}
          opcional={false}
          error={errores.colorOjosId}
        />

        <div className={estilos.campo} id="campo-marcasDistintivas">
          <label htmlFor="marcas" className={estilos.etiqueta}>
            Marcas distintivas <span className={estilos.opcional}>opcional</span>
          </label>
          <textarea
            id="marcas"
            className={clases(estilos.areaTexto, errores.marcasDistintivas ? 'border-error' : 'border-borde-fuerte')}
            value={datos.marcasDistintivas}
            onChange={(e) => actualizar('marcasDistintivas', e.target.value)}
            maxLength={MAX_LARGO_MARCAS}
            rows={3}
            placeholder="Por ejemplo: mancha blanca en el pecho, cojea de una pata, collar rojo…"
            aria-describedby="contador-marcas"
          />
          <span id="contador-marcas" className={estilos.contador}>
            {datos.marcasDistintivas.length} / {MAX_LARGO_MARCAS}
          </span>
          {errores.marcasDistintivas && <p className={estilos.error}>{errores.marcasDistintivas}</p>}
        </div>
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
