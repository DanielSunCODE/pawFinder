# Scripts de base de datos

Requieren el cliente de MySQL (`mysqldump`) solo para `db:backup`/`db:restore`.
`db:migrate`, `db:seed` y `db:reset` son Node y funcionan igual en Windows, Linux
y macOS. Las dependencias (`mysql2`, `tsx`) ya las instala `npm install` en la raíz.

La configuración se toma de `backend/.env` (mismo archivo que usa la API); si
no existe, se usa un `.env` en la raíz.

## Comandos (desde la raíz del repositorio)

```bash
npm run db:migrate   # aplica migraciones pendientes (idempotente, usa schema_migrations)
npm run db:seed      # carga catálogos y perritos de prueba (una sola vez)
npm run db:reset     # DROP + CREATE + migrate + seed (solo contra DB_HOST local)
npm run db:backup    # respaldo a database/backups/<db>_<fecha>.sql.gz
npm run db:restore -- database/backups/archivo.sql.gz
```

`db:seed` genera además una foto PNG válida por cada perrito de prueba dentro
de `RUTA_IMAGENES` (modo local), para que el seed cumpla "con foto" sin
versionar imágenes pesadas. Si `STORAGE_DRIVER=s3`, las fotos se suben al
bucket por separado.

## Flujo normal

Requiere que la base de `DB_NAME` ya exista (estos scripts no la crean).

```bash
# 1) Crea la base si es la primera vez (cliente de MySQL):
#    CREATE DATABASE pawfinder CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
npm run db:migrate
npm run db:seed
```

## Verificar desde cero en local

```bash
npm run db:reset
```

Se niega a correr si `DB_HOST` no es `localhost`/`127.0.0.1`, para no tocar la
base de Aiven por error.

## Respaldo y restauración

```bash
npm run db:backup
npm run db:restore -- database/backups/pawfinder_20260101_120000.sql.gz
```
