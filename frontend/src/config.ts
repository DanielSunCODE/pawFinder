// Configuración de la aplicación.
// Los valores salen de variables de entorno (archivo .env.local, ver .env.example).
// Vite sólo deja ver en el navegador las variables que empiezan con VITE_.

type Coordenadas = [latitud: number, longitud: number]

const CENTRO_POR_DEFECTO: Coordenadas = [19.4326, -99.1332] // Zócalo, CDMX

function leerCentro(valor: string | undefined): Coordenadas {
  if (!valor) return CENTRO_POR_DEFECTO
  const [latitud, longitud] = valor.split(',').map(Number)
  const valido = Number.isFinite(latitud) && Number.isFinite(longitud)
  return valido ? [latitud, longitud] : CENTRO_POR_DEFECTO
}

const MOSAICOS_PERSONALIZADOS = import.meta.env.VITE_MAPA_MOSAICOS_URL

export const config = {
  /** Nombre que se muestra en el encabezado y en la pestaña del navegador. */
  nombreApp: 'PawFinder',

  /** URL base de la API. En desarrollo se deja en /api y el proxy de Vite la reenvía al backend. */
  apiUrl: import.meta.env.VITE_API_URL || '/api',

  /** Si es true, la app usa datos de prueba en memoria y no necesita backend. */
  usarMocks: import.meta.env.VITE_USAR_MOCKS === 'true',

  mapa: {
    centro: leerCentro(import.meta.env.VITE_MAPA_CENTRO),
    zoom: Number(import.meta.env.VITE_MAPA_ZOOM) || 13,
    // Imágenes del mapa ("mosaicos"). Ninguno de los dos pide llave de API.
    // Principal: servidores de OpenStreetMap. Respaldo: estilo humanitario de OpenStreetMap Francia,
    // que se usa solo si el principal no carga. Si se define VITE_MAPA_MOSAICOS_URL (por ejemplo, un
    // proveedor con llave), se usa ese y no hay respaldo.
    principal: {
      url: MOSAICOS_PERSONALIZADOS || 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
      creditos:
        import.meta.env.VITE_MAPA_MOSAICOS_CREDITOS ||
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    },
    respaldo: MOSAICOS_PERSONALIZADOS
      ? null
      : {
          url: 'https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',
          creditos:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>, estilo <a href="https://www.hotosm.org/">HOT</a> en <a href="https://openstreetmap.fr/">OSM France</a>',
        },
  },
} as const
