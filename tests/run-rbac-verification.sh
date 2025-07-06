#!/bin/bash

# Run Bulk Nutrition RBAC Verification Script
# This script verifies the RBAC policies for the Bulk Nutrition organization

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
EOL
  echo "Please edit the .env file with your authentication token before running this script again."
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

# Run the verification script
echo "Running Bulk Nutrition RBAC verification script..."
node verify-bulk-nutrition-rbac.js
