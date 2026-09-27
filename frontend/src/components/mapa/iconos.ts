// Íconos de los pines del mapa. Leaflet los recibe como HTML en texto,
// por eso se escapan los valores que vienen de la API (evita inyectar HTML).
import L from 'leaflet'
import type { Perrito } from '../../api'
import { colorCss } from '../../utils/transformaciones'

const escapar = (texto: string) =>
  texto.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

/** Pin redondo con la miniatura del perrito y el borde de su color principal. */
export function iconoPerrito(perrito: Perrito): L.DivIcon {
  const color = colorCss(perrito.colorPrincipal.hex)
  return L.divIcon({
    className: 'pin-perrito',
    html: `<span class="pin-perrito__marco" style="--color-pin:${color}"><img src="${escapar(perrito.miniaturaUrl)}" alt="" /></span>`,
    iconSize: [46, 56],
    iconAnchor: [23, 56],
    popupAnchor: [0, -52],
  })
}

/** Pin clásico (gota) para marcar un punto: formulario y detalle. */
export const iconoUbicacion = L.divIcon({
  className: 'pin-ubicacion',
  html: '<span class="pin-ubicacion__gota"></span>',
  iconSize: [40, 48],
  iconAnchor: [20, 46],
})
