## Why

Hoy los endpoints del API solo se conocen leyendo el código o una lista escrita a mano en el README, que se desactualiza en cuanto cambia una ruta. Necesitamos una especificación OpenAPI que viva junto al código y una interfaz (Swagger UI) donde cualquiera —integrante, profesor o revisor— vea qué endpoints existen, qué reciben y qué devuelven, sin instalar nada extra.

## What Changes

- Se agrega la generación de la especificación **OpenAPI 3.1 a partir de los esquemas Zod** que ya usa el backend, de modo que validación y documentación tengan una sola fuente de verdad.
- Se monta **Swagger UI** en `/api/docs` y el **documento OpenAPI en JSON** en `/api/openapi.json`, disponibles en todos los entornos (local, Render, Aiven) sin Docker ni pasos de build adicionales.
- Se registra el endpoint de salud (`GET /api/health`) como primer ejemplo documentado, junto con el contrato uniforme de respuestas (`{ data }`) y de errores (`{ error }`).
- Se define dónde se registran los esquemas y las rutas para que los cambios de dominio añadan documentación sin duplicar definiciones.
- Se documenta en el README del backend cómo abrir `/api/docs` y cómo apuntar el servidor de la especificación a la URL pública.
- Se añade un archivo markdown que actúa como **system prompt / guía de trabajo** (`backend/AGENTS.md`): obliga a que toda alta, cambio o baja de endpoint actualice su esquema Zod y su registro en OpenAPI dentro del mismo cambio, de modo que Swagger nunca quede desactualizado.
- **No** se documentan todavía los endpoints de dominio (registro, mapa, fotos), porque aún no existen; quedan cubiertos por la infraestructura que este cambio instala.

## Capabilities

### New Capabilities
- `api-documentation`: especificación OpenAPI generada desde los esquemas Zod y Swagger UI servida en todos los entornos para explorar y probar los endpoints.

### Modified Capabilities
<!-- Ninguna: backend-foundation no cambia su comportamiento observable; solo se añade documentación encima. -->

## Impact

- **Dependencias nuevas (solo backend)**: `@asteasolutions/zod-to-openapi`, `swagger-ui-express` y `@types/swagger-ui-express` (dev). No requiere Docker.
- **Código**: `backend/src/docs/openapi.ts` (registro y generación), montaje en `backend/src/app.ts`, endpoint de salud registrado en el registro.
- **Configuración**: nueva variable opcional `OPENAPI_SERVER_URL` para fijar la URL pública que muestra Swagger UI.
- **Documentación**: sección de `/api/docs` y `/api/openapi.json` en el README del backend y en la lista de endpoints, más `backend/AGENTS.md` con la regla de mantener Zod y OpenAPI sincronizados.
- **Sin impacto** en base de datos, almacenamiento ni frontend.
