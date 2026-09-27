## Context

El repositorio es greenfield: solo contiene la consigna (`proyecto1-perritos.pdf`), OpenSpec y la configuración del flujo. Ver `proposal.md` para la motivación. Las restricciones que moldean esta base son: sin Docker, instalación reproducible en máquina limpia, cámara/ubicación solo bajo contexto seguro, imágenes fuera del código, base de datos no expuesta, y despliegue en Vercel + Render + Aiven + S3 para el punto extra.

Este documento fija las decisiones técnicas de la base (fase de inicialización). El dominio (registro, mapa, idempotencia funcional) se especificará en cambios posteriores, pero la estructura y los contratos aquí definidos son los que esos cambios reutilizarán.

## Goals / Non-Goals

**Goals:**
- Dejar un esqueleto ejecutable end-to-end: `npm install` en la raíz, levantar backend y frontend, endpoint de salud respondiendo y base creada con catálogos.
- Fijar contratos transversales: variables de entorno, forma de respuestas/errores, abstracción de storage y modo de conexión a MySQL.
- Dejar el README y la guía de desarrollo listos para completarse por rol.

**Non-Goals:**
- No implementar la lógica de negocio (registro de perritos, validaciones de dominio, mapa con pines, cámara, idempotencia funcional) en este cambio.
- No publicar todavía en Vercel/Render/Aiven (solo dejar la configuración y la documentación preparadas).
- No definir autenticación ni usuarios (fuera de alcance del proyecto base).

## Decisions

### Estructura: monorepo con npm workspaces
Tres paquetes independientes (`frontend/`, `backend/`, `database/`) coordinados por el `package.json` raíz.

```
pawFinder/
├── README.md
├── .gitignore
├── .editorconfig
├── package.json                 # workspaces + scripts de arranque
├── docs/
│   ├── development.md           # inicio rápido + flujo Git
│   ├── architecture.md          # diagrama, stack y paradigmas
│   └── deployment.md            # borrador de la sección de despliegue
├── frontend/
│   ├── package.json  vite.config.ts  tsconfig.json  index.html  .env.example
│   └── src/
│       ├── main.tsx  App.tsx  router.tsx
│       ├── api/client.ts
│       ├── pages/{RegisterPage,ListPage,MapPage,DetailPage}.tsx
│       └── styles/
├── backend/
│   ├── package.json  tsconfig.json  .env.example
│   └── src/
│       ├── index.ts             # arranque del servidor
│       ├── app.ts               # instancia de Express
│       ├── config/env.ts        # carga y validación de entorno
│       ├── middleware/{errorHandler,validate,cors}.ts
│       ├── routes/{health,index}.ts
│       ├── storage/{index,local,s3}.ts
│       └── db/pool.ts
├── database/
│   ├── migrations/{001_catalogs.sql,002_dogs.sql,003_idempotency.sql}
│   ├── seeds/{001_breeds.sql,002_colors.sql,003_test_dogs.sql}
│   └── scripts/{migrate,seed,backup,restore}
└── openspec/
```

**Alternativas consideradas:** carpetas separadas sin workspaces (más fricción para scripts raíz); monorepo con Turborepo/Nx (sobre-ingeniería para 3 paquetes).

### Stack y versiones
| Capa | Tecnología | Versión objetivo |
|---|---|---|
| Runtime | Node.js | 20 LTS |
| Gestor | npm (workspaces) | 10.x |
| Frontend | React + Vite + TypeScript | React 18, Vite 5, TS 5 |
| Ruteo | React Router | 6.x |
| Datos remotos | TanStack Query | 5.x |
| Mapas | Leaflet + react-leaflet + OpenStreetMap | Leaflet 1.9 |
| Estilos | Tailwind CSS | 3.x |
| Backend | Express + TypeScript | Express 4, TS 5 |
| Datos | mysql2 (SQL crudo) | 3.x |
| Validación | Zod | 3.x |
| Upload/imagen | Multer + sharp | últimas estables |
| Storage | @aws-sdk/client-s3 | v3 |
| Pruebas | Vitest + Supertest | últimas estables |
| BD | MySQL | 8.x (local y Aiven) |

**Decisión SQL crudo sobre ORM (Prisma/Sequelize):** la rúbrica exige demostrar filtrado, ordenamiento y agregación en SQL declarativo, con JOIN y agregación visibles. Un ORM oculta esa evidencia. Se usa `mysql2` con consultas explícitas y migraciones SQL versionadas.

### Doble modo de base de datos
`backend/src/db/pool.ts` crea el pool a partir de variables de entorno. En local apunta a MySQL/MariaDB local; en producción apunta a Aiven con `DB_SSL=true` y el CA provisto. La misma migración y seeds corren contra ambos. La base no se expone: en Aiven se restringe el acceso y en despliegues con servidor propio el puerto queda cerrado a internet.

**Alternativas consideradas:** solo Aiven (rompe la instalación en vivo); solo local (pierde el punto extra).

### Abstracción de almacenamiento (`local` | `s3`)
Interfaz común en `backend/src/storage/index.ts` con métodos `guardar(archivo)` y `leer(referencia)`. El driver se elige por `STORAGE_DRIVER`.

- `local`: escribe bajo `RUTA_IMAGENES` (fuera del repo), crea el directorio si no existe y explica su creación en el README.
- `s3`: escribe en un bucket privado y lee por streaming.

