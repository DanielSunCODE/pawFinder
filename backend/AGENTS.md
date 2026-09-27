# AGENTS.md — Guía para trabajar en el backend

Este archivo es el **system prompt / guía de trabajo** del backend. Cualquier persona o asistente de IA que modifique endpoints debe leerlo y seguirlo.

## Regla principal

Un cambio de endpoint **no está terminado** si no actualiza, en el mismo cambio:

1. su **esquema Zod** (validación), y
2. su **registro en OpenAPI** (documentación).

La especificación OpenAPI nunca se escribe a mano: se genera desde Zod. Si Zod y OpenAPI no quedan sincronizados, Swagger UI miente y el cambio se rechaza en revisión.

## Lista de verificación (antes de abrir el pull request)

- [ ] Definí o actualicé el esquema Zod del endpoint (idealmente en `src/docs/schemas.ts` o junto a la ruta).
- [ ] Valido la entrada con ese esquema (`validateBody` u otro middleware equivalente).
- [ ] Registré el endpoint en `src/docs/openapi.ts` con `registry.registerPath`, reutilizando los esquemas de éxito (`{ data }`) y error (`{ error }`).
- [ ] Actualicé `/api/openapi.json` haciendo que la prueba de OpenAPI siga pasando.
- [ ] Ejecuté `npm run test --workspace @pawfinder/backend` y `npm run typecheck --workspace @pawfinder/backend`.

## Qué hacer en cada tipo de cambio

- **Alta:** crea el esquema Zod, valida con él y registra la ruta y sus respuestas en el registro.
- **Cambio de contrato** (entrada, salida o ruta): actualiza el esquema Zod y su registro para que Swagger refleje el nuevo contrato.
- **Baja:** elimina el `registerPath` del endpoint y retira los esquemas que queden sin uso para no dejar basura en la especificación.

## Dónde vive la documentación

- Registro y generación: `src/docs/openapi.ts`.
- Esquemas reutilizables: `src/docs/schemas.ts`.
- Montaje en la app: `src/app.ts` (`/api/openapi.json` y `/api/docs`).

## Ejemplo mínimo de registro

```ts
import { errorResponseSchema, miRespuestaSchema } from './schemas.js';

const successSchema = registry.register('MiRespuesta', miRespuestaSchema);
const errorSchema = registry.register('ErrorResponse', errorResponseSchema);

registry.registerPath({
  method: 'get',
  path: '/api/perritos',
  tags: ['Perritos'],
  summary: 'Listar perritos',
  responses: {
    200: {
      description: 'Listado de perritos.',
      content: { 'application/json': { schema: successSchema } },
    },
    500: {
      description: 'Error inesperado.',
      content: { 'application/json': { schema: errorSchema } },
    },
  },
});
```
