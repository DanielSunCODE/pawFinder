## 1. Estructura y tooling base

- [x] 1.1 Crear `package.json` raíz con npm workspaces (`frontend`, `backend`, `database`) y scripts `install:all`, `dev:backend`, `dev:frontend`
- [x] 1.2 Crear `.gitignore` (dependencias, builds, `.env`, llaves, imágenes de prueba), `.editorconfig` y `.env.example` raíz si aplica
- [x] 1.3 Crear la estructura de carpetas `frontend/`, `backend/`, `database/` y `docs/` según el árbol de `design.md`
- [x] 1.4 Crear los `package.json` de cada paquete con sus scripts y dependencias declaradas

## 2. Backend foundation

- [x] 2.1 Configurar TypeScript del backend (`tsconfig.json`) y scripts `dev`, `build`, `test`
- [x] 2.2 Implementar `src/config/env.ts` con Zod: validar variables obligatorias y fallar con mensaje claro sin exponer valores
- [x] 2.3 Implementar `src/app.ts` y `src/index.ts` con Express, JSON, CORS configurable y arranque del servidor
- [x] 2.4 Implementar `src/routes/health.ts` con el endpoint de salud y el contrato de respuesta `{ data }`
- [x] 2.5 Implementar `src/middleware/errorHandler.ts` con mensajes entendibles y respuesta de error uniforme
- [x] 2.6 Implementar `src/middleware/validate.ts` (Zod) con errores por campo
- [x] 2.7 Escribir `backend/.env.example` con todas las variables del design
- [x] 2.8 Agregar pruebas Vitest + Supertest del endpoint de salud y del validador de configuración

## 3. Database foundation

- [x] 3.1 Implementar `backend/src/db/pool.ts` con pool `mysql2` que soporte modo local y Aiven con TLS (`DB_SSL`, `DB_SSL_CA`)
- [x] 3.2 Escribir migración `001_catalogs.sql` (razas y colores, incluyendo "Sin raza definida / criollo")
- [x] 3.3 Escribir migración `002_dogs.sql` (perrito + relación de colores con principal y hasta dos adicionales)
- [x] 3.4 Escribir migración `003_idempotency.sql` (clave de idempotencia única, tabla `idempotencia` 1:1 con `perros`)
- [x] 3.5 Escribir seeds `001_breeds.sql` (>=10 razas), `002_colors.sql` (>=10 colores) y `003_test_dogs.sql` (>=15 perritos con foto)
- [x] 3.6 Implementar `database/scripts` para migrar, sembrar, respaldar y restaurar, y verificar la creación desde cero en una base local

## 4. Media storage foundation

- [x] 4.1 Definir la interfaz de storage (`guardar`, `leer`) y el selector por `STORAGE_DRIVER` en `backend/src/storage/index.ts`
- [x] 4.2 Implementar el driver `local` usando `RUTA_IMAGENES` fuera del proyecto, creando el directorio si no existe
- [x] 4.3 Implementar el driver `s3` con `@aws-sdk/client-s3` sobre bucket privado
- [x] 4.4 Implementar la generación de nombre por el backend y la validación de imagen real (JPG/PNG/WEBP) por contenido
- [x] 4.5 Dejar listo el endpoint base que sirve las fotos a través del backend (sin exponer carpeta ni bucket)

## 5. Frontend foundation

- [x] 5.1 Configurar Vite + React + TypeScript y Tailwind, con meta viewport responsive
- [x] 5.2 Implementar `src/router.tsx` con rutas base `registro`, `lista`, `mapa` y `detalle`
- [x] 5.3 Implementar `src/api/client.ts` con URL base desde `VITE_API_URL` y traducción de errores a mensajes entendibles
- [x] 5.4 Crear las vistas base (`RegisterPage`, `ListPage`, `MapPage`, `DetailPage`) con placeholders
- [x] 5.5 Escribir `frontend/.env.example` con `VITE_API_URL` y `VITE_MAP_TILE_URL`
- [x] 5.6 Documentar/configurar el modo HTTPS para probar cámara y ubicación desde un celular en la misma red

## 6. Documentación

- [x] 6.1 Redactar `README.md` raíz con nombre, integrantes/roles, arquitectura, stack con versiones exactas y estructura de carpetas
- [x] 6.2 Agregar al README los pasos de instalación, creación de BD, carga de datos, variables de entorno y comandos de ejecución con URLs
- [x] 6.3 Agregar al README cómo probar desde celular en la misma red, lista de endpoints (aunque sea esqueleto) y problemas comunes
- [x] 6.4 Agregar las secciones esqueleto de Paradigmas y Despliegue con placeholders marcados para completar por rol
- [x] 6.5 Redactar `docs/development.md` (inicio rápido, flujo de ramas y pull requests, convención de commits, reglas de secretos)
- [x] 6.6 Redactar `docs/architecture.md` (diagrama, stack y mapeo de paradigmas) y `docs/deployment.md` (borrador de la sección de despliegue)

## 7. Verificación final

- [x] 7.1 Ejecutar `npm install` en la raíz y confirmar que no se versionan dependencias ni secretos
- [x] 7.2 Levantar backend y frontend y confirmar el endpoint de salud y la carga de la SPA
- [ ] 7.3 Aplicar migraciones y seeds en una base local limpia y confirmar catálogos y perritos de prueba (requiere credenciales de MySQL local; ejecutar `npm run db:reset`)
- [x] 7.4 Ejecutar la suite de pruebas de ambos paquetes
- [x] 7.5 Ejecutar `openspec validate bootstrap-project --strict` y confirmar que el cambio es válido
