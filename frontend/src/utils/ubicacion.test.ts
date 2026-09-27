// Pruebas de obtención de la ubicación actual (npm test).
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ErrorUbicacion, obtenerUbicacionActual } from './ubicacion'

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('obtenerUbicacionActual', () => {
  it('falla si la página no es un contexto seguro (http)', async () => {
    vi.stubGlobal('window', { isSecureContext: false })

    await expect(obtenerUbicacionActual()).rejects.toThrow(/https/)
  })

  it('falla si el navegador no soporta geolocalización', async () => {
    vi.stubGlobal('window', { isSecureContext: true })
    vi.stubGlobal('navigator', {})

    await expect(obtenerUbicacionActual()).rejects.toBeInstanceOf(ErrorUbicacion)
  })

  it('resuelve con latitud, longitud y precisión', async () => {
    vi.stubGlobal('window', { isSecureContext: true })
    vi.stubGlobal('navigator', {
      geolocation: {
        getCurrentPosition: (exito: (posicion: unknown) => void) =>
          exito({ coords: { latitude: 25.1, longitude: -100.2, accuracy: 12 } }),
      },
    })

    await expect(obtenerUbicacionActual()).resolves.toEqual({
      latitud: 25.1,
      longitud: -100.2,
      precision: 12,
    })
  })

  it('traduce el error de permiso denegado', async () => {
    vi.stubGlobal('window', { isSecureContext: true })
    vi.stubGlobal('navigator', {
      geolocation: {
        getCurrentPosition: (_exito: unknown, error: (e: unknown) => void) => error({ code: 1 }),
      },
    })

    await expect(obtenerUbicacionActual()).rejects.toThrow(/permiso/)
  })
})
