# Database & Media Storage foundation

Entregable para las tasks **3. Database foundation** y **4. Media storage
foundation**. Estructura pensada para pegarse directo en la raíz del repo.

## Estructura

```
src/db/pool.ts                 → 3.1
database/migrations/           → 3.2, 3.3, 3.4
database/seeds/                → 3.5
database/scripts/               → 3.6
database/full_reconstruction.sql → conveniencia (ver docs/database-schema.md)
src/storage/                    → 4.1, 4.2, 4.3, 4.4, 4.5
docs/database-schema.md         → diagrama ER + documentación de tablas y reglas
docs/openapi.yaml                → contrato del endpoint de fotos
.env.example                     → todas las variables de entorno necesarias
```

## Checklist

- [x] 3.1 `src/db/pool.ts` — pool `mysql2` con soporte local/Aiven vía `DB_SSL` + `DB_SSL_CA`
- [x] 3.2 `001_catalogs.sql` — razas y colores, incluye `Sin raza definida / Criollo`
- [x] 3.3 `002_dogs.sql` — perrito + relación de colores (principal + hasta 2 adicionales)
- [x] 3.4 `003_idempotency.sql` — clave de idempotencia (⚠️ ver nota de diseño en `docs/database-schema.md`)
- [x] 3.5 Seeds: 26 razas, 12 colores, 16 perritos de prueba con foto
- [x] 3.6 `database/scripts/` (migrate, seed, backup, restore, reset-local) — probado de punta a punta contra MariaDB local
- [x] 4.1 Interfaz de storage (`guardar`/`leer`) + selector por `STORAGE_DRIVER`
- [x] 4.2 Driver `local` con `RUTA_IMAGENES` fuera del proyecto
- [x] 4.3 Driver `s3` con `@aws-sdk/client-s3`, bucket privado
- [x] 4.4 Generación de nombre por el backend + validación de imagen real (magic bytes)
- [x] 4.5 Endpoint base que sirve fotos sin exponer carpeta/bucket (ejemplo Express para Daniel)

## Antes de hacer push

1. Instala dependencias y agrega los scripts npm — ver `database/scripts/README.md`.
2. Copia `.env.example` a `.env` y llénalo (no subas `.env` ni el `ca.pem` de Aiven al repo).
3. Corre `npm run db:reset` contra MySQL local para confirmar que todo el pipeline funciona desde cero.
4. Avisa a Daniel sobre la nota de diseño de `idempotencia` (tabla separada vs. columna en `perros`) antes de que empiece a integrar `POST /perros`.
5. Pásale `docs/openapi.yaml` a quien mantenga el spec completo del backend, para que lo mergee con el resto de endpoints.
