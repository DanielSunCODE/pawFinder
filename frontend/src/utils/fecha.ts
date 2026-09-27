// Fecha y hora de registro con la zona horaria del dispositivo del usuario.
// Se manda en ISO 8601 con offset (por ejemplo "2026-09-26T23:20:00-06:00"),
// así el instante queda correcto sin importar la zona del servidor.

const dosDigitos = (numero: number) => String(numero).padStart(2, '0')

/** Devuelve la hora actual del dispositivo como ISO 8601 con su offset local. */
export function ahoraIsoConOffset(fecha = new Date()): string {
  // getTimezoneOffset() da la diferencia en minutos respecto a UTC con signo invertido.
  const minutos = -fecha.getTimezoneOffset()
  const signo = minutos >= 0 ? '+' : '-'
  const absoluto = Math.abs(minutos)
  const offset = `${signo}${dosDigitos(Math.floor(absoluto / 60))}:${dosDigitos(absoluto % 60)}`

  const dia = `${fecha.getFullYear()}-${dosDigitos(fecha.getMonth() + 1)}-${dosDigitos(fecha.getDate())}`
  const hora = `${dosDigitos(fecha.getHours())}:${dosDigitos(fecha.getMinutes())}:${dosDigitos(fecha.getSeconds())}`
  return `${dia}T${hora}${offset}`
}
