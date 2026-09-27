# Scripts de base de datos

Requieren `ts-node` (o `tsx`) y `mysql2` instalados en el proyecto:

```bash
npm install mysql2 dotenv
npm install -D typescript ts-node @types/node
npm install file-type          # para src/storage/validateImage.ts
npm install @aws-sdk/client-s3 # solo si van a usar STORAGE_DRIVER=s3
```

Agrega esto a `package.json` (ajusta `ts-node` por `tsx` si lo prefieren):

```json
{
  "scripts": {
    "db:migrate": "ts-node database/scripts/migrate.ts",
    "db:seed": "ts-node database/scripts/seed.ts",
    "db:reset": "bash database/scripts/reset-local.sh",
    "db:backup": "bash database/scripts/backup.sh",
    "db:restore": "bash database/scripts/restore.sh"
  }
}
```

Dale permisos de ejecución a los .sh una sola vez:

```bash
chmod +x database/scripts/*.sh
```

## Flujo normal

```bash
npm run db:migrate   # aplica migraciones pendientes (idempotente)
npm run db:seed       # siembra catálogos y perritos de prueba (una sola vez)
```

## Verificar desde cero en local (task 3.6)

```bash
npm run db:reset      # DROP + CREATE + migrate + seed, solo contra DB_HOST local
```

## Respaldo y restauración

```bash
npm run db:backup
npm run db:restore -- database/backups/perritos_db_20260101_120000.sql.gz
```
