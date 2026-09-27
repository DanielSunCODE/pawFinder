// Pruebas de la clave de idempotencia (npm test).
import { describe, expect, it } from 'vitest'
import { generarClaveIdempotencia } from './idempotencia'

describe('generarClaveIdempotencia', () => {
  it('genera un UUID v4 válido', () => {
    expect(generarClaveIdempotencia()).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    )
  })

  it('genera claves distintas en cada llamada', () => {
    expect(generarClaveIdempotencia()).not.toBe(generarClaveIdempotencia())
  })
})
