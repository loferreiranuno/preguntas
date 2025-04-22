#!/bin/bash

# Set colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Starting production deployment...${NC}"

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}❌ This script must be run as root${NC}"
    exit 1
fi

# Environment setup
export COMPOSE_FILE=docker-compose.prod.yml
ACME_PATH="./acme.json"

# Error handling
set -e

# Function to handle errors
handle_error() {
    echo -e "${RED}❌ Error occurred on line $1${NC}"
    exit 1
}

trap 'handle_error $LINENO' ERR

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check for required commands
for cmd in docker docker-compose; do
    if ! command_exists "$cmd"; then
        echo -e "${RED}❌ $cmd is required but not installed.${NC}"
        exit 1
    fi
done

# Remove existing acme.json if it exists and create a new one
echo -e "${YELLOW}📄 Setting up acme.json...${NC}"
rm -f "$ACME_PATH"
touch "$ACME_PATH"
chmod 600 "$ACME_PATH"
echo -e "${GREEN}✅ Created fresh acme.json with proper permissions${NC}"

# Create traefik network
echo -e "${YELLOW}🌐 Setting up Docker network...${NC}"
if ! docker network inspect traefik-public >/dev/null 2>&1; then
    docker network create traefik-public
    echo -e "${GREEN}✅ Created traefik-public network${NC}"
else
    echo -e "${YELLOW}ℹ️ Network traefik-public already exists${NC}"
fi

# Stop and remove all containers and traefik volumes
echo -e "${YELLOW}🔄 Cleaning up existing deployment...${NC}"
docker-compose -f $COMPOSE_FILE down -v --remove-orphans

# Clean up any old certificates
echo -e "${YELLOW}🧹 Cleaning up old certificates...${NC}"
docker volume rm $(docker volume ls -q | grep traefik) 2>/dev/null || true

# Pull latest images
echo -e "${YELLOW}📥 Pulling latest Docker images...${NC}"
docker-compose -f $COMPOSE_FILE pull

# Build and start containers
echo -e "${YELLOW}🏗️ Building and starting containers...${NC}"
docker-compose -f $COMPOSE_FILE up -d --build

# Clean up old images
echo -e "${YELLOW}🧹 Cleaning up old Docker images...${NC}"
docker image prune -f

# Verify deployment
echo -e "${YELLOW}🔍 Verifying deployment...${NC}"
if docker-compose -f $COMPOSE_FILE ps; then
    echo -e "${GREEN}✅ Deployment successful!${NC}"
    echo -e "${YELLOW}📊 Container Status:${NC}"
    docker-compose -f $COMPOSE_FILE ps
else
    echo -e "${RED}❌ Container verification failed${NC}"
    exit 1
fi

# Show initial logs
echo -e "\n${YELLOW}📜 Showing initial container logs (Press Ctrl+C to exit)...${NC}"
docker-compose -f $COMPOSE_FILE logs -f

# Add a useful note about checking logs later
echo -e "\n${GREEN}ℹ️ To check logs later, run:${NC}"
echo "sudo docker-compose -f docker-compose.prod.yml logs -f [service_name]"
echo "Available services: traefik, frontend, backend, postgres"