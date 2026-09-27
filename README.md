# PawFinder — Registro de perritos de la calle

Aplicación para registrar perritos de la calle: quien encuentra uno le toma una
foto, le pone un nombre, anota cómo es y marca en un mapa dónde lo vio. El
registro sirve a rescatistas, vecinos y asociaciones para saber qué perros hay,
cómo identificarlos y en qué zona andan.

Está pensada **primero para celular** (se usa en la calle) y adaptada a
computadora. Los lineamientos completos de la consigna y las reglas del proyecto
están en [`MASTER_PROMPT.md`](./MASTER_PROMPT.md).

## 1. Integrantes y roles

| Integrante | Rol | Responsable de |
|---|---|---|
| Daniel Sun | **Backend** | API, validación del servidor, almacenamiento de imágenes, manejo de errores |
| Remaori | **Frontend** | Pantallas, formulario, cámara/carga de foto, mapa, validaciones del cliente |
| Aldo Badillo | **DBA** | Modelo de datos, migraciones, catálogos, datos de prueba, respaldo |

## 2. Requisitos previos (versiones)

| Herramienta | Versión | Para qué |
|---|---|---|
| Node.js | 22 LTS o superior (desarrollado con **24.14.1**) | backend y frontend |
| npm | 10 o superior (desarrollado con **11.11.0**) | dependencias y scripts |
| MySQL | **8.0.46** (o MariaDB 10.6+ compatible) | base de datos local |
| Git | cualquiera reciente | clonar y versionar |

No se necesita Docker en ningún punto (ver sección 12).

## 3. Instalación

```bash
# 1. Clonar el repositorio
git clone <URL-del-repositorio>
cd pawFinder

# 2. Instalar todas las dependencias (workspaces: backend, frontend, database)
npm install

# 3. Copiar el archivo de entorno del backend y ajustar valores
copy backend\.env.example backend\.env     # Windows
# cp backend/.env.example backend/.env     # Linux / macOS
```

## 4. Base de datos: creación, catálogos y datos de prueba

Con `backend/.env` configurado (host, usuario, contraseña, `DB_NAME`):

```bash
# Aplica las migraciones (crea tablas y catálogos base). Idempotente.
npm run db:migrate

# Carga razas, colores y 15+ perritos de prueba con foto.
npm run db:seed

# Alternativa: recrear la base local desde cero (DROP + CREATE + migrate + seed)
npm run db:reset
```

- Catálogos: **26 razas** (incluye "Sin raza definida / Criollo"), **12 colores**,
  6 colores de ojos y 18 patrones de pelaje.
- **16 perritos de prueba**; `db:seed` genera además una foto PNG válida por
  perrito dentro de `RUTA_IMAGENES`.
- Detalle del modelo y diagrama ER: [`docs/database-schema.md`](./docs/database-schema.md).

## 5. Configuración (variables de entorno)

Todas se definen en **`backend/.env`** (copiado de `backend/.env.example`). El
frontend usa `frontend/.env.local` (copiado de `frontend/.env.example`).

### Backend (`backend/.env`)

| Variable | Ejemplo | Descripción |
|---|---|---|
| `NODE_ENV` | `development` | `development`, `test` o `production`. |
| `PORT` | `3000` | Puerto del API. |
| `CORS_ORIGIN` | `http://localhost:5173` | Orígenes permitidos (separados por coma). |
| `DB_HOST` | `localhost` | Host de MySQL (local o Aiven). |
| `DB_PORT` | `3306` | Puerto de MySQL. |
| `DB_USER` | `root` | Usuario. |
| `DB_PASSWORD` | *(vacío)* | Contraseña. |
| `DB_NAME` | `pawfinder` | Nombre de la base. |
| `DB_CONNECTION_LIMIT` | `10` | Máximo de conexiones del pool. |
| `DB_SSL` | `false` | `true` para Aiven. |
| `DB_SSL_CA` | *(vacío)* | Ruta a un `.pem` **o** el PEM pegado entre comillas dobles. |
| `STORAGE_DRIVER` | `local` | `local` o `s3`. |
| `RUTA_IMAGENES` | `C:/Users/tu_usuario/pawfinder-imagenes` | Carpeta **fuera del proyecto** (modo local). |
| `IMAGE_MAX_BYTES` | `5242880` | Tamaño máximo por imagen. |
| `AWS_REGION` / `AWS_S3_BUCKET` / `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` | — | Solo si `STORAGE_DRIVER=s3`. |
| `PUBLIC_BASE_URL` | `http://localhost:3000` | URL pública del API. |
| `OPENAPI_SERVER_URL` | `http://localhost:3000` | URL que muestra Swagger UI. |

> El `.env` real nunca se sube al repositorio. La **CA de Aiven es pública**, pero
> un PEM pegado en `.env` debe ir **entre comillas dobles**; si no, solo se lee la
> primera línea.

