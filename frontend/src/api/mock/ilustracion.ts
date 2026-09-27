// Genera una ilustración SVG de un perrito para usarla como "foto" de prueba.
// Sólo se usa en modo de datos de prueba (VITE_USAR_MOCKS=true), nunca con el backend real.

const FONDOS = ['#FDE8D7', '#E3F0E8', '#E4ECF7', '#F6E4EE', '#F3EFD9', '#E8E4F6']
const OSCURO = '#231A14'

interface OpcionesIlustracion {
  indice: number
  principal: string
  secundario: string | null
  orejasParadas: boolean
}

function orejas(color: string, paradas: boolean): string {
  if (paradas) {
    return `
      <path d="M104 190 L122 66 L192 132 Z" fill="${color}" stroke="${color}" stroke-width="18" stroke-linejoin="round"/>
      <path d="M296 190 L278 66 L208 132 Z" fill="${color}" stroke="${color}" stroke-width="18" stroke-linejoin="round"/>`
  }
  return `
    <ellipse cx="108" cy="196" rx="44" ry="88" transform="rotate(18 108 196)" fill="${color}"/>
    <ellipse cx="292" cy="196" rx="44" ry="88" transform="rotate(-18 292 196)" fill="${color}"/>`
}

function ojo(x: number): string {
  return `
    <circle cx="${x}" cy="200" r="15" fill="#FFFFFF"/>
    <circle cx="${x}" cy="201" r="9" fill="${OSCURO}"/>
    <circle cx="${x + 3}" cy="197" r="3.5" fill="#FFFFFF"/>`
}

export function ilustracionPerrito({ indice, principal, secundario, orejasParadas }: OpcionesIlustracion): string {
  const fondo = FONDOS[indice % FONDOS.length]
  const colorOrejas = secundario ?? principal
  const mancha = secundario ? `<ellipse cx="248" cy="194" rx="46" ry="40" fill="${secundario}"/>` : ''
  const lengua = indice % 3 === 0 ? `<path d="M188 283 q12 34 24 0 z" fill="#E86A7A"/>` : ''

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400">
    <rect width="400" height="400" fill="${fondo}"/>
    <circle cx="200" cy="230" r="170" fill="#FFFFFF" fill-opacity="0.45"/>
    ${orejas(colorOrejas, orejasParadas)}
    <ellipse cx="200" cy="218" rx="112" ry="104" fill="${principal}" stroke="#000000" stroke-opacity="0.08" stroke-width="4"/>
    ${mancha}
    <ellipse cx="200" cy="264" rx="62" ry="46" fill="#FFFFFF" fill-opacity="0.55"/>
    ${ojo(158)}
    ${ojo(242)}
    <ellipse cx="200" cy="242" rx="22" ry="15" fill="${OSCURO}"/>
    <ellipse cx="194" cy="237" rx="6" ry="3.5" fill="#FFFFFF" fill-opacity="0.5"/>
    ${lengua}
    <path d="M200 256 v14 M200 270 q-18 16 -34 4 M200 270 q18 16 34 4" stroke="${OSCURO}" stroke-width="5" fill="none" stroke-linecap="round"/>
  </svg>`

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}
