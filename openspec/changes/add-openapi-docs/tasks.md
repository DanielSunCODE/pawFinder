## 1. Dependencias y configuración

- [x] 1.1 Agregar `@asteasolutions/zod-to-openapi@^7` y `swagger-ui-express` a `backend/package.json`, y `@types/swagger-ui-express` a `devDependencies`
- [x] 1.2 Agregar `OPENAPI_SERVER_URL` (opcional) al esquema de `backend/src/config/env.ts` y a `backend/.env.example` con un valor de ejemplo

## 2. Infraestructura de documentación

- [x] 2.1 Crear `backend/src/docs/schemas.ts` con los esquemas Zod reutilizables del envelope de éxito (`{ data }`) y de error (`{ error }`)
- [x] 2.2 Crear `backend/src/docs/openapi.ts`: extender Zod con OpenAPI una sola vez, crear el `OpenAPIRegistry` y armar el documento con `OpenApiGeneratorV31` (OpenAPI 3.1)
- [x] 2.3 Añadir la configuración de `servers` del documento usando `OPENAPI_SERVER_URL` con una URL por defecto de desarrollo
- [x] 2.4 Registrar `GET /api/health` en el registro con su respuesta esperada y el contrato uniforme

## 3. Montaje y disponibilidad

- [x] 3.1 Exponer `GET /api/openapi.json` devolviendo el documento OpenAPI generado
- [x] 3.2 Montar Swagger UI en `/api/docs` con `swagger-ui-express`, antes del manejador 404
- [x] 3.3 Confirmar que ambas rutas quedan disponibles en todos los entornos sin requerir autenticación

## 4. Contrato reutilizable

- [x] 4.1 Referenciar los esquemas de éxito y error en las respuestas para que los endpoints futuros los reutilicen sin duplicar definiciones
- [x] 4.2 Documentar en `backend/src/docs/openapi.ts` (comentario breve) cómo registrar un endpoint de dominio nuevo

## 5. Pruebas y documentación

- [x] 5.1 Agregar prueba de que `/api/openapi.json` responde 200 con un documento OpenAPI 3.1 que incluye `GET /api/health`
- [x] 5.2 Agregar prueba de que `/api/docs` responde 200 y de que el documento no contiene valores de configuración ni secretos
- [x] 5.3 Actualizar el README del backend con las rutas `/api/docs` y `/api/openapi.json` y la variable `OPENAPI_SERVER_URL`

## 6. Guía / system prompt

- [x] 6.1 Crear `backend/AGENTS.md` con la regla de que toda alta, cambio o baja de endpoint actualice su esquema Zod y su registro en OpenAPI en el mismo cambio
- [x] 6.2 Incluir en `backend/AGENTS.md` una lista de verificación (esquema Zod → validación → registro OpenAPI → prueba de `/api/openapi.json`) y un ejemplo mínimo de registro de endpoint
- [x] 6.3 Enlazar `backend/AGENTS.md` desde el README del backend para que sea visible al trabajar en endpoints

## 7. Verificación

- [x] 7.1 Verificar que levantar el backend desde cero deja la documentación disponible sin pasos extra
- [x] 7.2 Ejecutar `openspec validate add-openapi-docs --strict` y confirmar que el cambio es válido