### Frontend (`frontend/.env.local`)

| Variable | Ejemplo | Descripción |
|---|---|---|
| `VITE_API_URL` | `/api` | URL base del API vista por el navegador (proxy de Vite en dev). |
| `BACKEND_URL` | `http://localhost:3000` | Destino del proxy de Vite (solo lo lee `vite.config.ts`). |
| `VITE_USAR_MOCKS` | `false` | `true` = datos de prueba en memoria, sin backend. |
| `VITE_MAPA_CENTRO` | `19.4326,-99.1332` | Centro inicial del mapa. |
| `VITE_MAPA_ZOOM` | `13` | Zoom inicial. |
| `VITE_MAPA_MOSAICOS_URL` | *(vacío)* | Proveedor de mapas alternativo; vacío = OpenStreetMap (sin llave). |

## 6. Ejecución

```bash
# Levanta backend y frontend a la vez (una sola terminal)
npm run dev
```

Si prefieres terminales separadas:

```bash
# Backend (terminal 1)  →  http://localhost:3000   (docs en /api/docs)
npm run dev:backend

# Frontend (terminal 2) →  http://localhost:5173
npm run dev:frontend
```

- API: `http://localhost:3000`
- Documentación interactiva (Swagger UI): `http://localhost:3000/api/docs`
- OpenAPI JSON: `http://localhost:3000/api/openapi.json`
- App web: `http://localhost:5173`

## 7. Probar desde un celular en la misma red

Los navegadores solo dan **cámara y ubicación** en `https` o `localhost`. Desde
el celular no es `localhost`, así que hay un modo con HTTPS:

```bash
# Levanta el frontend con HTTPS accesible en la red local (modo "red")
npm run dev:red --workspace @pawfinder/frontend
```

1. La terminal muestra una URL tipo `https://192.168.1.50:5173/`. Ábrela en el
   celular (celular y computadora en la **misma red Wi-Fi**).
2. Acepta la advertencia del certificado autofirmado.
3. Si no carga, permite a Node.js en el firewall (redes privadas).
4. El backend puede seguir en `localhost` de la computadora: el celular solo
   habla con Vite y Vite reenvía `/api` al backend.

## 8. Endpoints de la API

| Método | Ruta | Estado | Descripción |
|---|---|---|---|
| GET | `/api/health` | ✅ | Estado del servicio. |
| GET | `/api/perritos` | ✅ | Listar/filtrar perritos (`busqueda`, `colorId`, `razaId`), resuelto en SQL. |
| GET | `/api/perritos/{id}` | ✅ | Detalle de un perrito con sus colores. |
| POST | `/api/perritos` | ✅ | Registrar perrito (multipart: `datos` + `foto`, header `Idempotency-Key`). |
| GET | `/api/perritos/{id}/foto` | ✅ | Foto del perrito servida por el backend (no expone carpeta ni bucket). |
| GET | `/api/razas` | ✅ | Catálogo de razas. |
| GET | `/api/colores` | ✅ | Catálogo de colores de pelo. |
| GET | `/api/colores-ojos` | ✅ | Catálogo de colores de ojos. |
| GET | `/api/patrones-pelaje` | ✅ | Catálogo de patrones de pelaje. |
| GET | `/api/estadisticas` | ✅ | Conteo agregado en SQL (total y perritos por color). |
| GET | `/api/openapi.json` | ✅ | Documento OpenAPI 3.1 en JSON. |
| GET | `/api/docs` | ✅ | Interfaz Swagger UI. |

Todos los endpoints están documentados y se pueden probar desde `/api/docs`.
El registro es **idempotente**: reintentar con la misma `Idempotency-Key`
devuelve el mismo perrito y no crea otro.

## 9. Capturas de pantalla

> _Pendiente: agregar capturas desde celular del mapa, la lista, el detalle y el
> formulario (con cámara, pin y errores de validación)._

## 10. Problemas comunes

| Síntoma | Causa / solución |
|---|---|
| `Configuracion de entorno invalida o incompleta: DB_USER` | Falta definir variables en `backend/.env`. |
| `Access denied for user ...` | Usuario/contraseña de MySQL incorrectos en `backend/.env`. |
| `DB_SSL=true requiere DB_SSL_CA` | Define `DB_SSL_CA` (ruta o PEM entre comillas). |
| Error de conexión TLS con Aiven | El PEM quedó truncado: envuélvelo en comillas dobles o usa una ruta. |
| `RUTA_IMAGENES es obligatoria` | Define `RUTA_IMAGENES` con una carpeta fuera del proyecto. |
| "No pudimos conectar con el servidor" (frontend) | El backend no está corriendo o `BACKEND_URL` está mal. |
| La ubicación/cámara no funciona en el celular | Abre la app por HTTPS (`npm run dev:red`), no por `http://IP`. |
| El mapa se ve gris | Sin internet o la red bloquea `tile.openstreetmap.org`. |
| `db:seed` falla por `ruta_imagen` duplicada | Ya se sembró: usa `npm run db:reset`. |
| `db:reset` se cancela | `DB_HOST` no es local; es una protección para no tocar Aiven. |

