#!/usr/bin/env bash
# Respalda la base (local o Aiven) a database/backups/<nombre>_<fecha>.sql.gz
# Requiere tener instalado el cliente de mysql (mysqldump).
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Carga variables desde el .env de la raíz del proyecto si existe.
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

OUT_DIR="$SCRIPT_DIR/../backups"
mkdir -p "$OUT_DIR"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
OUT_FILE="$OUT_DIR/${DB_NAME}_${TIMESTAMP}.sql.gz"

SSL_ARGS=()
if [ "${DB_SSL:-false}" = "true" ] && [ -n "${DB_SSL_CA:-}" ]; then
  SSL_ARGS=(--ssl-ca="$DB_SSL_CA" --ssl-mode=VERIFY_CA)
fi

mysqldump -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASSWORD" "${SSL_ARGS[@]}" \
  --routines --triggers --single-transaction "$DB_NAME" | gzip > "$OUT_FILE"

echo "✅ Respaldo creado en: $OUT_FILE"
