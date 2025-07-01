#!/bin/bash

# Change to the script's directory
cd "$(dirname "$0")"

# Load environment variables from .env file if it exists
if [ -f .env ]; then
  echo "Loading environment variables from .env file..."
  export $(grep -v '^#' .env | xargs)
fi

# Check if AUTH_TOKEN is set
if [ -z "$AUTH_TOKEN" ]; then
  echo "Error: AUTH_TOKEN environment variable is required"
  echo "Please create a .env file with AUTH_TOKEN and other required variables"
  exit 1
fi

# Install required dependencies if not already installed
if [ ! -d "node_modules" ]; then
  echo "Installing dependencies..."
  npm install dotenv node-fetch@2
fi

# Run the test script
echo "Starting inventory sync tests..."
node test-inventory-sync.js

# Capture the exit code
test_exit_code=$?

# Exit with the test script's exit code
exit $test_exit_code
