#!/bin/bash

# Check if .env file exists
if [ -f .env ]; then
  echo "Loading environment variables from .env file..."
  export $(grep -v '^#' .env | xargs)
else
  echo "Warning: .env file not found. Using default values from the script."
fi

# Run the test script
echo "Running sales document sync test script..."
node test-sales-document-sync.js
