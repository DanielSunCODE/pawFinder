#!/usr/bin/env bash
# Recrea la base LOCAL desde cero (drop + create), corre migraciones y
# seeds. Esto es lo que usas para "verificar la creación desde cero en
# una base local" (task 3.6). Se niega a correr si DB_HOST no es local,
# para no arriesgarte a tronar la base de Aiven por error.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"

if [ -f "$ROOT_DIR/.env" ]; then
  set -a
  source "$ROOT_DIR/.env"
  set +a
fi

: "${DB_HOST:?Falta DB_HOST}"
: "${DB_PORT:=3306}"
: "${DB_USER:?Falta DB_USER}"
: "${DB_PASSWORD:?Falta DB_PASSWORD}"
: "${DB_NAME:?Falta DB_NAME}"

if [ "$DB_HOST" != "localhost" ] && [ "$DB_HOST" != "127.0.0.1" ]; then
  echo "⚠️  DB_HOST no es local ($DB_HOST). Este script solo debe usarse contra MySQL local. Abortando."
  exit 1
fi

mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASSWORD" -e \
  "DROP DATABASE IF EXISTS \`$DB_NAME\`; CREATE DATABASE \`$DB_NAME\` CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;"

cd "$ROOT_DIR"
npm run db:migrate
npm run db:seed

echo "✅ Base de datos local recreada desde cero, migrada y sembrada."
