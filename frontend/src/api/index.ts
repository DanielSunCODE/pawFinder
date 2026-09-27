// Punto único de acceso a la API para toda la app.
// Las pantallas importan `api` de aquí; la URL del backend sale de VITE_API_URL (ver config.ts).
import { config } from '../config'
import { crearApiHttp } from './http'
import type { ApiPerritos } from './tipos'

export const api: ApiPerritos = crearApiHttp(config.apiUrl)

export * from './tipos'
export { ErrorApi, mensajeDeError } from './errores'
