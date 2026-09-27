## 1. Configuración

- [x] 1.1 Agregar `IMAGE_MAX_DIMENSION`, `IMAGE_QUALITY` e `IMAGE_OUTPUT_FORMAT` a `backend/src/config/env.ts`
- [x] 1.2 Documentarlas en `backend/.env.example`

## 2. Procesamiento

- [x] 2.1 Instalar `sharp`
- [x] 2.2 Implementar `backend/src/storage/processImage.ts` (rotate, resize, reencode, fallback)
- [x] 2.3 Integrar la compresión en `POST /api/perritos` antes de guardar

## 3. Documentación

- [x] 3.1 Actualizar la descripción de `POST /api/perritos` en OpenAPI
- [x] 3.2 Actualizar el README, `backend/README.md` y `docs/architecture.md`

## 4. Verificación

- [x] 4.1 Pruebas de `comprimirImagen` (reduce dimensiones, respeta jpeg, no amplía, fallback)
- [x] 4.2 `typecheck`, suite del backend, `build`
- [x] 4.3 `openspec validate add-image-compression --strict`
