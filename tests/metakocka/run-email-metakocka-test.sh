#!/bin/bash

# Load environment variables from .env file
if [ -f ".env" ]; then
  export $(grep -v '^#' .env | xargs)
else
  echo "⚠️ No .env file found. Please create one based on the email-metakocka-test.env.sample file."
  exit 1
fi

# Check for required environment variables
if [ -z "$AUTH_TOKEN" ]; then
  echo "❌ ERROR: AUTH_TOKEN environment variable is required"
  exit 1
fi

if [ -z "$EMAIL_ID" ]; then
  echo "❌ ERROR: EMAIL_ID environment variable is required"
  exit 1
fi

if [ -z "$CONTACT_ID" ]; then
  echo "❌ ERROR: CONTACT_ID environment variable is required"
  exit 1
fi

# Run the test script
echo "🚀 Running Metakocka Email Integration Tests..."
node test-email-metakocka-integration.js
