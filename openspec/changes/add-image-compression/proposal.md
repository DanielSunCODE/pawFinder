## Why

Las fotos que se toman con el celular pesan varios megabytes y consumen almacenamiento y ancho de banda (subida en la calle y descarga en el mapa). Además, la foto viene con metadatos EXIF que incluyen la ubicación GPS del dispositivo. Comprimir y reescalar la imagen en el backend reduce el peso, acelera la app y elimina esos metadatos.

## What Changes

- Al registrar un perrito, la foto validada se **reescala** (lado mayor configurable) y se **reencodea** antes de guardarse.
- El formato y la calidad de salida son **configurables** (`IMAGE_OUTPUT_FORMAT`, `IMAGE_QUALITY`); por defecto se guarda en **WEBP** a calidad 80.
- Se **corrige la orientación** según el EXIF y se **descartan los metadatos**, incluida la ubicación GPS.
- Las imágenes más chicas que el máximo **no se amplían**.
- Si una imagen validada no se puede procesar, se guarda la original (no se pierde un registro válido).
- Se documenta el comportamiento en Swagger y en el README.

## Capabilities

### New Capabilities
- `image-compression`: compresión, reescalado y limpieza de metadatos de las fotos subidas, antes de almacenarlas.

### Modified Capabilities
<!-- Ninguna. -->

## Impact

- **Código**: `backend/src/storage/processImage.ts`, integración en `backend/src/routes/perritos.ts`, variables en `backend/src/config/env.ts`.
- **Dependencias**: `sharp` (procesamiento de imágenes).
- **Configuración**: nuevas variables `IMAGE_MAX_DIMENSION`, `IMAGE_QUALITY`, `IMAGE_OUTPUT_FORMAT`.
- **Formato almacenado**: las fotos nuevas se guardan en WEBP (por defecto) en lugar de conservar el formato original; el endpoint de foto ya sirve cualquier formato con su `Content-Type`.
- **Documentación**: OpenAPI, README y `docs/architecture.md`.
