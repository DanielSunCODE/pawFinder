## 1. Base para la verificación

- [x] 1.1 Agregar `.nvmrc` con `22` en la raíz (versión compartida por CI y local)
- [x] 1.2 Agregar `oxlint` como `devDependency` del backend y el script `lint` en `backend/package.json`
- [x] 1.3 Correr `oxlint` sobre el backend y corregir o ajustar lo necesario para que pase
- [x] 1.4 Agregar scripts en la raíz: `lint`, `typecheck`, `test`, `build` y `ci` (encadena los anteriores por workspace)

## 2. Pipeline de integración continua

- [x] 2.1 Crear `.github/workflows/ci.yml` con triggers `push`/`pull_request` a `main` y `dev`, más `workflow_dispatch`
- [x] 2.2 Configurar job `backend`: `actions/checkout`, `actions/setup-node` (node-version-file, cache npm) y `npm ci`
- [x] 2.3 Correr en el job `backend`: `lint`, `typecheck`, `test` y `build`
- [x] 2.4 Configurar job `frontend` con los mismos pasos (`lint`, `typecheck`, `test`, `build`)
- [x] 2.5 Agregar `concurrency` con `cancel-in-progress` y `permissions: contents: read`
- [x] 2.6 Verificar que el workflow no usa Docker ni service containers

## 3. Pruebas unitarias

- [x] 3.1 Pruebas unitarias del mapper funcional (`backend/src/mappers/perritoMapper.ts`): forma de la respuesta, colores principal/adicionales y campos nulos
- [x] 3.2 Pruebas unitarias del frontend para utilidades puras (transformaciones, idempotencia, formato)
- [x] 3.3 Pruebas unitarias del frontend para ubicación y reintentos
- [x] 3.4 Verificar que las unitarias no tocan base de datos ni red

## 4. Pruebas integrales del API

- [x] 4.1 Pruebas del flujo completo de registro por HTTP (multipart + `Idempotency-Key` + foto) con dobles
- [x] 4.2 Prueba explícita del doble envío: mismo identificador y `crear` no vuelve a llamarse
- [x] 4.3 Pruebas de errores entendibles (campos faltantes, color inválido, foto no-imagen) con 4xx y `error.message`
- [x] 4.4 Pruebas de foto, catálogos y estadísticas sobre el contrato `{ data }`
- [x] 4.5 Confirmar que las integrales corren sin base de datos ni Docker

## 5. Documentación

- [x] 5.1 Actualizar `README.md` con la sección de verificación automática y el comando `npm run ci`
- [x] 5.2 Actualizar `docs/development.md` con cómo corre el pipeline y qué verifica
- [x] 5.3 Mencionar en `README.md` que el pipeline corre sin Docker y sin secretos

## 6. Verificación

- [x] 6.1 `npm run ci` en local termina en verde
- [ ] 6.2 El pipeline de GitHub Actions pasa en el pull request del cambio
- [x] 6.3 `openspec validate add-ci-and-tests --strict`