El nombre del archivo lo genera el backend (UUID + extensión validada). La validación de imagen real se hace inspeccionando el contenido (firmas/magic bytes, por ejemplo vía `sharp.metadata()`), no la extensión. Formato permitido: JPG, PNG, WEBP. El endpoint que sirve las fotos pasa siempre por el backend, nunca expone la carpeta ni el bucket.

**Alternativas consideradas:** guardar imágenes en disco junto al código (viola la consigna); solo S3 (rompe la instalación en vivo sin credenciales AWS).

### Contrato de respuestas y errores
Éxito: `{ "data": ... }`. Error: `{ "error": { "message": "...", "details": [...] } }` con código HTTP correcto y mensaje entendible (por ejemplo `"Falta la foto"`), nunca un identificador crudo. Un middleware `errorHandler` captura excepciones no controladas, las registra internamente y responde genérico. La validación de entrada con Zod devuelve mensajes por campo.

### CORS y configuración
`CORS_ORIGIN` es una lista separada por comas. En producción solo el dominio del frontend en Vercel; en local el servidor de Vite. Los secretos viven en las variables de entorno de Vercel/Render (nunca en el repo); cada paquete aporta `.env.example`.

Variables del backend: `NODE_ENV`, `PORT`, `CORS_ORIGIN`, `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_SSL`, `DB_SSL_CA`, `STORAGE_DRIVER`, `RUTA_IMAGENES`, `IMAGE_MAX_BYTES`, `AWS_REGION`, `AWS_S3_BUCKET`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `PUBLIC_BASE_URL`.
Variables del frontend: `VITE_API_URL`, `VITE_MAP_TILE_URL` (opcional).

### Contexto seguro para cámara y ubicación
En producción Vercel entrega HTTPS. En local, `localhost` es contexto seguro. Para probar desde un celular en la misma red se documentan dos vías: servidor Vite con HTTPS (certificado de desarrollo) o un túnel HTTPS (Cloudflare Tunnel/ngrok). El README debe explicarlo; el código no cambia.

### Idempotencia (diseño de la base, implementación en cambio posterior)
El formulario genera una clave de idempotencia (UUID) al abrirse y la envía en el encabezado `Idempotency-Key`. La tabla `dogs` incluye `idempotency_key VARCHAR(64) NOT NULL UNIQUE`. Al recibir un POST: si la clave ya existe, el backend devuelve el registro original con el mismo identificador y el mismo cuerpo (sin crear uno nuevo); si no existe, inserta. Las carreras de reintentos se resuelven capturando el error de clave duplicada y recuperando el registro existente. Esta base solo crea la estructura (migración `003_idempotency.sql`); la lógica se implementará en el cambio de dominio.

### Paradigmas y su ubicación
- **Declarativo:** SQL en `database/migrations` y `database/seeds`, y las consultas del API (JOIN y agregación); HTML/CSS del frontend.
- **Imperativo:** orquestación en `backend/src/routes` y `app.ts`; manejadores de eventos y efectos en el frontend.
- **Orientado a objetos:** la abstracción `Storage` y los servicios del backend; componentes React.
- **Funcional:** mapeos puros con `map`/`filter`/`reduce` sin mutación (por ejemplo `src/mappers/`), hooks puros de React. El README señalará el caso concreto.

### Pruebas
Vitest en ambos paquetes; Supertest para el API. La base incluye pruebas del endpoint de salud y del validador de configuración. La prueba de doble envío (idempotencia) se agregará en el cambio de dominio.

## Risks / Trade-offs

- **Render free tier tiene cold start** → documentar la latencia esperada y opcionalmente un ping de mantenimiento; no afecta la corrección.
- **Aiven exige TLS y restringe IP; Render free no tiene IP estática** → usar `DB_SSL=true` con el CA y documentar la configuración de acceso; alternativa: proxy.
- **cámara/ubicación no funcionan sin contexto seguro** → Vercel da HTTPS; para celular en red local se documenta HTTPS en Vite o túnel.
- **S3 en la instalación en vivo no está disponible sin credenciales** → el driver por defecto en local es `local` con `RUTA_IMAGENES`.
- **Idempotencia con reintentos concurrentes** → restricción `UNIQUE` + captura de duplicado, no un chequeo previo sin transacción.
- **Diferencias local vs Aiven** → MySQL 8 en ambos y migraciones SQL portables; evitar features exclusivas de un proveedor.

## Migration Plan

Proyecto nuevo, sin datos existentes. Puesta en marcha:
1. Crear la estructura y los `package.json` con workspaces; `.gitignore` y `.env.example`.
2. Andamiaje de backend y frontend ejecutables; endpoint de salud y arranque de Vite.
3. Migraciones y seeds de `database/`; verificar creación en una base local.
4. Abstracción de storage con driver `local`; dejar `s3` listo y desactivado por defecto.
5. README y guía de desarrollo con placeholders de endpoints, paradigmas y despliegue.
6. Rollback: al ser inicialización, revertir el commit/PR elimina la base sin afectar datos.

## Open Questions

- Proveedor de túnel para el punto extra (Cloudflare Tunnel, ngrok o Tailscale) y su URL pública, a decidir antes de la demostración.
- Plan de Aiven (free) y su política de IP/SSL definitiva, a confirmar al desplegar.
- Nombre definitivo de la aplicación, a confirmar al redactar el README.
