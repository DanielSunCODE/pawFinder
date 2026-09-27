// Pruebas de las transformaciones funcionales (npm test).
import { describe, expect, it } from 'vitest'
import type { Perrito } from '../api'
import { colorCss, coloresDe, conHex, coordenadasDe, esSolido, normalizar } from './transformaciones'

const perrito: Perrito = {
  id: 1,
  nombre: 'Luna',
  fotoUrl: '/api/perritos/1/foto',
  miniaturaUrl: '/api/perritos/1/foto',
  raza: { id: 2, nombre: 'Husky Siberiano' },
  colorPrincipal: { id: 1, nombre: 'Negro', hex: '#23201E' },
  coloresAdicionales: [{ id: 2, nombre: 'Blanco', hex: '#FAFAF7' }],
  sexo: 'hembra',
  etapaVida: 'adulto',
  tamano: 'mediano',
  longitudPelaje: 'corto',
  patronPelaje: { id: 4, nombre: 'Bicolor' },
  colorOjos: { id: 3, nombre: 'Azul', hex: null },
  marcasDistintivas: null,
  latitud: 25.1,
  longitud: -100.2,
  fechaRegistro: '2026-09-26T18:40:00.000Z',
}

describe('colorCss', () => {
  it('acepta un hex válido', () => {
    expect(colorCss('#A1B2C3')).toBe('#A1B2C3')
  })

  it('usa el color de respaldo si el hex es null o inválido', () => {
    expect(colorCss(null)).toBe('#A39A92')
    expect(colorCss('azul')).toBe('#A39A92')
    expect(colorCss('#12345')).toBe('#A39A92')
  })
})

describe('normalizar', () => {
  it('quita acentos, espacios y mayúsculas', () => {
    expect(normalizar('  Sólido ')).toBe('solido')
    expect(normalizar('Café')).toBe('cafe')
  })
})

describe('conHex', () => {
  it('completa el tono por nombre cuando el backend no lo manda', () => {
    expect(conHex({ id: 3, nombre: 'Azul' }).hex).toBe('#6FA8DC')
  })

  it('respeta el hex que ya viene', () => {
    expect(conHex({ id: 3, nombre: 'Azul', hex: '#0000FF' }).hex).toBe('#0000FF')
  })

  it('deja null si el nombre no tiene tono conocido', () => {
    expect(conHex({ id: 9, nombre: 'Inventado' }).hex).toBeNull()
  })
})

describe('esSolido', () => {
  it('reconoce el patrón "Sólido" sin acentos ni mayúsculas', () => {
    expect(esSolido({ id: 1, nombre: 'Sólido' })).toBe(true)
    expect(esSolido({ id: 2, nombre: 'Bicolor' })).toBe(false)
    expect(esSolido(null)).toBe(false)
  })
})

describe('coloresDe', () => {
  it('devuelve el principal primero, luego los adicionales', () => {
    expect(coloresDe(perrito).map((color) => color.nombre)).toEqual(['Negro', 'Blanco'])
  })
})

describe('coordenadasDe', () => {
  it('arma la lista [lat, lng]', () => {
    expect(coordenadasDe([perrito])).toEqual([[25.1, -100.2]])
  })
})
