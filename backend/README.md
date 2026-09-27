# Backend — PawFinder API

API REST del registro de perritos de la calle. Node + Express + TypeScript, con validación por Zod y documentación OpenAPI generada desde esos mismos esquemas.

## Requisitos

- Node.js 22 LTS o superior (`node -v`).
- npm 10 o superior.
- MySQL 8 local o Aiven (ver `../database`). El backend arranca sin base de datos, pero la conexión se configura por variables de entorno.

## Instalación y ejecución

```bash
# Desde la raíz del repositorio
npm install

# Copiar el ejemplo de entorno y ajustar valores
copy backend\.env.example backend\.env   # Windows (o: cp en Linux/macOS)

# Levantar en desarrollo (recarga al guardar)
npm run dev:backend

# O directamente en el paquete
npm run dev --workspace @pawfinder/backend
```

El servidor escucha en `http://localhost:3000` (configurable con `PORT`).

## Variables de entorno

Todas se definen en `backend/.env`. Ver `backend/.env.example` para el listado completo.

| Variable | Ejemplo | Descripción |
|---|---|---|
| `NODE_ENV` | `development` | Entorno (`development`, `test`, `production`). |
| `PORT` | `3000` | Puerto del servidor. |
| `CORS_ORIGIN` | `http://localhost:5173` | Orígenes permitidos, separados por coma. |
| `DB_HOST` / `DB_PORT` / `DB_USER` / `DB_PASSWORD` / `DB_NAME` | — | Conexión a MySQL. |
| `DB_CONNECTION_LIMIT` | `10` | Máximo de conexiones del pool. |
| `DB_SSL` / `DB_SSL_CA` | `false` / — | TLS para Aiven. `DB_SSL_CA` acepta la ruta a un `.pem` o el PEM pegado entre comillas dobles. |
| `STORAGE_DRIVER` | `local` | `local` o `s3`. |
| `RUTA_IMAGENES` | `C:/Users/tu_usuario/pawfinder-imagenes` | Directorio fuera del proyecto (modo local). |
| `IMAGE_MAX_BYTES` | `5242880` | Tamaño máximo por imagen (subida). |
| `IMAGE_MAX_DIMENSION` | `1600` | Lado mayor al que se reescala la foto. |
| `IMAGE_QUALITY` | `80` | Calidad (1–100) de la imagen comprimida. |
| `IMAGE_OUTPUT_FORMAT` | `webp` | `webp` o `jpeg`: formato de salida comprimido. |
| `AWS_*` | — | Credenciales S3 (solo si `STORAGE_DRIVER=s3`). |
| `PUBLIC_BASE_URL` | `http://localhost:3000` | URL pública del backend. |
| `OPENAPI_SERVER_URL` | `http://localhost:3000` | URL que Swagger UI muestra como servidor del API. |

## Endpoints

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/health` | Estado del servicio. |
| GET | `/api/perritos` | Listar/filtrar perritos (`busqueda`, `colorId`, `razaId`). |
| GET | `/api/perritos/{id}` | Detalle de un perrito con sus colores. |
| POST | `/api/perritos` | Registrar perrito (multipart `datos` + `foto`, header `Idempotency-Key`). |
| GET | `/api/perritos/{id}/foto` | Foto del perrito, servida por el backend (nunca expone carpeta ni bucket). |
| GET | `/api/razas` | Catálogo de razas. |
| GET | `/api/colores` | Catálogo de colores de pelo. |
| GET | `/api/colores-ojos` | Catálogo de colores de ojos. |
| GET | `/api/patrones-pelaje` | Catálogo de patrones de pelaje. |
| GET | `/api/estadisticas` | Conteo agregado en SQL (total y por color). |
| GET | `/api/openapi.json` | Documento OpenAPI 3.1 en JSON. |
| GET | `/api/docs` | Interfaz Swagger UI para explorar y probar los endpoints. |

`/api/docs` y `/api/openapi.json` están disponibles en todos los entornos (local y producción).

## Base de datos y almacenamiento

La conexión y el storage se configuran por variables de entorno. Desde la raíz:

```bash
npm run db:migrate   # crea/actualiza el esquema
npm run db:seed      # carga catálogos y perritos de prueba
npm run db:reset     # recrea la base local desde cero
```

El endpoint de fotos lee `ruta_imagen` de la base y la resuelve con el driver
activo (`local` con `RUTA_IMAGENES`, o `s3`). Ver `../docs/database-schema.md`.

## Documentación de endpoints

- **Swagger UI:** abrir `http://localhost:3000/api/docs`.
- **JSON OpenAPI:** `http://localhost:3000/api/openapi.json` (para herramientas y validadores).
- **Cómo mantenerla al día:** ver [`AGENTS.md`](./AGENTS.md). Toda alta, cambio o baja de endpoint debe actualizar su esquema Zod y su registro OpenAPI en el mismo cambio.

## Pruebas

```bash
npm run test --workspace @pawfinder/backend
```
