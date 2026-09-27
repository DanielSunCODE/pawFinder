// Mensajes de estado reutilizables: cargando, error y "no hay nada".
import { CircleAlert, LoaderCircle, RefreshCw } from 'lucide-react'
import type { ReactNode } from 'react'

const contenedor = 'mx-auto flex max-w-105 flex-col items-center gap-3 px-5 py-10 text-center'

export function Cargando({ texto = 'Cargando…' }: { texto?: string }) {
  return (
    <div className={`${contenedor} text-texto-suave`} role="status">
      <LoaderCircle className="animate-spin" size={32} aria-hidden="true" />
      <p className="font-semibold">{texto}</p>
    </div>
  )
}

export function MensajeError({ mensaje, alReintentar }: { mensaje: string; alReintentar?: () => void }) {
  return (
    <div className={`${contenedor} text-error`} role="alert">
      <CircleAlert size={32} aria-hidden="true" />
      <p className="font-semibold text-texto">{mensaje}</p>
      {alReintentar && (
        <button type="button" className="boton boton--secundario boton--chico" onClick={alReintentar}>
          <RefreshCw size={16} aria-hidden="true" /> Reintentar
        </button>
      )}
    </div>
  )
}

export function Vacio({ icono, titulo, children }: { icono: ReactNode; titulo: string; children?: ReactNode }) {
  return (
    <div className={`${contenedor} text-texto-suave`}>
      <span className="grid size-18 place-items-center rounded-3xl bg-primario-suave text-primario">{icono}</span>
      <h2 className="text-xl text-texto">{titulo}</h2>
      {children}
    </div>
  )
}
