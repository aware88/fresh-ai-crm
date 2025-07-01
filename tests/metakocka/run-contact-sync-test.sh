#!/bin/bash

# Run Metakocka Contact Sync Test Script
# This script runs the test-contact-sync.js script with Node.js

# Check if .env file exists and source it
if [ -f .env ]; then
  echo "Loading environment variables from .env file..."
  export $(grep -v '^#' .env | xargs)
fi

# Set default values if not provided in .env
AUTH_TOKEN=${AUTH_TOKEN:-"YOUR_AUTH_TOKEN"}
CONTACT_ID=${CONTACT_ID:-"YOUR_CONTACT_ID"}
METAKOCKA_ID=${METAKOCKA_ID:-"YOUR_METAKOCKA_ID"}

# Check if required variables are set
if [ "$AUTH_TOKEN" = "YOUR_AUTH_TOKEN" ]; then
  echo "⚠️  Warning: AUTH_TOKEN is not set. Please update it in the .env file or directly in the test script."
fi

if [ "$CONTACT_ID" = "YOUR_CONTACT_ID" ]; then
  echo "⚠️  Warning: CONTACT_ID is not set. Please update it in the .env file or directly in the test script."
fi

# Display test configuration
echo "🔍 Test Configuration:"
echo "  - AUTH_TOKEN: ${AUTH_TOKEN:0:5}... (truncated for security)"
echo "  - CONTACT_ID: $CONTACT_ID"
echo "  - METAKOCKA_ID: $METAKOCKA_ID"
echo ""

# Run the test script
echo "🚀 Running Metakocka contact sync tests..."
node tests/metakocka/test-contact-sync.js

# Check if the script executed successfully
if [ $? -eq 0 ]; then
  echo "✅ Tests completed."
else
  echo "❌ Tests failed with exit code $?."
fi
