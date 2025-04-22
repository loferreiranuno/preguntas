#!/bin/bash

# Display what is being done
echo "Starting deployment process..."

# Pull latest changes from git repository
echo "Pulling latest changes from git repository..."
git pull

# Stop the production containers
echo "Stopping production containers..."
docker compose -f docker-compose.prod.yml down

# Build and start the containers in detached mode
echo "Building and starting production containers in detached mode..."
docker compose -f docker-compose.prod.yml up --build -d

echo "Deployment completed successfully!"