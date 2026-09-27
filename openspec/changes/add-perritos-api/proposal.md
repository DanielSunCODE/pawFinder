## Why

El backend ya tiene la base (config, salud, storage, base de datos, documentación) pero no los endpoints del dominio. El frontend consume un contrato que todavía no existe en el API: listar, registrar, detallar perritos, catálogos y estadísticas. Sin estos endpoints la aplicación no registra ni muestra nada.

## What Changes

- Se agregan los endpoints del dominio: `GET /api/perritos`, `GET /api/perritos/{id}`, `POST /api/perritos`, `GET /api/perritos/{id}/foto`, `GET /api/razas`, `GET /api/colores`, `GET /api/colores-ojos`, `GET /api/patrones-pelaje` y `GET /api/estadisticas`.
- El registro es **idempotente**: la clave del encabezado `Idempotency-Key` se guarda en la tabla `idempotencia`; reintentar devuelve el mismo perrito y no crea otro.
- La validación vive en **Zod** y es la misma que genera la documentación **OpenAPI** (Swagger UI). El body del registro se documenta con campos estructurados (`nombre`, `razaId`, `colorPrincipalId`, `coloresAdicionalesIds[]`, `latitud`, `longitud`, `foto` binaria).
- El registro cubre **todos los campos del esquema** `perros`: exige `razaId`, `colorOjosId`, `sexo`, `etapaVida`, `tamano`, `longitudPelaje` y `patronPelajeId`; el único campo opcional son las `marcasDistintivas`. El detalle/listado los devuelve (con JOIN a `patrones_pelaje` y `colores_ojos`). La base se alinea con `005`/`006`.
- El listado y el detalle resuelven el JOIN de perrito + raza + colores en SQL; las estadísticas usan `GROUP BY`; el filtrado y el orden se hacen en SQL, no en el cliente.
- La raza pasa a ser **opcional** (migración que permite `id_raza` nulo).
- Se agrega un mapper funcional (`find`/`filter`/`map` + `reduce`, sin mutar) para dar forma a las respuestas.
- Se agrega la carga de archivos (multipart) con `multer` y la validación de imagen por contenido.

## Capabilities

### New Capabilities
- `perritos-api`: contrato REST del registro de perritos (listar/filtrar, detalle, registrar de forma idempotente, foto, catálogos y estadísticas).

### Modified Capabilities
<!-- Ninguna. -->

## Impact

- **Código**: `backend/src/schemas/perrito.ts`, `repositories/perritosRepository.ts`, `mappers/perritoMapper.ts`, `routes/perritos.ts`, wiring en `routes/index.ts` y `app.ts`, `docs/schemas.ts` y `docs/openapi.ts`.
- **Base de datos**: migración `004_raza_opcional.sql` (`id_raza` nullable). Usa `perros`, `perro_colores`, `colores`, `razas` e `idempotencia`.
- **Dependencias**: `multer` (multipart).
- **Frontend**: `frontend/src/api/http.ts` envía los campos individuales del multipart (el contrato ya soporta `{ data }`).
- **Documentación**: README y `docs/` actualizados con los endpoints y el mapeo de paradigmas.
