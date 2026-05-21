#!/bin/bash

# ==========================================
# STEM Woman Uzbekistan - Production Deploy Script
# ==========================================

set -e  # Exit on error

echo "🚀 Starting deployment..."
COMPOSE_CMD="APP_ENV_FILE=.env.production docker compose --env-file .env.production"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if .env.production exists
if [ ! -f .env.production ]; then
    echo -e "${RED}❌ Error: .env.production file not found!${NC}"
    echo "Please copy .env.production.example to .env.production and configure it."
    exit 1
fi

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Error: Docker is not installed!${NC}"
    exit 1
fi

if ! command -v docker compose &> /dev/null; then
    echo -e "${RED}❌ Error: Docker Compose is not installed!${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Environment checks passed${NC}"

# Stop existing containers
echo -e "${YELLOW}🛑 Stopping existing containers...${NC}"
APP_ENV_FILE=.env.production docker compose --env-file .env.production down || true

# Build and start services
echo -e "${YELLOW}🔨 Building Docker images...${NC}"
APP_ENV_FILE=.env.production docker compose --env-file .env.production build --no-cache

echo -e "${YELLOW}🚀 Starting services...${NC}"
APP_ENV_FILE=.env.production docker compose --env-file .env.production up -d

# Wait for services to be healthy
echo -e "${YELLOW}⏳ Waiting for services to be ready...${NC}"
sleep 10

# Check if services are running
if $COMPOSE_CMD ps | grep -q "Up"; then
    echo -e "${GREEN}✓ Services are running${NC}"
else
    echo -e "${RED}❌ Error: Services failed to start${NC}"
    $COMPOSE_CMD logs
    exit 1
fi

# Show logs
echo -e "${YELLOW}📋 Recent logs:${NC}"
$COMPOSE_CMD logs --tail=50

echo ""
echo -e "${GREEN}✅ Deployment completed successfully!${NC}"
echo ""
echo "📝 Next steps:"
echo "1. Create superuser: APP_ENV_FILE=.env.production docker compose --env-file .env.production exec backend python manage.py createsuperuser"
echo "2. Check logs: APP_ENV_FILE=.env.production docker compose --env-file .env.production logs -f"
echo "3. Access your site at: http://your-domain.com"
echo ""
echo "🔧 Useful commands:"
echo "  - View logs: APP_ENV_FILE=.env.production docker compose --env-file .env.production logs -f [service]"
echo "  - Restart: APP_ENV_FILE=.env.production docker compose --env-file .env.production restart"
echo "  - Stop: APP_ENV_FILE=.env.production docker compose --env-file .env.production down"
echo "  - Shell: APP_ENV_FILE=.env.production docker compose --env-file .env.production exec backend python manage.py shell"
echo ""
