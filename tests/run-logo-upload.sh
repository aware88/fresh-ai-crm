#!/bin/bash

# Run Bulk Nutrition Logo Upload Script
# This script uploads a logo for the Bulk Nutrition organization

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

# Logo path (default: ../assets/bulk-nutrition-logo.png)
# LOGO_PATH=/path/to/your/logo.png

# Branding colors
PRIMARY_COLOR=#4CAF50
SECONDARY_COLOR=#FFC107
EOL
  echo "Please edit the .env file with your authentication token before running this script again."
  exit 1
fi

# Create assets directory if it doesn't exist
mkdir -p ../assets

# Check if logo file exists
if [ ! -f "../assets/bulk-nutrition-logo.png" ]; then
  echo "⚠️ Logo file not found at ../assets/bulk-nutrition-logo.png"
  echo "Please place your logo file in the assets directory or specify LOGO_PATH in .env"
  exit 1
fi

# Check if node_modules exists
if [ ! -d "../node_modules" ]; then
  echo "Installing dependencies..."
  cd .. && npm install
  cd tests
fi

# Install required packages if not already installed
if ! npm list --depth=0 | grep -q "form-data"; then
  echo "Installing required packages..."
  cd .. && npm install chalk node-fetch dotenv form-data --save-dev
  cd tests
fi

# Run the logo upload script
echo "Running Bulk Nutrition logo upload script..."
node upload-bulk-nutrition-logo.js
