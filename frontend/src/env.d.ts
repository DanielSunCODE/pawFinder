// Tipos de las variables de entorno que usa la app (ver .env.example).
interface ImportMetaEnv {
  readonly VITE_API_URL?: string
  readonly VITE_MAPA_CENTRO?: string
  readonly VITE_MAPA_ZOOM?: string
  readonly VITE_MAPA_MOSAICOS_URL?: string
  readonly VITE_MAPA_MOSAICOS_CREDITOS?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
