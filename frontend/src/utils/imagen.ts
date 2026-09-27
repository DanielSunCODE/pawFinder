// Preparación de la foto antes de subirla.
// 1) Revisa que el archivo REALMENTE sea JPG, PNG o WEBP (mirando sus primeros bytes, no la extensión).
// 2) Si es muy pesada, la reduce y la recomprime como JPG. Una foto de celular pesa 3–10 MB;
//    reducida pesa ~300 KB y sube mucho más rápido con mala señal.

type TipoImagen = 'image/jpeg' | 'image/png' | 'image/webp'

const LADO_MAXIMO_PX = 1600
const CALIDAD_JPG = 0.85
const PESO_SIN_COMPRIMIR = 1.5 * 1024 * 1024 // debajo de esto se sube tal cual
const PESO_MAXIMO = 10 * 1024 * 1024

export class ErrorFoto extends Error {}

/** Lee la "firma" del archivo (magic numbers) para saber qué tipo de imagen es de verdad. */
export async function detectarTipoImagen(archivo: Blob): Promise<TipoImagen | null> {
  const bytes = new Uint8Array(await archivo.slice(0, 12).arrayBuffer())
  const texto = (inicio: number, fin: number) => String.fromCharCode(...bytes.slice(inicio, fin))

  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'image/jpeg'
  if (bytes[0] === 0x89 && texto(1, 4) === 'PNG') return 'image/png'
  if (texto(0, 4) === 'RIFF' && texto(8, 12) === 'WEBP') return 'image/webp'
  return null
}

async function reducir(archivo: Blob): Promise<File> {
  const imagen = await createImageBitmap(archivo, { imageOrientation: 'from-image' })
  const escala = Math.min(1, LADO_MAXIMO_PX / Math.max(imagen.width, imagen.height))
  const ancho = Math.round(imagen.width * escala)
  const alto = Math.round(imagen.height * escala)

  const lienzo = document.createElement('canvas')
  lienzo.width = ancho
  lienzo.height = alto
  const contexto = lienzo.getContext('2d')
  if (!contexto) throw new Error('Canvas no disponible')
  contexto.fillStyle = '#FFFFFF' // por si el PNG tiene transparencia
  contexto.fillRect(0, 0, ancho, alto)
  contexto.drawImage(imagen, 0, 0, ancho, alto)
  imagen.close()

  const blob = await new Promise<Blob | null>((resolver) => lienzo.toBlob(resolver, 'image/jpeg', CALIDAD_JPG))
  if (!blob) throw new Error('No se pudo comprimir')
  return new File([blob], 'foto.jpg', { type: 'image/jpeg' })
}

/** Devuelve la foto lista para subir, o lanza ErrorFoto con un mensaje para el usuario. */
export async function prepararFoto(archivo: File): Promise<File> {
  const tipo = await detectarTipoImagen(archivo)
  if (!tipo) throw new ErrorFoto('Ese archivo no es una foto JPG, PNG o WEBP. Elige otra.')

  // Normalizamos el tipo con el que detectamos (algunos celulares mandan type vacío).
  const original = new File([archivo], archivo.name || `foto.${tipo.split('/')[1]}`, { type: tipo })
  if (original.size <= PESO_SIN_COMPRIMIR) return original

  try {
    return await reducir(original)
  } catch {
    // Si el navegador no pudo reducirla, la subimos original siempre que no sea enorme.
    if (original.size <= PESO_MAXIMO) return original
    throw new ErrorFoto('La foto pesa demasiado. Intenta con otra o vuelve a tomarla.')
  }
}
