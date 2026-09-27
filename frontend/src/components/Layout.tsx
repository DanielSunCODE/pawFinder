// Estructura común de todas las pantallas: encabezado, contenido y navegación inferior (celular).
import { List, Map as IconoMapa, PawPrint, Plus } from 'lucide-react'
import { useEffect } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router'
import { config } from '../config'
import { clases } from '../utils/clases'

/** Enlaces del menú de escritorio: el activo se resalta. */
const claseEnlaceEscritorio = ({ isActive }: { isActive: boolean }) =>
  clases(
    'rounded-full px-3.5 py-2 font-bold no-underline',
    isActive ? 'bg-primario-suave text-primario' : 'text-texto-suave hover:bg-superficie-2 hover:text-texto',
  )

/** Enlaces de la navegación inferior (celular). */
const claseEnlaceMovil = ({ isActive }: { isActive: boolean }) =>
  clases(
    'flex h-(--alto-navegacion) flex-col items-center justify-center gap-0.5 text-xs font-bold no-underline',
    isActive ? 'text-primario' : 'text-texto-suave',
  )

export function Layout() {
  const { pathname } = useLocation()
  const esMapa = pathname === '/'
  const esFormulario = pathname === '/registrar'

  // Al cambiar de pantalla, empezar desde arriba.
  useEffect(() => window.scrollTo(0, 0), [pathname])

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-1000 h-(--alto-encabezado) border-b border-borde bg-fondo/92 backdrop-blur-md">
        <div className="mx-auto flex h-full max-w-280 items-center gap-3 px-4">
          <Link to="/" className="inline-flex items-center gap-2.5 text-lg font-extrabold tracking-tight text-texto no-underline">
            <span className="grid size-9 -rotate-8 place-items-center rounded-xl bg-primario text-white" aria-hidden="true">
              <PawPrint size={20} strokeWidth={2.4} />
            </span>
            {config.nombreApp}
          </Link>

          <nav className="ml-auto hidden items-center gap-1 md:flex" aria-label="Principal">
            <NavLink to="/" end className={claseEnlaceEscritorio}>
              Mapa
            </NavLink>
            <NavLink to="/perritos" className={claseEnlaceEscritorio}>
              Lista
            </NavLink>
            <Link to="/registrar" className="boton boton--primario boton--chico ml-2">
              <Plus size={18} aria-hidden="true" /> Registrar perrito
            </Link>
          </nav>
        </div>
      </header>

      <main
        className={
          esMapa
            ? 'alto-mapa relative'
            : clases('mx-auto max-w-280 px-4 pt-5 md:px-6 md:pt-8 md:pb-12', esFormulario ? 'pb-0' : 'pb-nav')
        }
      >
        <Outlet />
      </main>

      {!esFormulario && (
        <nav
          className="alto-nav-movil fixed inset-x-0 bottom-0 z-1000 grid grid-cols-[1fr_auto_1fr] items-end border-t border-borde bg-superficie px-6 pb-(--abajo-seguro) shadow-[0_-4px_20px_rgb(42_33_27/0.06)] md:hidden"
          aria-label="Principal"
        >
          <NavLink to="/" end className={claseEnlaceMovil}>
            <IconoMapa size={22} aria-hidden="true" />
            <span>Mapa</span>
          </NavLink>
          <NavLink
            to="/registrar"
            className="flex h-(--alto-navegacion) flex-col items-center justify-end px-3 pb-2 text-xs font-bold text-texto no-underline"
          >
            <span
              className="-mb-3 grid size-14.5 -translate-y-3.5 place-items-center rounded-full border-4 border-superficie bg-primario text-white shadow-[0_6px_18px_rgb(185_78_28/0.4)]"
              aria-hidden="true"
            >
              <Plus size={28} strokeWidth={2.6} />
            </span>
            <span>Registrar</span>
          </NavLink>
          <NavLink to="/perritos" className={claseEnlaceMovil}>
            <List size={22} aria-hidden="true" />
            <span>Lista</span>
          </NavLink>
        </nav>
      )}
    </div>
  )
}
