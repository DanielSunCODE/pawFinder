import { OpenAPIRegistry, OpenApiGeneratorV31 } from '@asteasolutions/zod-to-openapi';
import { filtrosPerritosSchema } from '../schemas/perrito.js';
import {
  coloresOjosResponseSchema,
  coloresResponseSchema,
  colorSchema,
  conteoColorSchema,
  errorResponseSchema,
  estadisticasResponseSchema,
  healthResponseSchema,
  idempotencyHeaderSchema,
  patronPelajeSchema,
  patronesPelajeResponseSchema,
  perritoIdParamSchema,
  perritoResponseSchema,
  perritoSchema,
  perritosResponseSchema,
  razaSchema,
  razasResponseSchema,
  subidaPerritoSchema,
} from './schemas.js';

const respuestaError = (description: string) => ({
  description,
  content: { 'application/json': { schema: errorResponseSchema } },
});

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

  const saludoOk = registry.register('HealthResponse', healthResponseSchema);
  registry.register('ErrorResponse', errorResponseSchema);
  const idParam = registry.register('PerritoIdParam', perritoIdParamSchema);
  registry.register('Raza', razaSchema);
  registry.register('Color', colorSchema);
  registry.register('Perrito', perritoSchema);
  const perritoResp = registry.register('PerritoResponse', perritoResponseSchema);
  const perritosResp = registry.register('PerritosResponse', perritosResponseSchema);
  const razasResp = registry.register('RazasResponse', razasResponseSchema);
  const coloresResp = registry.register('ColoresResponse', coloresResponseSchema);
  const coloresOjosResp = registry.register('ColoresOjosResponse', coloresOjosResponseSchema);
  registry.register('PatronPelaje', patronPelajeSchema);
  const patronesPelajeResp = registry.register(
    'PatronesPelajeResponse',
    patronesPelajeResponseSchema,
  );
  registry.register('ConteoColor', conteoColorSchema);
  const estadisticasResp = registry.register('EstadisticasResponse', estadisticasResponseSchema);
  const subida = registry.register('SubidaPerrito', subidaPerritoSchema);

  registry.registerPath({
    method: 'get',
    path: '/api/health',
    tags: ['Salud'],
    summary: 'Estado del servicio',
    description: 'Confirma que el backend está operativo.',
    responses: {
      200: {
        description: 'El servicio está activo.',
        content: { 'application/json': { schema: saludoOk } },
      },
      500: respuestaError('Error inesperado.'),
    },
  });

  registry.registerPath({
    method: 'get',
    path: '/api/perritos',
    tags: ['Perritos'],
    summary: 'Listar perritos',
    description:
      'Lista los perritos registrados. El filtrado y el orden se resuelven en SQL, no en el navegador.',
    request: { query: filtrosPerritosSchema },
    responses: {
      200: {
        description: 'Listado de perritos (puede ser vacío).',
        content: { 'application/json': { schema: perritosResp } },
      },
      400: respuestaError('Filtros inválidos.'),
      500: respuestaError('Error inesperado.'),
    },
  });

  registry.registerPath({
    method: 'post',
    path: '/api/perritos',
    tags: ['Perritos'],
    summary: 'Registrar un perrito',
    description:
      'Registra un perrito con su foto. La imagen se valida por contenido (JPG/PNG/WEBP) y se comprime (reescalada y reencodificada) antes de guardarse. Es idempotente: si se repite con la misma Idempotency-Key, devuelve el mismo perrito y no crea otro.',
    request: {
      headers: idempotencyHeaderSchema,
      body: { content: { 'multipart/form-data': { schema: subida } } },
    },
    responses: {
      201: {
        description: 'Perrito registrado (o devuelto por idempotencia).',
        content: { 'application/json': { schema: perritoResp } },
      },
      400: respuestaError('Datos o foto inválidos, o falta la clave de idempotencia.'),
      500: respuestaError('Error inesperado.'),
    },
  });

  registry.registerPath({
    method: 'get',
    path: '/api/perritos/{id}',
    tags: ['Perritos'],
    summary: 'Detalle de un perrito',
    request: { params: idParam },
    responses: {
      200: {
        description: 'Perrito encontrado.',
        content: { 'application/json': { schema: perritoResp } },
      },
      400: respuestaError('Identificador inválido.'),
      404: respuestaError('Perrito no encontrado.'),
      500: respuestaError('Error inesperado.'),
    },
  });

  registry.registerPath({
    method: 'get',
    path: '/api/perritos/{id}/foto',
    tags: ['Perritos'],
    summary: 'Foto de un perrito',
    description:
      'Devuelve la imagen del perrito. El backend resuelve la ubicación y la lee por el storage activo; el cliente nunca ve la carpeta ni el bucket.',
    request: { params: idParam },
    responses: {
      200: {
        description: 'Imagen del perrito.',
        content: {
          'image/jpeg': { schema: { type: 'string', format: 'binary' } },
          'image/png': { schema: { type: 'string', format: 'binary' } },
          'image/webp': { schema: { type: 'string', format: 'binary' } },
        },
      },
      400: respuestaError('Identificador inválido.'),
      404: respuestaError('Perrito o foto no encontrados.'),
    },
  });

  registry.registerPath({
    method: 'get',
    path: '/api/razas',
    tags: ['Catálogos'],
    summary: 'Catálogo de razas',
    description: 'Incluye "Sin raza definida / Criollo".',
    responses: {
      200: {
        description: 'Razas disponibles.',
        content: { 'application/json': { schema: razasResp } },
      },
      500: respuestaError('Error inesperado.'),
    },
  });

  registry.registerPath({
    method: 'get',
    path: '/api/colores',
    tags: ['Catálogos'],
    summary: 'Catálogo de colores',
    responses: {
      200: {
        description: 'Colores disponibles.',
        content: { 'application/json': { schema: coloresResp } },
      },
      500: respuestaError('Error inesperado.'),
    },
  });

  registry.registerPath({
    method: 'get',
    path: '/api/colores-ojos',
    tags: ['Catálogos'],
    summary: 'Catálogo de colores de ojos',
    responses: {
      200: {
        description: 'Colores de ojos disponibles.',
        content: { 'application/json': { schema: coloresOjosResp } },
      },
      500: respuestaError('Error inesperado.'),
    },
  });

  registry.registerPath({
    method: 'get',
    path: '/api/patrones-pelaje',
    tags: ['Catálogos'],
    summary: 'Catálogo de patrones de pelaje',
    responses: {
      200: {
        description: 'Patrones de pelaje disponibles.',
        content: { 'application/json': { schema: patronesPelajeResp } },
      },
      500: respuestaError('Error inesperado.'),
    },
  });

  registry.registerPath({
    method: 'get',
    path: '/api/estadisticas',
    tags: ['Perritos'],
    summary: 'Estadísticas del registro',
    description:
      'Conteo agregado en SQL: total de perritos y cuántos hay por color (consulta con GROUP BY).',
    responses: {
      200: {
        description: 'Estadísticas del registro.',
        content: { 'application/json': { schema: estadisticasResp } },
      },
      500: respuestaError('Error inesperado.'),
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
