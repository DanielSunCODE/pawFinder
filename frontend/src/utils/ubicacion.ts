// Obtener la ubicación actual del dispositivo con mensajes de error entendibles.
// Recordatorio: el navegador sólo da la ubicación en https o en localhost.
import type { Ubicacion } from './validacion'

export interface UbicacionActual extends Ubicacion {
  /** Radio de error aproximado, en metros. */
  precision: number
}

export class ErrorUbicacion extends Error {}

const MENSAJES: Record<number, string> = {
  1: 'No diste permiso para usar tu ubicación. Actívalo en el navegador o marca el punto a mano en el mapa.',
  2: 'No pudimos saber dónde estás. Marca el punto a mano en el mapa.',
  3: 'Tardó demasiado en encontrar tu ubicación. Inténtalo otra vez o marca el punto a mano.',
}

export function obtenerUbicacionActual(): Promise<UbicacionActual> {
  if (!window.isSecureContext) {
    return Promise.reject(
      new ErrorUbicacion('La ubicación sólo funciona si la página se abre con https (o en localhost).'),
    )
  }
  if (!('geolocation' in navigator)) {
    return Promise.reject(new ErrorUbicacion('Este navegador no permite obtener la ubicación.'))
  }
  return new Promise((resolver, rechazar) => {
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => resolver({ latitud: coords.latitude, longitud: coords.longitude, precision: coords.accuracy }),
      (error) => rechazar(new ErrorUbicacion(MENSAJES[error.code] ?? MENSAJES[2])),
      { enableHighAccuracy: true, timeout: 15_000, maximumAge: 30_000 },
    )
  })
}
