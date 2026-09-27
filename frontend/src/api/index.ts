// Punto único de acceso a la API para toda la app.
// Las pantallas importan `api` de aquí y no saben si detrás está el backend real o los datos de prueba.
import { config } from '../config'
import { crearApiHttp } from './http'
import { crearApiMock } from './mock'
import type { ApiPerritos } from './tipos'

export const api: ApiPerritos = config.usarMocks ? crearApiMock() : crearApiHttp(config.apiUrl)

export * from './tipos'
export { ErrorApi, mensajeDeError } from './errores'
