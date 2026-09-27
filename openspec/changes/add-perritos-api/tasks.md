## 1. Esquemas y contrato

- [x] 1.1 Definir esquemas Zod de dominio en `backend/src/schemas/perrito.ts` (registro, filtros, id, idempotencia)
- [x] 1.2 Documentar en `backend/src/docs/schemas.ts` los esquemas del API (Perrito, Raza, Color, respuestas)
- [x] 1.3 Documentar el cuerpo multipart con campos individuales (`SubidaPerrito`) y el encabezado `Idempotency-Key`

## 2. Base de datos

- [x] 2.1 Agregar migración `004_raza_opcional.sql` (`id_raza` nullable)
- [x] 2.2 Implementar el repositorio con JOIN de perrito + raza + colores para listado y detalle
- [x] 2.3 Implementar el registro transaccional con colores e idempotencia (`UNIQUE`, manejo de carrera)
- [x] 2.4 Implementar catálogos (razas, colores) y estadísticas (`GROUP BY`)

## 3. Rutas y validación

- [x] 3.1 `GET /api/perritos` con filtros `busqueda`, `colorId`, `razaId`
- [x] 3.2 `GET /api/perritos/{id}` con 400/404 entendibles
- [x] 3.3 `POST /api/perritos` con validación, foto (magic bytes) e idempotencia
- [x] 3.4 Aceptar campos individuales del multipart y mantener compatibilidad con `datos` JSON
- [x] 3.5 `GET /api/perritos/{id}/foto`, `GET /api/razas`, `GET /api/colores`, `GET /api/estadisticas`
- [x] 3.6 Mapper funcional de filas del JOIN a la respuesta del API

## 4. Documentación OpenAPI

- [x] 4.1 Registrar todos los paths y componentes en `backend/src/docs/openapi.ts`
- [x] 4.2 Verificar en `/api/openapi.json` que el body del POST expone las propiedades estructuradas

## 5. Frontend y documentación

- [x] 5.1 Enviar los campos individuales del multipart desde `frontend/src/api/http.ts`
- [x] 5.2 Actualizar README, `backend/README.md`, `docs/architecture.md` y `docs/database-schema.md`

## 6. Verificación

- [x] 6.1 Pruebas de listado, detalle, catálogos, estadísticas y foto
- [x] 6.2 Pruebas de registro: validaciones, foto inválida, campos individuales e idempotencia
- [x] 6.3 `typecheck`, suite del backend, `db:typecheck` y `build`
- [x] 6.4 `openspec validate add-perritos-api --strict`
