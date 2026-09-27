// Hook para pedir datos a la API y saber si está cargando, si falló o si ya llegaron.
import { useCallback, useEffect, useState } from 'react'
import { mensajeDeError } from '../api'

export interface EstadoAsync<T> {
  datos: T | undefined
  cargando: boolean
  error: string | null
  reintentar: () => void
}

/**
 * Ejecuta `pedirDatos` al montar el componente y cada vez que cambian las dependencias.
 * Mientras llega la respuesta nueva se conservan los datos anteriores (la lista no "parpadea").
 */
export function useAsync<T>(pedirDatos: () => Promise<T>, dependencias: readonly unknown[]): EstadoAsync<T> {
  const [datos, setDatos] = useState<T>()
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [intento, setIntento] = useState(0)

  useEffect(() => {
    // Si el componente se desmonta o cambian los filtros antes de que llegue la respuesta,
    // ignoramos esa respuesta vieja para no pisar la nueva.
    let vigente = true
    setCargando(true)
    setError(null)
    pedirDatos()
      .then((resultado) => vigente && setDatos(resultado))
      .catch((e: unknown) => vigente && setError(mensajeDeError(e)))
      .finally(() => vigente && setCargando(false))
    return () => {
      vigente = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- las dependencias las decide quien llama
  }, [...dependencias, intento])

  const reintentar = useCallback(() => setIntento((n) => n + 1), [])
  return { datos, cargando, error, reintentar }
}
