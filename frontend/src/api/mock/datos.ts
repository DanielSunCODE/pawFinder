// Datos de prueba para trabajar sin backend.
// OJO: el catálogo real (razas, colores) y los 15 perritos de prueba los define el DBA en la base.
// Estos sólo imitan esa forma para que el frontend se pueda desarrollar y probar por su cuenta.
import { config } from '../../config'
import type { Color, Perrito, Raza } from '../tipos'
import { ilustracionPerrito } from './ilustracion'

export const RAZAS: Raza[] = [
  { id: 1, nombre: 'Sin raza definida / criollo' },
  { id: 2, nombre: 'Labrador' },
  { id: 3, nombre: 'Pastor alemán' },
  { id: 4, nombre: 'Chihuahua' },
  { id: 5, nombre: 'Schnauzer' },
  { id: 6, nombre: 'Pitbull' },
  { id: 7, nombre: 'Husky siberiano' },
  { id: 8, nombre: 'Poodle' },
  { id: 9, nombre: 'Beagle' },
  { id: 10, nombre: 'Dálmata' },
  { id: 11, nombre: 'Xoloitzcuintle' },
  { id: 12, nombre: 'Golden retriever' },
  { id: 13, nombre: 'Boxer' },
  { id: 14, nombre: 'Salchicha' },
]

export const COLORES: Color[] = [
  { id: 1, nombre: 'Negro', hex: '#1F1B18' },
  { id: 2, nombre: 'Blanco', hex: '#F7F4EE' },
  { id: 3, nombre: 'Café', hex: '#7B4A2A' },
  { id: 4, nombre: 'Canela', hex: '#C98A4B' },
  { id: 5, nombre: 'Dorado', hex: '#E0B354' },
  { id: 6, nombre: 'Gris', hex: '#8E8C88' },
  { id: 7, nombre: 'Crema', hex: '#EAD9B8' },
  { id: 8, nombre: 'Rojizo', hex: '#A8452B' },
  { id: 9, nombre: 'Chocolate', hex: '#4E2E1E' },
  { id: 10, nombre: 'Atigrado', hex: '#6B4B34' },
  { id: 11, nombre: 'Gris azulado', hex: '#6C7A89' },
]

interface Semilla {
  nombre: string
  razaId: number | null
  principal: number
  adicionales: number[]
  /** Desplazamiento desde el centro del mapa, en grados. */
  dLat: number
  dLng: number
  haceHoras: number
  orejasParadas: boolean
}

const SEMILLAS: Semilla[] = [
  { nombre: 'Firulais', razaId: 1, principal: 4, adicionales: [2], dLat: 0.004, dLng: -0.006, haceHoras: 2, orejasParadas: false },
  { nombre: 'Canela', razaId: 1, principal: 4, adicionales: [], dLat: -0.008, dLng: 0.011, haceHoras: 5, orejasParadas: true },
  { nombre: 'Chispa', razaId: 4, principal: 5, adicionales: [2], dLat: 0.013, dLng: 0.004, haceHoras: 9, orejasParadas: true },
  { nombre: 'Manchas', razaId: 10, principal: 2, adicionales: [1], dLat: -0.002, dLng: -0.015, haceHoras: 20, orejasParadas: false },
  { nombre: 'Negrita', razaId: null, principal: 1, adicionales: [3], dLat: 0.019, dLng: -0.012, haceHoras: 26, orejasParadas: false },
  { nombre: 'Rocky', razaId: 6, principal: 6, adicionales: [2], dLat: -0.015, dLng: -0.004, haceHoras: 31, orejasParadas: false },
  { nombre: 'Lola', razaId: 8, principal: 7, adicionales: [], dLat: 0.007, dLng: 0.019, haceHoras: 44, orejasParadas: false },
  { nombre: 'Bolillo', razaId: 1, principal: 7, adicionales: [4, 2], dLat: -0.021, dLng: 0.016, haceHoras: 52, orejasParadas: true },
  { nombre: 'Tamal', razaId: 14, principal: 3, adicionales: [], dLat: 0.024, dLng: 0.009, haceHoras: 70, orejasParadas: false },
  { nombre: 'Princesa', razaId: 7, principal: 11, adicionales: [2], dLat: -0.011, dLng: -0.021, haceHoras: 96, orejasParadas: true },
  { nombre: 'Solovino', razaId: 1, principal: 10, adicionales: [1], dLat: 0.002, dLng: 0.027, haceHoras: 120, orejasParadas: true },
  { nombre: 'Güero', razaId: 12, principal: 5, adicionales: [], dLat: -0.026, dLng: -0.009, haceHoras: 150, orejasParadas: false },
  { nombre: 'Luna', razaId: 11, principal: 1, adicionales: [], dLat: 0.016, dLng: -0.025, haceHoras: 200, orejasParadas: true },
  { nombre: 'Chato', razaId: 13, principal: 8, adicionales: [2], dLat: -0.005, dLng: 0.003, haceHoras: 260, orejasParadas: false },
  { nombre: 'Pulgas', razaId: null, principal: 9, adicionales: [4], dLat: 0.029, dLng: -0.003, haceHoras: 330, orejasParadas: true },
]

function buscarColor(id: number): Color {
  const color = COLORES.find((c) => c.id === id)
  if (!color) throw new Error(`Color de prueba inexistente: ${id}`)
  return color
}

export function crearPerritosDePrueba(): Perrito[] {
  const [latCentro, lngCentro] = config.mapa.centro
  const ahora = Date.now()

  return SEMILLAS.map((semilla, indice) => {
    const colorPrincipal = buscarColor(semilla.principal)
    const coloresAdicionales = semilla.adicionales.map(buscarColor)
    const foto = ilustracionPerrito({
      indice,
      principal: colorPrincipal.hex ?? '#999999',
      secundario: coloresAdicionales[0]?.hex ?? null,
      orejasParadas: semilla.orejasParadas,
    })
    return {
      id: indice + 1,
      nombre: semilla.nombre,
      fotoUrl: foto,
      miniaturaUrl: foto,
      raza: RAZAS.find((r) => r.id === semilla.razaId) ?? null,
      colorPrincipal,
      coloresAdicionales,
      latitud: latCentro + semilla.dLat,
      longitud: lngCentro + semilla.dLng,
      fechaRegistro: new Date(ahora - semilla.haceHoras * 3_600_000).toISOString(),
    }
  })
}
