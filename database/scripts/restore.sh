#!/usr/bin/env bash
# Uso: ./restore.sh database/backups/perritos_db_20260101_120000.sql.gz
set -euo pipefail

if [ $# -ne 1 ]; then
  echo "Uso: $0 <ruta-al-archivo .sql.gz>"
  exit 1
fi

BACKUP_FILE="$1"
if [ ! -f "$BACKUP_FILE" ]; then
  echo "❌ No existe el archivo: $BACKUP_FILE"
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Carga variables desde backend/.env (con .env en la raíz como respaldo).
ENV_FILE="$ROOT_DIR/backend/.env"
[ -f "$ENV_FILE" ] || ENV_FILE="$ROOT_DIR/.env"
if [ -f "$ENV_FILE" ]; then
  set -a
  source "$ENV_FILE"
  set +a
fi

: "${DB_HOST:?Falta DB_HOST}"
: "${DB_PORT:=3306}"
: "${DB_USER:?Falta DB_USER}"
: "${DB_PASSWORD:?Falta DB_PASSWORD}"
: "${DB_NAME:?Falta DB_NAME}"

SSL_ARGS=()
if [ "${DB_SSL:-false}" = "true" ] && [ -n "${DB_SSL_CA:-}" ]; then
  SSL_ARGS=(--ssl-ca="$DB_SSL_CA" --ssl-mode=VERIFY_CA)
fi

echo "⚠️  Esto va a SOBRESCRIBIR la base '$DB_NAME' en $DB_HOST con el contenido de $BACKUP_FILE"
read -p "¿Continuar? (escribe 'si' para confirmar): " CONFIRM
if [ "$CONFIRM" != "si" ]; then
  echo "Cancelado."
  exit 0
fi

gunzip -c "$BACKUP_FILE" | mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASSWORD" "${SSL_ARGS[@]}" "$DB_NAME"

echo "✅ Restauración completa."
