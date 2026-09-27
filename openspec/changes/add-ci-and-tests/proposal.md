## Why

Hoy la suite de pruebas existe pero nadie la ejecuta automáticamente: un cambio
roto puede llegar a `main` sin que nadie note que falla `typecheck`, `lint`,
`test` o `build`. La consigna exige trabajo en ramas con pull requests revisados,
y una verificación automática en cada push/PR es la forma barata de evitar
romper la entrega. Además, varias reglas críticas (idempotencia, validación de
imagen, mapeo funcional) hoy no tienen prueba.

## What Changes

- Se agrega un pipeline de **CI** en GitHub Actions (`.github/workflows/ci.yml`)
  que en cada push y pull request instala con `npm ci` y corre, para backend y
  frontend: `lint`, `typecheck`, `test` y `build`. Sin Docker.
- Se agregan scripts en la raíz para correr todo en local de una sola vez
  (`test`, `typecheck`, `build`, `ci`).
- Se agregan **pruebas unitarias** para módulos hoy sin cobertura: el mapper
  funcional del backend y utilidades puras del frontend (transformaciones,
  idempotencia, formato, ubicación/reintentos).
- Se agregan **pruebas integrales** (supertest sobre `createApp`, con
  repositorio y almacenamiento simulados) que cubren el flujo completo del API:
  registro idempotente (doble envío), foto servida, catálogos/estadísticas y
  errores entendibles.
- La documentación de desarrollo se actualiza con cómo correr el pipeline en
  local y qué verifica.

## Capabilities

### New Capabilities
- `continuous-integration`: pipeline de GitHub Actions que verifica instalación, lint, tipos, pruebas y build en cada push y pull request, sin Docker.
- `test-suite`: pruebas unitarias de módulos puros y pruebas integrales del API (supertest con dependencias simuladas) que respaldan las reglas críticas del dominio.

### Modified Capabilities
<!-- Ninguna: son capacidades nuevas. -->

## Impact

- **Nuevo**: `.github/workflows/ci.yml` (raíz).
- **Código**: scripts de la raíz en `package.json`; nuevas pruebas en
  `backend/tests/` y junto a las utilidades del frontend.
- **Herramientas**: se reutilizan Vitest y Supertest ya presentes; no se agregan
  dependencias de producción nuevas.
- **Documentación**: `README.md` y `docs/development.md` con la verificación
  automática y los comandos equivalentes en local.
- **Sin Docker**: el pipeline corre directo en el runner con `actions/setup-node`;
  no se agregan `Dockerfile` ni service containers.