## 11. Paradigmas

El proyecto mezcla a propósito varios paradigmas. La ubicación concreta del
código está en [`docs/architecture.md`](./docs/architecture.md); el resumen:

- **Declarativo** — SQL en `database/migrations/` y `database/seeds/`, y las
  consultas del API en `backend/src/repositories/perritosRepository.ts` (JOIN de
  perrito + raza + colores, y `GROUP BY` para las estadísticas), además de la
  interfaz (HTML/CSS + JSX que describen *qué* se ve). El filtrado, ordenamiento
  y agregación viven en SQL; **no** se traen todos los registros para filtrarlos
  con un ciclo.
- **Imperativo** — arranque y orquestación en `backend/src/app.ts` y
  `backend/src/index.ts`; manejadores de eventos y efectos en el frontend.
- **Orientado a objetos** — la abstracción `StorageDriver` con sus drivers
  (`backend/src/storage/`), la clase `ErrorApi` (`frontend/src/api/errores.ts`) y
  los componentes y la clase `HttpError` del backend (`backend/src/middleware/errorHandler.ts`).
- **Funcional** — el mapper de perritos
  (`backend/src/mappers/perritoMapper.ts`) separa el color principal de los
  adicionales con `find`/`filter`/`map` y el repositorio agrupa las filas del
  JOIN con `reduce` (`backend/src/repositories/perritosRepository.ts`), sin mutar
  la entrada ni usar ciclos explícitos; en el frontend, la query string en
  `frontend/src/api/http.ts`. Se ampliará con más mappers en el cambio de dominio.

### Idempotencia del registro

- El formulario **genera una clave de idempotencia (UUID) al abrirse** y la envía
  en el encabezado `Idempotency-Key`.
- La tabla **`idempotencia`** (`database/migrations/003_idempotency.sql`) guarda
  `idempotency_key` como clave primaria → `id_perro`.
- Ante un doble envío, el backend **devuelve el mismo `id` y el mismo resultado**
  (no crea otro perrito y **no** responde "error: duplicado"). Si dos envíos
  concurrentes comparten clave, el `UNIQUE` resuelve la carrera y se devuelve el
  registro existente.
- La prueba del doble envío está en `backend/tests/perritos.test.ts`.

## 12. Despliegue (punto extra)

Detalle completo en [`docs/deployment.md`](./docs/deployment.md). Resumen:

- **Dónde corre cada pieza:** app web en **Vercel**, API en **Render**, MySQL en
  **Aiven**, imágenes en **AWS S3** (bucket privado). Las imágenes **no** viven
  junto al código.
- **HTTPS:** Vercel y Render entregan HTTPS y dominio automáticamente (necesario
  para cámara y ubicación).
- **Local vs producción:** mismas variables, distintos valores (`DB_*` hacia
  Aiven con `DB_SSL=true`, `STORAGE_DRIVER=s3`, `CORS_ORIGIN` con el dominio del
  frontend, `PUBLIC_BASE_URL`/`OPENAPI_SERVER_URL` con la URL de Render). Las
  contraseñas se guardan en el panel de variables de cada servicio, nunca en el repo.
- **Puertos:** solo el 443/80 de los servicios públicos; **la base de datos no se
  expone** a internet.
- **Bucket S3:** guía paso a paso con **AWS CLI** (instalación, credenciales,
  crear bucket privado, usuario IAM con permiso mínimo y verificación) en
  [`docs/deployment.md`](./docs/deployment.md) §5.
- **Respaldos:** `mysqldump` para la base y copia del bucket/`RUTA_IMAGENES` para
  las imágenes (ver `docs/deployment.md`).
- **Sin Docker:** si se auto-hospeda, instalación directa con un servicio
  (`systemd`) y un proxy inverso (nginx/Caddy) al frente.
- **URL pública:** _pendiente_ (se agrega aquí al publicar).

## 13. Estructura del repositorio

```
frontend/   App web (React + Vite + TypeScript). Ver frontend/README.md
backend/    API REST (Node + Express + TypeScript). Ver backend/README.md
database/   Migraciones, seeds y scripts SQL
docs/       Arquitectura, esquema de BD y despliegue
openspec/   Especificaciones y cambios (spec-driven)
```

## 14. Pruebas

```bash
npm run test:backend          # suite del backend (Vitest + Supertest)
npm run db:typecheck          # tipos de los scripts de base de datos
# Desde frontend/: npm test   # suite del frontend
```
