#!/bin/bash

# Run the Metakocka error log management test script

# Check if .env file exists, if not create a sample one
if [ ! -f .env ]; then
  echo "Creating sample .env file..."
  cat > .env << EOL
# Configuration for Metakocka error log management test
AUTH_TOKEN=your_auth_token_here
API_BASE_URL=http://localhost:3000/api
EOL
  echo "Please update the .env file with your actual AUTH_TOKEN before running the test."
  exit 1
fi

# Check if node_modules exists, if not install dependencies
if [ ! -d "../../node_modules" ]; then
  echo "Installing dependencies..."
  cd ../../
  npm install
  cd tests/metakocka
fi

# Run the test script
echo "Running Metakocka error log management tests..."
node test-error-log-management.js
