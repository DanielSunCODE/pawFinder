## Context

Ver `proposal.md` para la motivación. El backend es Express 4 + TypeScript con validación por Zod (`backend/src/config/env.ts`) y contrato de respuestas `{ data }` / `{ error }` en `src/middleware/errorHandler.ts`. Hoy solo existe `GET /api/health` (`src/routes/health.ts`). No hay dependencias de OpenAPI. Este diseño instala la infraestructura de documentación para que los cambios de dominio la reutilicen. El change `bootstrap-project` sigue en curso, pero esta integración es independiente y solo añade rutas de documentación.

## Goals / Non-Goals

**Goals:**
- Generar OpenAPI 3.1 desde los esquemas Zod (una sola fuente de verdad).
- Servir Swagger UI y el JSON OpenAPI desde el backend, público y sin Docker.
- Dejar el patrón para que los endpoints futuros se documenten sin duplicar esquemas.

**Non-Goals:**
- No documentar endpoints de dominio que aún no existen.
- No agregar autenticación a la documentación (decisión: pública).
- No generar clientes ni tipos del frontend a partir del OpenAPI en este cambio.

## Decisions

### Librerías: `@asteasolutions/zod-to-openapi` + `swagger-ui-express`
La especificación se construye con `@asteasolutions/zod-to-openapi` (v7, compatible con Zod 3) usando `OpenApiGeneratorV31` para emitir OpenAPI 3.1, y se sirve con `swagger-ui-express`. Ambos corren en proceso, sin build ni Docker.

**Alternativas consideradas:**
- `swagger-jsdoc`: obliga a escribir anotaciones YAML junto a las rutas y a mantener por separado los esquemas, duplicando lo que ya hace Zod.
- OpenAPI estático a mano: simple pero se desincroniza en el primer cambio de endpoint.
- `tsoa`: impone su propio estilo de controladores y decoradores; sobre-ingeniería para este proyecto.

### Estructura de la documentación
- `backend/src/docs/openapi.ts`: extiende Zod con OpenAPI (`extendZodWithOpenApi` una sola vez), crea el `OpenAPIRegistry` y arma el documento con `OpenApiGeneratorV31`.
- `backend/src/docs/schemas.ts`: esquemas reutilizables del contrato (envelope de éxito y de error).
- `backend/src/docs/paths/health.ts` (o registro en el mismo archivo): registro de `GET /api/health`.
- `backend/src/app.ts`: monta el JSON y la UI **antes** del manejador 404:
  - `GET /api/openapi.json` → documento generado.
  - `GET /api/docs` → Swagger UI (`swagger-ui-express`).
- Se agrega `OPENAPI_SERVER_URL` (opcional) a `src/config/env.ts` y a `backend/.env.example`; si no está, se usa una URL por defecto de desarrollo. La UI se expone en todos los entornos.
- `backend/AGENTS.md`: system prompt / guía de trabajo que obliga a mantener Zod y OpenAPI sincronizados en cada cambio de endpoint.

### Guía / system prompt (`backend/AGENTS.md`)
Un archivo markdown en el backend que cualquier persona o asistente de IA lee antes de tocar endpoints. Contenido:
- **Regla**: ninguna alta, cambio o baja de endpoint se considera terminada si no actualiza su esquema Zod y su registro en OpenAPI en el mismo cambio.
- **Checklist**: definir/actualizar el esquema Zod → validar con `validateBody`/esquemas → registrar el endpoint en el registro OpenAPI → correr las pruebas de `/api/openapi.json`.
- **Ubicación**: dónde vive el registro (`backend/src/docs/openapi.ts`) y un ejemplo mínimo de registro para copiar.
- **Mantenimiento**: los esquemas que queden sin uso se retiran para no dejar basura en la especificación.
Se enlaza desde el `README` del backend y desde la sección de endpoints para que sea visible al trabajar.

**Alternativas consideradas:** poner la regla solo en el README (se pierde entre la instalación); confiar en revisión manual (se olvida). El system prompt dedicado es la fuente que los asistentes pueden cargar automáticamente.

### Contrato documentado
El envelope `{ data: ... }` y `{ error: { message, details? } }` se registran una vez como esquemas y se referencian en cada respuesta; así los endpoints futuros heredan el contrato.

### Compatibilidad de versiones
Se fija `@asteasolutions/zod-to-openapi` en la mayor compatible con Zod 3 (v7) y `swagger-ui-express` en su estable actual. Node 22 LTS como el resto del proyecto.

## Risks / Trade-offs

- **Desajuste entre la versión de `zod-to-openapi` y Zod 3.23** → fijar v7 y cubrir con una prueba que falle si el documento no genera.
- **El generador 3.1 puede no estar en versiones viejas** → usar `OpenApiGeneratorV31` de v7; si no estuviera disponible, caer a `OpenApiGeneratorV3` y actualizar el spec a 3.0.
- **Documentación pública revela la superficie del API** → decisión aceptada; no incluye secretos y puede gatearse después sin cambiar el diseño.
- **Peso extra de Swagger UI en el arranque** → aceptable; solo se monta en dos rutas de documentación.
- **Rutas de docs chocando con el 404** → montar antes de `notFoundHandler` y cubrir con prueba.

## Migration Plan

Cambio aditivo, sin base de datos ni migración de datos. Se instalan dependencias, se agregan archivos de documentación, se monta en `app.ts` y se documenta en el README. Rollback: revertir el PR elimina rutas y dependencias sin efectos en el resto del sistema.
