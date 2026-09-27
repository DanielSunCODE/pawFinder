## Context

Ver `proposal.md`. El repositorio ya tiene una suite de Vitest (pruebas unitarias
y de integración con Supertest en `backend/tests/`) y scripts por workspace
(`test`, `typecheck`, `build` en backend; `lint`, `typecheck`, `test`, `build` en
frontend), pero ningún proceso los ejecuta automáticamente. El proyecto es un
repositorio de GitHub (`origin`) con monorepo de workspaces (`backend`,
`frontend`, `database`) y `package-lock.json` en la raíz. La regla de "sin
Docker" del MASTER_PROMPT también aplica aquí.

## Goals / Non-Goals

**Goals:**
- Verificar en cada push y pull request que el proyecto instala, lintea, tipa,
  pasa pruebas y compila.
- Correr la verificación sin base de datos, sin secretos y sin Docker.
- Ampliar la cobertura con pruebas unitarias de módulos puros y pruebas
  integrales del contrato HTTP.
- Ofrecer el mismo conjunto de chequeos en local con un comando.

**Non-Goals:**
- Despliegue automático (CD): el deploy sigue a cargo de las integraciones de
  Render/Vercel. No se agregan `deploy hooks` ni secretos.
- Pruebas end-to-end en navegador (Playwright/Cypress) ni pruebas contra MySQL
  real.
- Cobertura mínima obligatoria (umbral de porcentaje).

## Decisions

### Plataforma: GitHub Actions
El remoto es GitHub, así que Actions es la opción sin infraestructura extra ni
secrets para autenticar. Alternativas (GitLab CI, CircleCI) implicarían una
cuenta/servicio adicional sin beneficio.

### Un workflow, dos jobs en paralelo: `backend` y `frontend`
Separar por paquete hace visible de un vistazo qué parte falló y permite que
ambos corran en paralelo. Se usa `actions/setup-node` con `node-version-file:
.nvmrc` (nuevo, `22`) y `cache: npm` con `package-lock.json` como
`cache-dependency-path`. Se instala una sola vez en la raíz con `npm ci`
(workspaces) y luego cada job corre sus scripts. Triggers: `pull_request` hacia
`main`/`dev`, `push` a `main`/`dev`, y `workflow_dispatch` manual;
`concurrency` con `cancel-in-progress` para no acumular corridas del mismo ref.

### Lint también en backend
Hoy el backend no tiene linter. Para que el chequeo sea simétrico se agrega
`oxlint` como `devDependency` del backend y un script `lint`, igual que el
frontend. Alternativa considerada: omitir lint en backend; se descarta porque
deja medio pipeline sin verificación y el costo es bajo.

### Pruebas integrales con dobles, no con base real
Se mantiene el patrón existente: `supertest` contra `createApp(config, deps)` con
un `PerritosRepository` y un `Storage` falsos (ver `backend/tests/helpers` y
`backend/tests/perritos.test.ts`). Esto cubre el contrato HTTP, la validación, la
idempotencia y el manejo de errores sin DB, sin red y sin Docker. Alternativa
considerada: MySQL real con service container; se descarta por el "sin Docker" y
porque añadiría flakiness y secretos.

### Ubicación de las pruebas
Las unitarias e integrales del backend viven en `backend/tests/` (mismo árbol
que las actuales). Las unitarias del frontend viven junto al módulo con sufijo
`.test.ts` (como `frontend/src/utils/validacion.test.ts`), reforzando utilidades
puras: transformaciones, idempotencia, formato y ubicación/reintentos. El
backend cubre con unitarias el mapper funcional (`src/mappers/perritoMapper.ts`).

### Comandos en la raíz
Se agregan scripts en el `package.json` raíz para correr la verificación
completa en local (`test`, `typecheck`, `build`, `lint` y un `ci` que los
encadena), reutilizando los scripts por workspace ya existentes.

## Risks / Trade-offs

- **`oxlint` en el backend podría reportar hallazgos en código existente y
  romper el primer run** → correr `oxlint` en local durante la implementación,
  corregir o ajustar la configuración antes de dejar el paso como bloqueante.
- **Lockfile o scripts desincronizados hacen fallar `npm ci`** → es el
  comportamiento deseado (falla ruidosamente); se documenta mantener el
  `package-lock.json` versionado y actualizado.
- **Deriva de versión de Node entre CI y local** → `.nvmrc` fijado en `22` y
  `engines: >=22`, usados por el pipeline.
- **Pruebas dependientes del sistema de archivos** (storage, CA) → ya usan
  directorios temporales (`mkdtemp`); las nuevas deben seguir ese patrón para ser
  deterministas y limpiar su estado.
- **CI en verde no cubre lo que no se prueba** → la suite se limita a lo
  verificable sin DB; el flujo real contra MySQL sigue cubriéndose con `db:seed`
  y la demostración.

## Migration Plan

1. Abrir el PR del cambio; el workflow corre para ese mismo PR.
2. Verificar en local cada paso (lint, tipos, pruebas, build) antes de subir.
3. Si el primer run falla por lint, corregir y volver a subir.
4. Rollback: revertir `.github/workflows/ci.yml` (y los scripts) no afecta el
   runtime de la aplicación.
