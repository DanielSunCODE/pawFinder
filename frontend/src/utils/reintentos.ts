// Reintenta una operación cuando falla por la red (como un celular con mala señal).
// Es seguro reintentar el registro SÓLO porque cada intento lleva la misma clave de idempotencia.
import { esErrorReintentable } from '../api/errores'

const esperar = (ms: number) => new Promise((resolver) => setTimeout(resolver, ms))

export async function conReintentos<T>(
  operacion: () => Promise<T>,
  { intentos = 3, alReintentar }: { intentos?: number; alReintentar?: (intento: number, total: number) => void } = {},
): Promise<T> {
  for (let intento = 1; ; intento++) {
    try {
      return await operacion()
    } catch (error) {
      if (intento >= intentos || !esErrorReintentable(error)) throw error
      alReintentar?.(intento + 1, intentos)
      await esperar(1000 * intento) // 1 s, 2 s, …
    }
  }
}
