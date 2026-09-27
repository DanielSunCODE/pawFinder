// Tarjeta de un perrito en la lista: miniatura, nombre, raza, colores y hace cuánto se registró.
import { Link } from 'react-router'
import type { Perrito } from '../api'
import { tiempoRelativo } from '../utils/formato'
import { coloresDe } from '../utils/transformaciones'
import { PuntosColores } from './Colores'

export function TarjetaPerrito({ perrito }: { perrito: Perrito }) {
  return (
    <Link
      to={`/perritos/${perrito.id}`}
      className="flex flex-col overflow-hidden rounded-tarjeta bg-superficie text-texto no-underline shadow-tarjeta transition-[transform,box-shadow] duration-150 hover:-translate-y-0.5 hover:shadow-flotante"
    >
      <img
        className="aspect-square w-full bg-superficie-2 object-cover"
        src={perrito.miniaturaUrl}
        alt=""
        loading="lazy"
        decoding="async"
      />
      <div className="flex min-w-0 flex-col gap-0.5 px-3 pt-2.5 pb-3">
        <h3 className="truncate text-[1.05rem] font-extrabold">{perrito.nombre}</h3>
        <p className="truncate text-sm text-texto-suave">{perrito.raza?.nombre ?? 'Raza sin especificar'}</p>
        <div className="mt-2 flex items-center justify-between gap-2">
          <PuntosColores colores={coloresDe(perrito)} />
          <time className="truncate text-xs font-semibold text-texto-suave" dateTime={perrito.fechaRegistro}>
            {tiempoRelativo(perrito.fechaRegistro)}
          </time>
        </div>
      </div>
    </Link>
  )
}
