// Campo de foto: tomarla con la cámara del celular o subir una imagen existente.
//
// "Tomar foto" usa <input capture="environment">: en el celular abre directo la cámara trasera.
// "Subir imagen" abre la galería o el explorador de archivos.
// En computadora ambos botones abren el explorador (el atributo capture sólo aplica en celulares).
import { Camera, ImagePlus, LoaderCircle, RefreshCw } from 'lucide-react'
import { useEffect, useRef, useState, type ChangeEvent, type DragEvent } from 'react'
import { ErrorFoto, prepararFoto } from '../../utils/imagen'
import { clases } from '../../utils/clases'
import { estilos } from './estilos'

/**
 * Muestra un archivo de imagen elegido por el usuario.
 * Crea una URL temporal (blob:) para el archivo y la libera cuando cambia o se desmonta.
 */
function VistaPrevia({ archivo }: { archivo: Blob }) {
  const imagen = useRef<HTMLImageElement>(null)
  useEffect(() => {
    const url = URL.createObjectURL(archivo)
    if (imagen.current) imagen.current.src = url
    return () => URL.revokeObjectURL(url)
  }, [archivo])
  return <img ref={imagen} className={estilos.fotoVista} alt="Vista previa de la foto" />
}

interface Props {
  foto: File | null
  alCambiar: (foto: File) => void
  error?: string
}

export function SelectorFoto({ foto, alCambiar, error }: Props) {
  const [procesando, setProcesando] = useState(false)
  const [errorArchivo, setErrorArchivo] = useState<string | null>(null)
  const inputCamara = useRef<HTMLInputElement>(null)
  const inputArchivo = useRef<HTMLInputElement>(null)

  async function procesar(archivo: File | undefined) {
    if (!archivo) return
    setProcesando(true)
    setErrorArchivo(null)
    try {
      alCambiar(await prepararFoto(archivo))
    } catch (e) {
      // Si falla, se conserva la foto anterior (si había) y se explica qué pasó.
      setErrorArchivo(e instanceof ErrorFoto ? e.message : 'No pudimos leer esa foto. Intenta con otra.')
    } finally {
      setProcesando(false)
    }
  }

  function alElegir(evento: ChangeEvent<HTMLInputElement>) {
    const archivo = evento.target.files?.[0]
    evento.target.value = '' // permite volver a elegir el mismo archivo
    void procesar(archivo)
  }

  function alSoltar(evento: DragEvent) {
    evento.preventDefault()
    void procesar(evento.dataTransfer.files[0])
  }

  const mensaje = errorArchivo ?? error

  return (
    <div className={estilos.foto}>
      <input ref={inputCamara} type="file" accept="image/*" capture="environment" hidden onChange={alElegir} />
      <input ref={inputArchivo} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={alElegir} />

      <div
        className={clases(
          estilos.fotoMarco,
          foto ? 'border-solid' : 'border-dashed',
          mensaje ? 'border-error' : foto ? 'border-transparent' : 'border-borde-fuerte',
        )}
        onDragOver={(e) => e.preventDefault()}
        onDrop={alSoltar}
      >
        {foto ? (
          <VistaPrevia archivo={foto} />
        ) : (
          <div className={estilos.fotoVacia}>
            <Camera size={36} aria-hidden="true" />
            <p>Tómale una foto o sube una que ya tengas</p>
            <span>JPG, PNG o WEBP</span>
          </div>
        )}
        {procesando && (
          <div className={estilos.fotoProcesando} role="status">
            <LoaderCircle className="animate-spin" size={28} aria-hidden="true" />
            Preparando foto…
          </div>
        )}
      </div>

      <div className={estilos.fotoBotones}>
        <button
          type="button"
          className="boton boton--primario"
          onClick={() => inputCamara.current?.click()}
          disabled={procesando}
        >
          {foto ? <RefreshCw size={18} aria-hidden="true" /> : <Camera size={18} aria-hidden="true" />}
          {foto ? 'Tomar otra' : 'Tomar foto'}
        </button>
        <button
          type="button"
          className="boton boton--secundario"
          onClick={() => inputArchivo.current?.click()}
          disabled={procesando}
        >
          <ImagePlus size={18} aria-hidden="true" />
          {foto ? 'Cambiar' : 'Subir imagen'}
        </button>
      </div>

      {mensaje && (
        <p className={estilos.error} role="alert">
          {mensaje}
        </p>
      )}
    </div>
  )
}
