#!/bin/bash

# ==========================================
# STEM Women Uzbekistan - Database Backup Script
# ==========================================

set -e

BACKUP_DIR="./backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="stem_backup_${TIMESTAMP}.sql"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}📦 Starting database backup...${NC}"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Backup database
docker compose --env-file .env.production exec -T db pg_dump \
    -U stem_user \
    -d stem_production \
    > "${BACKUP_DIR}/${BACKUP_FILE}"

# Compress backup
gzip "${BACKUP_DIR}/${BACKUP_FILE}"

echo -e "${GREEN}✅ Backup completed: ${BACKUP_DIR}/${BACKUP_FILE}.gz${NC}"

# Keep only last 7 backups
echo -e "${YELLOW}🧹 Cleaning old backups (keeping last 7)...${NC}"
cd "$BACKUP_DIR"
ls -t stem_backup_*.sql.gz | tail -n +8 | xargs -r rm --
cd ..

echo -e "${GREEN}✅ Backup process finished${NC}"
