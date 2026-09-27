import { OpenAPIRegistry, OpenApiGeneratorV31 } from '@asteasolutions/zod-to-openapi';
import { errorResponseSchema, healthResponseSchema } from './schemas.js';

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
