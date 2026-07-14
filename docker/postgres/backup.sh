#!/bin/sh
# Ежедневный backup базы данных PostgreSQL GUTSHOT Poker Club.
# Использование: устанавливается по cron внутри контейнера или на хосте.

set -e

BACKUP_DIR="${BACKUP_DIR:-./docker/postgres/backups}"
TIMESTAMP=$(date +%Y-%m-%d_%H-%M-%S)
FILENAME="gutshot_${TIMESTAMP}.sql.gz"

mkdir -p "$BACKUP_DIR"

pg_dump "$DATABASE_URL" | gzip > "${BACKUP_DIR}/${FILENAME}"

# Хранить только последние 14 дней резервных копий
find "$BACKUP_DIR" -name "gutshot_*.sql.gz" -mtime +14 -delete

echo "Backup завершен: ${BACKUP_DIR}/${FILENAME}"
