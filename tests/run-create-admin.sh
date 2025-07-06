#!/bin/bash

# Run Bulk Nutrition Admin User Creation Script
# This script creates an admin user for the Bulk Nutrition organization

# Check if .env file exists, create it if not
if [ ! -f .env ]; then
  echo "Creating sample .env file..."
  cat > .env << EOL
# Authentication token for API access
AUTH_TOKEN=your_auth_token_here

# API base URL (default: http://localhost:3000/api)
API_BASE_URL=http://localhost:3000/api

# Organization ID (if you know it)
# ORGANIZATION_ID=your_organization_id_here

# Organization slug (will be used to find the ID if not provided)
ORGANIZATION_SLUG=bulk-nutrition

# Admin user details
ADMIN_EMAIL=admin@bulknutrition.com
ADMIN_FIRST_NAME=Bulk
ADMIN_LAST_NAME=Admin
EOL
  echo "Please edit the .env file with your authentication token and admin email before running this script again."
  exit 1
fi

# Check if node_modules exists
if [ ! -d "../node_modules" ]; then
  echo "Installing dependencies..."
  cd .. && npm install
  cd tests
fi

# Install required packages if not already installed
if ! npm list --depth=0 | grep -q "chalk"; then
  echo "Installing required packages..."
  cd .. && npm install chalk node-fetch dotenv --save-dev
  cd tests
fi

# Run the admin user creation script
echo "Running Bulk Nutrition admin user creation script..."
node create-bulk-nutrition-admin.js
