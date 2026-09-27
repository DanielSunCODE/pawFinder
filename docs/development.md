# Guía de desarrollo

Cómo trabajar en PawFinder sin romper la instalación de nadie y siguiendo las
reglas de la consigna (ver [`../MASTER_PROMPT.md`](../MASTER_PROMPT.md)).

## Inicio rápido

```bash
npm install
copy backend\.env.example backend\.env     # ajustar DB y RUTA_IMAGENES
npm run db:migrate
npm run db:seed

npm run dev            # backend (http://localhost:3000) + frontend (http://localhost:5173)
```

También puedes levantarlos por separado con `npm run dev:backend` y
`npm run dev:frontend`.

## Verificación automática (CI y pruebas)

El pipeline de **GitHub Actions** (`.github/workflows/ci.yml`) corre en cada
`push` y `pull request` a `main`/`dev`: instala con `npm ci` y ejecuta, para
backend y frontend, `lint`, `typecheck`, `test` y `build`. Corre directo en el
runner con `actions/setup-node` (versión de `.nvmrc`), **sin Docker ni
secretos**: las pruebas usan dobles y no tocan base de datos ni red.

Antes de subir un cambio, corre el mismo conjunto en local:

```bash
npm run ci        # lint + tipos + pruebas + build (ambos paquetes)
```

Por separado: `npm run lint`, `npm run typecheck`, `npm run test` y
`npm run build`.

- **Unitarias:** `backend/tests/*.test.ts` y `frontend/src/**/*.test.ts`.
- **Integrales del API:** `backend/tests/perritos.test.ts` con Supertest sobre
  `createApp` y repositorio/almacenamiento simulados.
- **Versión de Node:** `.nvmrc` (22), compartida por CI y por el campo `engines`.

## Estructura y responsabilidades

| Carpeta | Rol | Comandos |
|---|---|---|
| `frontend/` | Frontend | `npm run dev:frontend` |
| `backend/` | Backend | `npm run dev:backend`, `npm run test:backend` |
| `database/` | DBA | `npm run db:migrate`, `db:seed`, `db:reset`, `db:backup`, `db:restore` |
| `docs/` | Todos | documentación |

## Flujo de ramas y pull requests

- `main` es la **entrega**: se califica el último commit de `main` antes de la
  fecha límite. No se empuja directo a `main`.
- `dev` es la rama de integración.
- Cada rol trabaja en su rama: `backend`, `frontend`, `database` (o ramas
  descriptivas por cambio, p. ej. `feat/post-perritos`).
- **Cada pull request lo revisa otro integrante** antes de fusionar. Debe haber
  **al menos un PR revisado por otro integrante por cada rol**.
- Integrar con `dev` y, cuando esté estable, fusionar `dev` → `main`.

```bash
git switch -c feat/mi-cambio
# ...trabajar...
git add <archivos>
git commit -m "feat(backend): describir el cambio"
git push -u origin feat/mi-cambio
# abrir el pull request y pedir revisión
```

## Convención de commits

Mensajes que digan **qué cambió**; "cambios", "ya quedó" y "asdf" no son
mensajes. Se usa el estilo Conventional Commits:

```
<tipo>(<alcance>): <descripción en imperativo>

cuerpo opcional (por qué, no cómo)
```

Tipos: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`, `perf`.
Alcances: `backend`, `frontend`, `database`, `docs`, `openspec`.

Ejemplos:

- `feat(backend): registrar perrito con idempotencia`
- `fix(database): permitir campos extra nulos en perros`
- `docs(readme): agregar lista de endpoints`

## Secretos y archivos que NO se versionan

- `.env` / `.env.local` (reales) — solo se versionan los `.env.example`.
- Certificados: `backend/certs/` y `*.pem` (la CA de Aiven es pública, pero no se
  sube).
- `node_modules/`, `dist/`, `database/backups/`, y las fotos de prueba pesadas.
- Llaves de API (por ejemplo, de un proveedor de mapas): nunca en el repo; van en
  variables de entorno y el README explica cómo obtenerlas.

Antes de cada commit:

```bash
git status              # revisar qué se va a subir
git diff --staged       # revisar el contenido
```

## Reglas de código

- **Validación doble:** cada campo obligatorio se valida en el frontend y en el
  backend. El backend no confía en el cliente.
- **SQL declarativo:** filtrar, ordenar y agrupar en SQL. Nunca traer todo y
  filtrar con un ciclo. Mantener al menos un JOIN y una agregación.
- **Funcional:** al menos una transformación con `map`/`filter`/`reduce`, sin
  mutar y sin ciclos explícitos.
- **Idempotencia:** el doble envío devuelve el mismo id y el mismo resultado.
- **Imágenes:** fuera del código, nombre generado por el backend, validación por
  contenido (magic bytes), servidas por el backend.
- **Sin Docker:** no agregar `Dockerfile` ni `docker-compose.yml`.

## Agregar o cambiar un endpoint (backend)

Obligatorio, en el mismo cambio (ver [`../backend/AGENTS.md`](../backend/AGENTS.md)):

1. Definir/actualizar el esquema **Zod**.
2. Validar la entrada con ese esquema.
3. Registrar el endpoint en `backend/src/docs/openapi.ts`.
4. Correr las pruebas (`/api/openapi.json` debe seguir válido).

## Pruebas y verificación

```bash
npm run test:backend                 # backend (Vitest + Supertest)
npm run typecheck --workspace @pawfinder/backend
npm run db:typecheck                 # scripts de base de datos
# frontend:
npm run typecheck --workspace @pawfinder/frontend
npm run build --workspace @pawfinder/frontend
npm run test --workspace @pawfinder/frontend
```

## Cambios guiados por specs (OpenSpec)

El proyecto usa OpenSpec. Para un cambio con impacto en comportamiento:

```bash
openspec new change "mi-cambio"
openspec status --change "mi-cambio" --json
openspec validate "mi-cambio" --strict
```

Las specs viven en `openspec/specs/` y los cambios en `openspec/changes/`.
Si una spec contradice el `MASTER_PROMPT.md`, gana el MASTER_PROMPT (o se corrige
la spec).
