## Context

Ver `proposal.md` para la motivación. El flujo de registro (`add-perritos-api`) ya valida los magic bytes con `file-type` y entrega un `Buffer` al `StorageDriver`. Falta procesar ese buffer antes de guardarlo. El backend corre en Node 22+ y ya tiene configuración Zod.

## Goals / Non-Goals

**Goals:**
- Reescalar y recomprimir las fotos de forma configurable.
- Corregir orientación y quitar metadatos/GPS.
- No romper el registro si el procesamiento falla.

**Non-Goals:**
- Generar varias miniaturanes (se sigue devolviendo la misma URL de foto).
- Procesar las fotos de los seeds (ya son pequeñas).
- Recompresión diferida o por lotes.

## Decisions

### `sharp` para el procesamiento
Se usa `sharp`, precompilado, rápido y sin dependencias de sistema extra (no rompe la regla de "sin Docker"). Se aplica `rotate()` (EXIF), `resize({ fit: 'inside', withoutEnlargement: true })` y salida `webp`/`jpeg` con `IMAGE_QUALITY`.

**Alternativas consideradas:** `jimp` (puro JS, más lento y sin WEBP de calidad); recomprimir solo con `zlib` (no aplica a imágenes).

### Salida WEBP por defecto
WEBP logra mejor compresión a igual calidad y soporta transparencia; se puede cambiar a JPEG por configuración.

### Fallback al original
El pipeline envuelve el procesamiento en `try/catch`; si falla, se devuelve el buffer original con la extensión validada, para no perder un registro válido.

### Limpieza de metadatos
`sharp` no copia metadatos salvo que se pida `withMetadata()`, así que el reencodeo descarta EXIF/GPS de forma natural.

## Risks / Trade-offs

- **Conversión de formato** (p. ej. PNG con transparencia → JPEG) pierde transparencia → por defecto se usa WEBP, que la conserva; JPEG es opción explícita.
- **Costo de CPU por subida** → aceptable; el reescalado limita el trabajo y solo ocurre al registrar.
- **Imágenes animadas o formatos raros** → el fallback guarda el original validado.
- **Tests dependen de `sharp`** (binario nativo) → `npm install` trae el precompilado; si no, las pruebas de compresión fallan.

## Migration Plan

Cambio aditivo, sin migración de datos. Las fotos ya guardadas no se reprocesan. Rollback: revertir el PR (las nuevas fotos volverían a guardarse sin comprimir).
