#!/bin/bash

# ==========================================
# STEM Woman Uzbekistan - Database Backup Script
# ==========================================
# Uses DATABASE_USER / DATABASE_NAME from .env.production (same as docker-compose).

set -e

BACKUP_DIR="./backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="stem_backup_${TIMESTAMP}.sql"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

if [ ! -f .env.production ]; then
  echo -e "${RED}❌ .env.production not found${NC}"
  exit 1
fi

# shellcheck disable=SC1091
set -a
# shellcheck disable=SC1090
source ./.env.production
set +a

DATABASE_USER="${DATABASE_USER:-stem}"
DATABASE_NAME="${DATABASE_NAME:-stem}"

echo -e "${YELLOW}📦 Starting database backup (user=${DATABASE_USER}, db=${DATABASE_NAME})...${NC}"

mkdir -p "$BACKUP_DIR"

docker compose --env-file .env.production exec -T db pg_dump \
  -U "$DATABASE_USER" \
  -d "$DATABASE_NAME" \
  > "${BACKUP_DIR}/${BACKUP_FILE}"

gzip "${BACKUP_DIR}/${BACKUP_FILE}"

echo -e "${GREEN}✅ Backup completed: ${BACKUP_DIR}/${BACKUP_FILE}.gz${NC}"

echo -e "${YELLOW}🧹 Cleaning old backups (keeping last 7)...${NC}"
cd "$BACKUP_DIR"
ls -t stem_backup_*.sql.gz 2>/dev/null | tail -n +8 | xargs -r rm --
cd ..

echo -e "${GREEN}✅ Backup process finished${NC}"
