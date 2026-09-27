// Pruebas de formato de fechas y coordenadas (npm test).
import { describe, expect, it } from 'vitest'
import { formatearCoordenadas, formatearFecha, tiempoRelativo } from './formato'

describe('formatearCoordenadas', () => {
  it('usa 5 decimales separados por coma', () => {
    expect(formatearCoordenadas(19.4326, -99.1332)).toBe('19.43260, -99.13320')
  })
})

describe('formatearFecha', () => {
  it('produce una fecha legible con el año', () => {
    expect(formatearFecha('2026-09-26T18:40:00.000Z')).toContain('2026')
  })
})

describe('tiempoRelativo', () => {
  const ahora = Date.parse('2026-09-26T18:42:00.000Z')

  it('describe el pasado cercano', () => {
    expect(tiempoRelativo('2026-09-26T18:40:00.000Z', ahora)).toBe('hace 2 minutos')
  })

  it('usa "ahora" para menos de un minuto', () => {
    expect(tiempoRelativo('2026-09-26T18:41:45.000Z', ahora)).toBe('ahora')
  })

  it('describe el futuro', () => {
    expect(tiempoRelativo('2026-09-29T18:42:00.000Z', ahora)).toContain('3')
  })
})
