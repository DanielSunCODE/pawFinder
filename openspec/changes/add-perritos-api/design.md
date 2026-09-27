## Context

Ver `proposal.md` para la motivación. El backend ya tiene `createApp` con inyección de dependencias, `StorageDriver` (`local`/`s3`), pool `mysql2`, configuración Zod y OpenAPI generado desde Zod (`add-openapi-docs`). El frontend consume un contrato con envelope `{ data }` y errores `{ error: { message, details } }`. La base tiene `perros`, `perro_colores`, `razas`, `colores` e `idempotencia`.

## Goals / Non-Goals

**Goals:**
- Implementar los endpoints del dominio con validación de servidor y SQL declarativo.
- Registro idempotente y documentado en Swagger con body estructurado.
- Código testeable sin base de datos (repositorio inyectable).

**Non-Goals:**
- Editar o borrar perritos (extra, fuera de alcance).
- Generar miniaturas reales (se devuelve la misma URL de la foto).
- Guardar `hex` por color en el catálogo (se devuelve `null`).

## Decisions

### Multipart con campos individuales
El registro usa `multipart/form-data` con campos individuales (`nombre`, `razaId`, `colorPrincipalId`, `coloresAdicionalesIds` repetido, `latitud`, `longitud`, `foto`). Así Swagger UI muestra cada campo y su tipo en vez de un único string JSON.

**Alternativas consideradas:** un campo `datos` con JSON (se mantiene **soportado** por compatibilidad, pero Swagger lo muestra como un texto plano); enviar la foto en base64 dentro de JSON (más pesado y rompe el multipart del frontend).

### Idempotencia con tabla dedicada + UNIQUE
La clave (`Idempotency-Key`) se guarda en la tabla `idempotencia` (PK). El endpoint comprueba la clave **antes** de validar/guardar la foto; si existe, devuelve el perrito original con 201. Las carreras se resuelven con el `UNIQUE` de la PK: el envío perdedor captura `ER_DUP_ENTRY`, hace rollback y devuelve el registro existente.

**Alternativas consideradas:** columna en `perros` (menos normalizado); responder 409 en duplicado (prohibido por la consigna: no es idempotencia).

### SQL declarativo y mapper funcional
`SELECT_PERRITO` hace el JOIN de `perros` + `razas` + `perro_colores`/`colores` y sirve al listado y al detalle. `GET /api/estadisticas` usa `GROUP BY`. Las filas del JOIN se agrupan con `reduce` (`agrupar`) y se dan forma con `find`/`filter`/`map` (`aPerritoApi`), sin mutar ni usar ciclos explícitos.

### Repositorio inyectable
`createApp(config, { pool, storage, repository })` permite inyectar un repositorio falso en pruebas, de modo que las rutas se prueban sin MySQL.

### Raza opcional
La consigna define la raza como opcional. La migración `004_raza_opcional.sql` deja `id_raza` nullable; si no se elige raza, se guarda `NULL`. "Sin raza definida / Criollo" sigue en el catálogo.

### Contrato uniforme
Éxito: `{ data: ... }`. Error: `{ error: { message, details? } }` con código HTTP correcto. La validación de `datos` y de los filtros usa los mismos esquemas Zod que documentan OpenAPI.

## Risks / Trade-offs

- **Carrera de idempotencia deja un archivo huérfano** (el envío perdedor guardó la foto antes de chocar con el `UNIQUE`) → el `UNIQUE` garantiza no duplicar el registro; el archivo huérfano es de bajo impacto y se puede limpiar por fuera.
- **`coloresAdicionalesIds` repetido en multipart** → se normaliza aceptando array (repetido) o string separado por comas.
- **No verificado contra MySQL real en este entorno** (sin credenciales) → las rutas se prueban con un repositorio simulado; el SQL se valida con `db:reset` en local.
- **`hex` de color en `null`** → el frontend lo permite; se puede poblar con una migración futura.
- **Errores de FK** (color/raza inexistente) → se traducen a 400 con mensaje entendible.

## Migration Plan

Cambio aditivo. Aplica la migración `004_raza_opcional.sql` con `npm run db:migrate`. No hay migración de datos existentes. Rollback: revertir el PR; la migración es reversible con `ALTER TABLE perros MODIFY id_raza INT NOT NULL` si no hay filas con `NULL`.
