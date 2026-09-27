## Why

El repositorio está vacío salvo por el PDF de la consigna y la configuración de OpenSpec. Antes de implementar el dominio (registro de perritos), necesitamos una base reproducible que cualquier integrante o el profesor pueda instalar y ejecutar siguiendo el README, sin Docker y con los mismos contratos técnicos (estructura, configuración, almacenamiento de imágenes y base de datos) que usarán los cambios posteriores. Sin esta base, cada rol construiría su parte con supuestos distintos y la instalación en vivo fallaría.

## What Changes

- Se crea la estructura monorepo del proyecto con tres paquetes independientes: `frontend/` (React + Vite + TypeScript), `backend/` (Node + Express + TypeScript) y `database/` (migraciones y seeds SQL), más `docs/`.
- Se agrega el andamiaje mínimo ejecutable: backend con endpoint de salud, carga de configuración y manejo de errores; frontend con enrutado base y cliente HTTP.
- Se define el contrato de configuración por variables de entorno con `.env.example` en cada paquete y un cargador/validador de configuración en el backend.
- Se establece la base de base de datos: conexión MySQL con doble modo (local para la instalación en vivo y Aiven en producción con TLS), migraciones versionadas y scripts de catálogos/datos de prueba.
- Se establece la abstracción de almacenamiento de imágenes con dos drivers (`local` mediante `RUTA_IMAGENES` y `s3`), la regla de nombres generados por el backend y la validación de imagen real.
- Se redacta el README inicial (raíz) con arquitectura, tecnologías y versiones, comandos de instalación/ejecución y placeholders de endpoints, paradigmas y despliegue; más una guía de desarrollo y flujo Git en `docs/`.
- Se fijan las reglas transversales: sin Docker, ramas + pull requests, `.gitignore` que excluye secretos y artefactos, y convención de commits.
- **No** se implementa todavía la lógica de negocio de registros, mapa, cámara ni idempotencia; esos quedan para cambios posteriores.

## Capabilities

### New Capabilities
- `project-scaffold`: estructura del monorepo, tooling compartido, scripts de inicio, reglas de "sin Docker", `.gitignore` y convención de ramas/commits.
- `backend-foundation`: base del API REST en Express con carga de configuración validada, endpoint de salud, CORS, manejo de errores y envelope de respuestas.
- `frontend-foundation`: base de la SPA React + Vite con enrutado, cliente HTTP y variables de entorno.
- `database-foundation`: modelo de conexión MySQL en doble modo (local y Aiven con TLS), migraciones versionadas y carga de catálogos y datos de prueba.
- `media-storage-foundation`: abstracción de almacenamiento de imágenes (`local` | `s3`), `RUTA_IMAGENES` fuera del proyecto, nombres generados por el backend y validación de imagen real.
- `project-documentation`: README raíz con los 11 puntos obligatorios (como esqueleto) y guía de desarrollo/Git en `docs/`.

### Modified Capabilities
<!-- Ninguna: el repositorio no tiene specs previas. -->

## Impact

- **Nuevo código**: `frontend/`, `backend/`, `database/`, `docs/`, `.gitignore`, `.env.example` por paquete.
- **Dependencias**: Node.js 22 LTS, npm workspaces, React, Vite, TypeScript, Express, `mysql2`, Zod, `@aws-sdk/client-s3`, `sharp`, Vitest, Supertest; MySQL 8 local y Aiven; AWS S3.
- **Documentación**: README raíz pasa a ser el contrato de instalación evaluado.
- **Procesos**: se activan ramas y pull requests por rol; ningún cambio futuro debe introducir Docker ni comprometer el modo de instalación local.
- **Riesgos**: el acceso a cámara/geolocalización exige HTTPS/localhost; debe documentarse cómo probar desde celular en la misma red.
