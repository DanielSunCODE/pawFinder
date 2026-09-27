// Pruebas de reintentos ante fallos de red (npm test).
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ErrorApi, SIN_CONEXION } from '../api/errores'
import { conReintentos } from './reintentos'

afterEach(() => {
  vi.useRealTimers()
})

describe('conReintentos', () => {
  it('devuelve el resultado sin reintentar si la primera vez funciona', async () => {
    const operacion = vi.fn().mockResolvedValue('ok')

    await expect(conReintentos(operacion)).resolves.toBe('ok')
    expect(operacion).toHaveBeenCalledTimes(1)
  })

  it('reintenta un error de red y termina bien', async () => {
    vi.useFakeTimers()
    const operacion = vi
      .fn()
      .mockRejectedValueOnce(new ErrorApi('sin conexión', SIN_CONEXION))
      .mockResolvedValueOnce('ok')

    const promesa = conReintentos(operacion, { intentos: 3 })
    await vi.advanceTimersByTimeAsync(1000)

    await expect(promesa).resolves.toBe('ok')
    expect(operacion).toHaveBeenCalledTimes(2)
  })

  it('no reintenta un error no reintentable (400)', async () => {
    const operacion = vi.fn().mockRejectedValue(new ErrorApi('datos inválidos', 400))

    await expect(conReintentos(operacion, { intentos: 3 })).rejects.toBeInstanceOf(ErrorApi)
    expect(operacion).toHaveBeenCalledTimes(1)
  })

  it('se rinde tras agotar los intentos', async () => {
    vi.useFakeTimers()
    const operacion = vi.fn().mockRejectedValue(new ErrorApi('servidor saturado', 503))

    const promesa = conReintentos(operacion, { intentos: 2 })
    promesa.catch(() => {}) // evita el unhandled rejection mientras avanzan los timers
    await vi.advanceTimersByTimeAsync(1000)

    await expect(promesa).rejects.toBeInstanceOf(ErrorApi)
    expect(operacion).toHaveBeenCalledTimes(2)
  })

  it('avisa el número de intento al reintentar', async () => {
    vi.useFakeTimers()
    const avisos: number[] = []
    const operacion = vi
      .fn()
      .mockRejectedValueOnce(new ErrorApi('sin conexión', SIN_CONEXION))
      .mockResolvedValue('ok')

    const promesa = conReintentos(operacion, { intentos: 3, alReintentar: (intento) => avisos.push(intento) })
    await vi.advanceTimersByTimeAsync(1000)
    await promesa

    expect(avisos).toEqual([2])
  })
})
