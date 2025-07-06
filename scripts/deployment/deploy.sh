#!/bin/bash

# CRM Mind Deployment Script
# This script handles the deployment of the CRM Mind application

set -e  # Exit immediately if a command exits with a non-zero status

# Configuration
APP_NAME="crm-mind"
DEPLOY_ENV=${1:-"production"}  # Default to production if no argument provided
TIMESTAMP=$(date +"%Y%m%d%H%M%S")
DEPLOY_DIR="/var/www/$APP_NAME"
BACKUP_DIR="/var/www/backups/$APP_NAME"
LOG_DIR="/var/log/$APP_NAME"
ENV_FILE=".env.$DEPLOY_ENV"

# Colors for output
GREEN="\033[0;32m"
YELLOW="\033[1;33m"
RED="\033[0;31m"
NC="\033[0m" # No Color

echo -e "${YELLOW}Starting deployment of CRM Mind to $DEPLOY_ENV environment...${NC}"

# Check if environment file exists
if [ ! -f "$ENV_FILE" ]; then
  echo -e "${RED}Error: Environment file $ENV_FILE not found!${NC}"
  exit 1
fi

# Create directories if they don't exist
mkdir -p "$DEPLOY_DIR"
mkdir -p "$BACKUP_DIR"
mkdir -p "$LOG_DIR"

# Backup current deployment if it exists
if [ -d "$DEPLOY_DIR/current" ]; then
  echo -e "${YELLOW}Backing up current deployment...${NC}"
  cp -r "$DEPLOY_DIR/current" "$BACKUP_DIR/$TIMESTAMP"
fi

# Install dependencies
echo -e "${YELLOW}Installing dependencies...${NC}"
npm ci

# Build the application
echo -e "${YELLOW}Building application...${NC}"
npm run build

# Run database migrations
echo -e "${YELLOW}Running database migrations...${NC}"
npm run migrate:deploy

# Create release directory
RELEASE_DIR="$DEPLOY_DIR/releases/$TIMESTAMP"
mkdir -p "$RELEASE_DIR"

# Copy build files to release directory
echo -e "${YELLOW}Copying files to release directory...${NC}"
cp -r .next "$RELEASE_DIR/"
cp -r public "$RELEASE_DIR/"
cp -r node_modules "$RELEASE_DIR/"
cp package.json "$RELEASE_DIR/"
cp "$ENV_FILE" "$RELEASE_DIR/.env"

# Update symlink
echo -e "${YELLOW}Updating symlink...${NC}"
ln -sfn "$RELEASE_DIR" "$DEPLOY_DIR/current"

# Restart services
echo -e "${YELLOW}Restarting services...${NC}"
pm2 reload $APP_NAME || pm2 start "$DEPLOY_DIR/current/node_modules/.bin/next" --name "$APP_NAME" start -- --port 3000

# Clean up old releases (keep last 5)
echo -e "${YELLOW}Cleaning up old releases...${NC}"
cd "$DEPLOY_DIR/releases" && ls -t | tail -n +6 | xargs -I {} rm -rf {}

echo -e "${GREEN}Deployment of CRM Mind to $DEPLOY_ENV completed successfully!${NC}"
