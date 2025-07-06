#!/bin/bash

# Run Bulk Nutrition Setup Script
# This script sets up the environment and runs the Bulk Nutrition organization setup

# Check if .env file exists, create it if not
if [ ! -f .env ]; then
  echo "Creating sample .env file..."
  cat > .env << EOL
# Authentication token for API access
AUTH_TOKEN=your_auth_token_here

# API base URL (default: http://localhost:3000/api)
API_BASE_URL=http://localhost:3000/api
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

# Run the setup script
echo "Running Bulk Nutrition setup script..."
node setup-bulk-nutrition.js
