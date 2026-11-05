#!/bin/sh
# Arranque del backend en Docker:
#   1. aplica las migraciones (idempotente: omite las ya aplicadas);
#   2. carga catálogos y perritos de prueba SÓLO si la base está vacía
#      (el seed de perritos no se puede repetir: ruta_imagen es UNIQUE);
#   3. abre el servidor.
set -e
cd /app

echo "Aplicando migraciones…"
npx --no-install tsx database/scripts/migrate.ts

TOTAL=$(node --input-type=module -e "
import mysql from 'mysql2/promise'
const c = await mysql.createConnection({
  host: process.env.DB_HOST, port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER, password: process.env.DB_PASSWORD, database: process.env.DB_NAME,
})
const [filas] = await c.query('SELECT COUNT(*) AS n FROM perros')
console.log(filas[0].n)
await c.end()
")

if [ "$TOTAL" = "0" ] && [ "${SEED_AL_ARRANCAR:-true}" = "true" ]; then
  echo "Base vacía: cargando datos de prueba…"
  npx --no-install tsx database/scripts/seed.ts
else
  echo "La base ya tiene $TOTAL perritos (o SEED_AL_ARRANCAR=false): no se siembra."
fi

cd /app/backend
exec node dist/index.js
