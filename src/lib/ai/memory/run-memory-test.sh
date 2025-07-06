#!/bin/bash

# Script to run the AI Memory System test

# Load environment variables from project root
ENV_FILE="$(git rev-parse --show-toplevel)/.env.local"
if [ -f "$ENV_FILE" ]; then
  export $(grep -v '^#' "$ENV_FILE" | xargs)
  echo "Loaded environment variables from $ENV_FILE"
else
  echo "Error: .env.local file not found in project root"
  exit 1
fi

# Set required environment variables for the test
export API_BASE_URL="http://localhost:3000"
export AUTH_TOKEN="$NEXTAUTH_SECRET"  # Using NEXTAUTH_SECRET as a fallback

echo "Running AI Memory System tests..."
node --experimental-modules test-memory-service.js
