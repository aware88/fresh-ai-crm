#!/bin/bash

# Check if .env file exists
if [ -f .env ]; then
  echo "Loading environment variables from .env file..."
  export $(grep -v '^#' .env | xargs)
else
  echo "Warning: .env file not found. Using default values from the script."
fi

# Run the verification script
echo "Running bidirectional sync verification script..."
node verify-bidirectional-sync.js
