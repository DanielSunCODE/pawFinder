// Devuelve el valor sólo cuando deja de cambiar por `ms` milisegundos (debounce).
// Sirve para no llamar a la API en cada letra que se escribe en el buscador.
import { useEffect, useState } from 'react'

export function useValorRetrasado<T>(valor: T, ms = 350): T {
  const [retrasado, setRetrasado] = useState(valor)
  useEffect(() => {
    const temporizador = setTimeout(() => setRetrasado(valor), ms)
    return () => clearTimeout(temporizador)
  }, [valor, ms])
  return retrasado
}
