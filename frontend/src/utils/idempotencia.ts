// Clave de idempotencia del registro.
//
// Se genera UNA vez, al abrir el formulario, y se manda en el encabezado Idempotency-Key.
// Si el usuario presiona Enviar dos veces o el celular reintenta por mala señal, la clave es
// la misma y el backend devuelve el perrito que ya creó en vez de crear uno nuevo.

/** Genera un UUID v4 (por ejemplo "3b241101-e2bb-4255-8caf-4136c566a962"). */
export function generarClaveIdempotencia(): string {
  // crypto.randomUUID sólo existe en contextos seguros (https o localhost).
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID()

  // Respaldo para http en la red local: mismo formato, armado a mano.
  const bytes = crypto.getRandomValues(new Uint8Array(16))
  bytes[6] = (bytes[6] & 0x0f) | 0x40 // versión 4
  bytes[8] = (bytes[8] & 0x3f) | 0x80 // variante RFC 4122
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}
