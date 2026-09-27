// Pruebas de la fecha de registro (npm test).
import { describe, expect, it } from 'vitest'
import { ahoraIsoConOffset } from './fecha'

describe('ahoraIsoConOffset', () => {
  it('devuelve ISO 8601 con offset', () => {
    const iso = ahoraIsoConOffset(new Date('2026-09-26T23:20:00Z'))
    expect(iso).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[+-]\d{2}:\d{2}$/)
  })

  it('conserva el mismo instante (el offset representa la zona del dispositivo)', () => {
    const fecha = new Date('2026-09-26T23:20:00Z')
    expect(new Date(ahoraIsoConOffset(fecha)).getTime()).toBe(fecha.getTime())
  })
})
