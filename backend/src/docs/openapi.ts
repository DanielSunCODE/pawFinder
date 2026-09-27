import { OpenAPIRegistry, OpenApiGeneratorV31 } from '@asteasolutions/zod-to-openapi';
import {
  errorResponseSchema,
  healthResponseSchema,
  perritoIdParamSchema,
} from './schemas.js';

/**
 * Construye el documento OpenAPI 3.1 a partir de los esquemas Zod.
 *
 * Para documentar un endpoint nuevo:
 *   1. Define o reutiliza su esquema Zod (preferentemente en `./schemas.ts`).
 *   2. Regístralo con `registry.register('Nombre', esquema)`.
 *   3. Agrega su ruta con `registry.registerPath({ method, path, responses })`
 *      reutilizando los esquemas registrados de éxito y error.
 * No escribas la especificación a mano: siempre nace de Zod.
 */
export function createOpenApiDocument(serverUrl: string) {
  const registry = new OpenAPIRegistry();

  const successSchema = registry.register('HealthResponse', healthResponseSchema);
  const errorSchema = registry.register('ErrorResponse', errorResponseSchema);
  const idParamSchema = registry.register('PerritoIdParam', perritoIdParamSchema);

  registry.registerPath({
    method: 'get',
    path: '/api/health',
    tags: ['Salud'],
    summary: 'Estado del servicio',
    description: 'Confirma que el backend está operativo.',
    responses: {
      200: {
        description: 'El servicio está activo.',
        content: { 'application/json': { schema: successSchema } },
      },
      500: {
        description: 'Error inesperado.',
        content: { 'application/json': { schema: errorSchema } },
      },
    },
  });

  registry.registerPath({
    method: 'get',
    path: '/api/perritos/{id}/foto',
    tags: ['Perritos'],
    summary: 'Foto de un perrito',
    description:
      'Devuelve la imagen del perrito. El backend resuelve la ubicación y la lee por el storage activo; el cliente nunca ve la carpeta ni el bucket.',
    request: { params: idParamSchema },
    responses: {
      200: {
        description: 'Imagen del perrito.',
        content: {
          'image/jpeg': { schema: { type: 'string', format: 'binary' } },
          'image/png': { schema: { type: 'string', format: 'binary' } },
          'image/webp': { schema: { type: 'string', format: 'binary' } },
        },
      },
      400: {
        description: 'Identificador inválido.',
        content: { 'application/json': { schema: errorSchema } },
      },
      404: {
        description: 'Perrito o foto no encontrados.',
        content: { 'application/json': { schema: errorSchema } },
      },
    },
  });

  const generator = new OpenApiGeneratorV31(registry.definitions);

  return generator.generateDocument({
    openapi: '3.1.0',
    info: {
      title: 'PawFinder API',
      version: '0.1.0',
      description: 'API REST del registro de perritos de la calle.',
    },
    servers: [{ url: serverUrl }],
  });
}
